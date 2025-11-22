import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VectorStoreService } from '../vector-store/vector-store.service';
import * as mammoth from 'mammoth';
import {PDFParse} from 'pdf-parse';
import { randomUUID } from 'crypto';

export interface UploadedDocument {
  documentId: string;
  filename: string;
  contentType: string;
  size: number;
  chunkCount: number;
  uploadedAt: Date;
  text?: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly maxFileSize: number;
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor(
    private readonly vectorStoreService: VectorStoreService,
    private readonly configService: ConfigService,
  ) {
    this.maxFileSize =
      parseInt(this.configService.get<string>('MAX_FILE_SIZE') || '10485760') ||
      10485760;
    this.chunkSize =
      parseInt(this.configService.get<string>('CHUNK_SIZE') || '1000') || 1000;
    this.chunkOverlap =
      parseInt(this.configService.get<string>('CHUNK_OVERLAP') || '200') ||
      200;
  }

  /**
   * Process uploaded file: extract text, chunk, embed, and store
   */
  async processDocument(
    file: Express.Multer.File,
  ): Promise<UploadedDocument> {
    try {
      this.validateFile(file);

      const documentId = randomUUID();

      const text = await this.extractTextFromFile(file);

      if (!text || text.trim().length === 0) {
        throw new BadRequestException('File contains no extractable text');
      }

      const chunks = this.splitTextIntoChunks(text);

      if (chunks.length === 0) {
        throw new BadRequestException('No valid chunks created from document');
      }

      const vectors = [];
      try {
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = await this.vectorStoreService.generateEmbedding(
            chunk,
          );

          const vectorId = `${documentId}_chunk_${i}`;
          vectors.push({
            id: vectorId,
            values: embedding,
            metadata: {
              documentId,
              filename: file.originalname,
              chunkIndex: i,
              totalChunks: chunks.length,
              contentType: file.mimetype,
              size: file.size,
              uploadedAt: new Date(),
              text: chunk,
            },
          });
        }
      } catch (embeddingError) {
        this.logger.error(
          `Failed to generate embeddings for document ${documentId}`,
          embeddingError,
        );
        throw embeddingError;
      }

      await this.vectorStoreService.storeVectors(vectors);

      this.logger.log(
        `Document ${documentId} processed: ${chunks.length} chunks stored`,
      );

      return {
        documentId,
        filename: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        chunkCount: chunks.length,
        uploadedAt: new Date(),
        text,
      };
    } catch (error) {
      this.logger.error('Error processing document', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize} bytes`,
      );
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} not supported. Supported types: PDF, DOCX, TXT`,
      );
    }
  }

  /**
   * Extract text from file based on its type
   */
  async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    try {
      const mimeType = file.mimetype;

      if (mimeType === 'application/pdf') {
        return await this.extractTextFromPDF(file.buffer);
      } else if (
        mimeType ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        return await this.extractTextFromDOCX(file.buffer);
      } else if (mimeType === 'text/plain') {
        return file.buffer.toString('utf-8');
      } else {
        throw new BadRequestException(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      this.logger.error('Error extracting text from file', error);
      throw new BadRequestException(
        `Failed to extract text from file: ${error.message}`,
      );
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = new PDFParse({ data: buffer });
      const result = await pdfParse.getText();
      
      // TextResult has a 'text' property with the full document text
      return result.text || '';
    } catch (error) {
      this.logger.error('Error parsing PDF', error);
      throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from DOCX
   */
  private async extractTextFromDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      this.logger.error('Error parsing DOCX', error);
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  /**
   * Split text into chunks with overlap
   */
  private splitTextIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    const textLength = text.length;

    if (textLength <= this.chunkSize) {
      return [text];
    }

    let startIndex = 0;

    while (startIndex < textLength) {
      const endIndex = Math.min(startIndex + this.chunkSize, textLength);

      // Try to break at word boundary if not at the end
      let chunkEnd = endIndex;
      if (endIndex < textLength) {
        // Look for sentence ending or word boundary
        const lastPeriod = text.lastIndexOf('.', endIndex);
        const lastNewline = text.lastIndexOf('\n', endIndex);
        const lastSpace = text.lastIndexOf(' ', endIndex);

        const breakPoint = Math.max(lastPeriod, lastNewline, lastSpace);
        if (breakPoint > startIndex + this.chunkSize * 0.5) {
          // Only use break point if it's not too far back
          chunkEnd = breakPoint + 1;
        }
      }

      const chunk = text.substring(startIndex, chunkEnd).trim();

      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      // Move start index forward with overlap
      startIndex = Math.max(
        chunkEnd - this.chunkOverlap,
        startIndex + 1, // Ensure progress
      );

      // Prevent infinite loop
      if (startIndex >= textLength) {
        break;
      }
    }

    return chunks;
  }

  /**
   * Get document metadata by document ID
   */
  async getDocumentMetadata(documentId: string) {
    return await this.vectorStoreService.getDocumentMetadata(documentId);
  }

  /**
   * Delete document and all its chunks
   */
  async deleteDocument(documentId: string): Promise<void> {
    await this.vectorStoreService.deleteVectorsByDocumentId(documentId);
    this.logger.log(`Document ${documentId} and all chunks deleted`);
  }
}
