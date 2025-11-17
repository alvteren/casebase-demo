import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService implements OnModuleInit {
  private readonly logger = new Logger(OpenAIService.name);
  private client: OpenAI;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY must be set in environment variables');
      }

      this.client = new OpenAI({
        apiKey: openaiApiKey,
      });

      this.logger.log('OpenAIService initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize OpenAIService', error);
      throw error;
    }
  }

  /**
   * Get OpenAI client instance
   */
  getClient(): OpenAI {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }
    return this.client;
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error: any) {
      // Handle OpenAI API errors
      if (error?.response) {
        const statusCode = error.response?.status;
        const errorMessage =
          error.response?.data?.error?.message || error.message;

        if (statusCode === 429) {
          this.logger.error('OpenAI rate limit exceeded', error);
          throw new Error(
            'OpenAI API rate limit exceeded. Please try again later or check your plan limits.',
          );
        } else if (statusCode === 401) {
          this.logger.error('OpenAI authentication failed', error);
          throw new Error(
            'OpenAI API authentication failed. Please check your API key in .env file.',
          );
        } else if (statusCode === 402 || errorMessage?.includes('quota')) {
          this.logger.error('OpenAI quota exceeded', error);
          throw new Error(
            'OpenAI API quota exceeded. Please check your plan and billing details at https://platform.openai.com/account/billing',
          );
        } else if (statusCode === 500 || statusCode === 503) {
          this.logger.error('OpenAI service unavailable', error);
          throw new Error(
            'OpenAI API service is temporarily unavailable. Please try again later.',
          );
        } else {
          this.logger.error(`OpenAI API error (${statusCode}):`, error);
          throw new Error(`OpenAI API error: ${errorMessage}`);
        }
      }

      // Handle other errors
      this.logger.error('Failed to generate embedding', error);
      throw new Error(
        `Embedding generation failed: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Create chat completion
   */
  async createChatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    },
  ) {
    try {
      const completion = await this.client.chat.completions.create({
        model: options?.model || 'gpt-4o-mini',
        messages: messages as any,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 1000,
      });

      return completion;
    } catch (error: any) {
      // Handle OpenAI API errors
      if (error?.response) {
        const statusCode = error.response?.status;
        const errorMessage =
          error.response?.data?.error?.message || error.message;

        if (statusCode === 429) {
          this.logger.error('OpenAI rate limit exceeded', error);
          throw new Error(
            'OpenAI API rate limit exceeded. Please try again later or check your plan limits.',
          );
        } else if (statusCode === 401) {
          this.logger.error('OpenAI authentication failed', error);
          throw new Error(
            'OpenAI API authentication failed. Please check your API key in .env file.',
          );
        } else if (statusCode === 402 || errorMessage?.includes('quota')) {
          this.logger.error('OpenAI quota exceeded', error);
          throw new Error(
            'OpenAI API quota exceeded. Please check your plan and billing details at https://platform.openai.com/account/billing',
          );
        } else if (statusCode === 500 || statusCode === 503) {
          this.logger.error('OpenAI service unavailable', error);
          throw new Error(
            'OpenAI API service is temporarily unavailable. Please try again later.',
          );
        } else {
          this.logger.error(`OpenAI API error (${statusCode}):`, error);
          throw new Error(`OpenAI API error: ${errorMessage}`);
        }
      }

      // Handle other errors
      this.logger.error('Failed to create chat completion', error);
      throw new Error(
        `Chat completion failed: ${error?.message || 'Unknown error'}`,
      );
    }
  }
}

