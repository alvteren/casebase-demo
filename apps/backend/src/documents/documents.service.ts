import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { UploadService } from '../upload/upload.service';
import { UploadedDocument } from '@casebase-demo/shared-types';


@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly vectorStoreService: VectorStoreService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Get list of all documents
   */
  async getAllDocuments(): Promise<UploadedDocument[]> {
    try {
      const documentIds = await this.vectorStoreService.getAllDocumentIds();

      if (documentIds.length === 0) {
        return [];
      }

      // Get metadata for each document
      const documents: UploadedDocument[] = [];

      for (const documentId of documentIds) {
        try {
          const metadata = await this.vectorStoreService.getDocumentMetadata(
            documentId,
          );

          if (metadata.length > 0) {
            // Use first chunk's metadata to get document info
            const firstChunk = metadata[0];
            documents.push({
              documentId: firstChunk.documentId,
              filename: firstChunk.filename,
              contentType: firstChunk.contentType || 'unknown',
              size: firstChunk.size || 0,
              chunkCount: firstChunk.totalChunks,
              uploadedAt: firstChunk.uploadedAt || new Date(),
            });
          }
        } catch (error) {
          this.logger.warn(
            `Failed to get metadata for document ${documentId}`,
            error,
          );
          // Continue with other documents
        }
      }

      // Sort by uploadedAt descending (newest first)
      documents.sort(
        (a, b) =>
          b.uploadedAt.getTime() - a.uploadedAt.getTime(),
      );

      return documents;
    } catch (error) {
      this.logger.error('Failed to get all documents', error);
      throw new Error(
        `Failed to get documents list: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get single document by ID
   */
  async getDocumentById(documentId: string): Promise<UploadedDocument> {
    try {
      const metadata = await this.vectorStoreService.getDocumentMetadata(
        documentId,
      );

      if (metadata.length === 0) {
        throw new NotFoundException(`Document with ID ${documentId} not found`);
      }

      const firstChunk = metadata[0];
      return {
        documentId: firstChunk.documentId,
        filename: firstChunk.filename,
        contentType: firstChunk.contentType || 'unknown',
        size: firstChunk.size || 0,
        chunkCount: firstChunk.totalChunks,
        uploadedAt: firstChunk.uploadedAt || new Date(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get document ${documentId}`, error);
      throw new Error(
        `Failed to get document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete document by ID
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await this.uploadService.deleteDocument(documentId);
      this.logger.log(`Document ${documentId} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete document ${documentId}`, error);
      throw new Error(
        `Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

