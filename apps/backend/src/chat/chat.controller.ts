import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ChatService, ChatResponse } from './chat.service';

export interface ChatQueryDto {
  message: string;
  topK?: number;
}

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post('query')
  async query(
    @Body() body: ChatQueryDto,
  ): Promise<{
    success: boolean;
    data?: ChatResponse;
    error?: string;
  }> {
    try {
      // Validate input
      if (!body.message || typeof body.message !== 'string') {
        throw new BadRequestException('Message is required and must be a string');
      }

      const message = body.message.trim();
      if (message.length === 0) {
        throw new BadRequestException('Message cannot be empty');
      }

      // Validate topK if provided
      const topK = body.topK !== undefined ? body.topK : 5;
      if (topK < 1 || topK > 20) {
        throw new BadRequestException(
          'topK must be between 1 and 20',
        );
      }

      // Run RAG pipeline
      const result = await this.chatService.query(message, topK);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Error processing chat query', error);

      // Handle specific error types
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Check for OpenAI quota/rate limit errors
      const errorMessage = error?.message || 'Unknown error';
      if (
        errorMessage.includes('quota') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('OpenAI')
      ) {
        throw new InternalServerErrorException({
          message: errorMessage,
          error: 'OpenAI API Error',
          statusCode: 500,
        });
      }

      // Generic error
      throw new InternalServerErrorException({
        message: `Failed to process chat query: ${errorMessage}`,
        error: 'Chat Processing Error',
        statusCode: 500,
      });
    }
  }
}

