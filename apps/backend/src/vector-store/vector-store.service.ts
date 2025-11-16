import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

export interface DocumentMetadata {
  documentId: string;
  filename: string;
  chunkIndex: number;
  totalChunks: number;
  contentType?: string;
  uploadedAt?: Date;
}

export interface VectorWithMetadata {
  id: string;
  values: number[];
  metadata: DocumentMetadata & {
    text: string;
  };
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private pinecone: Pinecone;
  private index: any;
  private openai: OpenAI;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const apiKey = this.configService.get<string>('PINECONE_API_KEY');
      const indexName = this.configService.get<string>('PINECONE_INDEX_NAME');

      if (!apiKey || !indexName) {
        throw new Error(
          'PINECONE_API_KEY and PINECONE_INDEX_NAME must be set in environment variables',
        );
      }

      // Initialize Pinecone client
      this.pinecone = new Pinecone({
        apiKey: apiKey,
      });

      // Get index
      this.index = this.pinecone.index(indexName);

      // Initialize OpenAI client
      const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY must be set in environment variables');
      }

      this.openai = new OpenAI({
        apiKey: openaiApiKey,
      });

      this.logger.log('VectorStoreService initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize VectorStoreService', error);
      throw error;
    }
  }

  /**
   * Generate embedding for text using OpenAI
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error: any) {
      // Handle OpenAI API errors
      if (error?.response) {
        const statusCode = error.response?.status;
        const errorMessage = error.response?.data?.error?.message || error.message;
        
        if (statusCode === 429) {
          this.logger.error('OpenAI rate limit exceeded', error);
          throw new Error(
            'OpenAI API rate limit exceeded. Please try again later or check your plan limits.'
          );
        } else if (statusCode === 401) {
          this.logger.error('OpenAI authentication failed', error);
          throw new Error(
            'OpenAI API authentication failed. Please check your API key in .env file.'
          );
        } else if (statusCode === 402 || errorMessage?.includes('quota')) {
          this.logger.error('OpenAI quota exceeded', error);
          throw new Error(
            'OpenAI API quota exceeded. Please check your plan and billing details at https://platform.openai.com/account/billing'
          );
        } else if (statusCode === 500 || statusCode === 503) {
          this.logger.error('OpenAI service unavailable', error);
          throw new Error(
            'OpenAI API service is temporarily unavailable. Please try again later.'
          );
        } else {
          this.logger.error(`OpenAI API error (${statusCode}):`, error);
          throw new Error(`OpenAI API error: ${errorMessage}`);
        }
      }
      
      // Handle other errors
      this.logger.error('Failed to generate embedding', error);
      throw new Error(
        `Embedding generation failed: ${error?.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Store vectors in Pinecone
   */
  async storeVectors(vectors: VectorWithMetadata[]): Promise<void> {
    try {
      if (!vectors || vectors.length === 0) {
        throw new Error('No vectors provided');
      }

      // Prepare vectors for Pinecone (using upsert)
      const pineconeVectors = vectors.map((vector) => ({
        id: vector.id,
        values: vector.values,
        metadata: {
          ...vector.metadata,
          uploadedAt: vector.metadata.uploadedAt?.toISOString(),
        },
      }));

      // Upsert vectors in batches (Pinecone has limits on batch size)
      const batchSize = 100;
      for (let i = 0; i < pineconeVectors.length; i += batchSize) {
        const batch = pineconeVectors.slice(i, i + batchSize);
        await this.index.upsert(batch);
      }

      this.logger.log(`Stored ${vectors.length} vectors in Pinecone`);
    } catch (error) {
      this.logger.error('Failed to store vectors', error);
      throw new Error(`Vector storage failed: ${error.message}`);
    }
  }

  /**
   * Search for similar vectors in Pinecone
   */
  async similaritySearch(
    queryEmbedding: number[],
    topK: number = 5,
    filter?: Record<string, any>,
  ): Promise<Array<{ id: string; score: number; metadata: any }>> {
    try {
      const queryRequest: any = {
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      };

      if (filter) {
        queryRequest.filter = filter;
      }

      const response = await this.index.query(queryRequest);

      return (
        response.matches?.map((match: any) => ({
          id: match.id,
          score: match.score || 0,
          metadata: match.metadata || {},
        })) || []
      );
    } catch (error) {
      this.logger.error('Failed to perform similarity search', error);
      throw new Error(`Similarity search failed: ${error.message}`);
    }
  }

  /**
   * Search by text query (generates embedding and searches)
   */
  async searchByText(
    queryText: string,
    topK: number = 5,
    filter?: Record<string, any>,
  ): Promise<Array<{ id: string; score: number; metadata: any; text: string }>> {
    try {
      const queryEmbedding = await this.generateEmbedding(queryText);
      const results = await this.similaritySearch(queryEmbedding, topK, filter);

      return results.map((result) => ({
        ...result,
        text: result.metadata.text || '',
      }));
    } catch (error) {
      this.logger.error('Failed to search by text', error);
      throw new Error(`Text search failed: ${error.message}`);
    }
  }

  /**
   * Delete vectors by document ID
   */
  async deleteVectorsByDocumentId(documentId: string): Promise<void> {
    try {
      const filter = { documentId: { $eq: documentId } };
      await this.index.deleteMany(filter);
      this.logger.log(`Deleted vectors for document: ${documentId}`);
    } catch (error) {
      this.logger.error('Failed to delete vectors by document ID', error);
      throw new Error(`Delete vectors failed: ${error.message}`);
    }
  }

  /**
   * Delete specific vector by ID
   */
  async deleteVector(vectorId: string): Promise<void> {
    try {
      await this.index.deleteOne(vectorId);
      this.logger.log(`Deleted vector: ${vectorId}`);
    } catch (error) {
      this.logger.error('Failed to delete vector', error);
      throw new Error(`Delete vector failed: ${error.message}`);
    }
  }

  /**
   * Get document metadata by document ID
   */
  async getDocumentMetadata(documentId: string): Promise<DocumentMetadata[]> {
    try {
      // Query with filter to get all chunks for a document
      // Using dummy vector with correct dimension for text-embedding-3-small (1536)
      const dummyVector = new Array(1536).fill(0);
      const results = await this.similaritySearch(
        dummyVector,
        10000, // Large topK to get all chunks
        { documentId: { $eq: documentId } },
      );

      return results.map((result) => ({
        documentId: result.metadata.documentId,
        filename: result.metadata.filename,
        chunkIndex: result.metadata.chunkIndex,
        totalChunks: result.metadata.totalChunks,
        contentType: result.metadata.contentType,
        uploadedAt: result.metadata.uploadedAt
          ? new Date(result.metadata.uploadedAt)
          : undefined,
      }));
    } catch (error) {
      this.logger.error('Failed to get document metadata', error);
      throw new Error(`Get document metadata failed: ${error.message}`);
    }
  }
}
