import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ChatService, ChatResponse } from './chat.service';
import { ChatHistoryService } from './chat-history.service';

export interface ChatQueryDto {
  message: string;
  chatId?: string;
  topK?: number;
  useRAG?: boolean;
  compressPrompt?: boolean; // Enable/disable prompt compression
  maxSummaryTokens?: number; // Max tokens for compressed context
}

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly chatHistoryService: ChatHistoryService,
  ) {}

  @Post('query')
  async query(
    @Body() body: ChatQueryDto,
  ): Promise<{
    success: boolean;
    data?: ChatResponse & { chatId?: string };
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

      // Use RAG by default, but allow disabling it
      const useRAG = body.useRAG !== undefined ? body.useRAG : true;

      // Enable prompt compression by default for token efficiency
      const compressPrompt = body.compressPrompt !== undefined ? body.compressPrompt : true;
      const maxSummaryTokens = body.maxSummaryTokens !== undefined ? body.maxSummaryTokens : 500;

      // Validate maxSummaryTokens
      if (maxSummaryTokens < 100 || maxSummaryTokens > 2000) {
        throw new BadRequestException(
          'maxSummaryTokens must be between 100 and 2000',
        );
      }

      // Get or create chat history
      let chatId = body.chatId;
      let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

      if (chatId) {
        try {
          const history = await this.chatHistoryService.getChatHistory(chatId);
          conversationHistory = this.chatHistoryService.getMessagesForOpenAI(history);
        } catch (error) {
          // Chat not found, create new one with provided chatId
          if (error instanceof NotFoundException) {
            await this.chatHistoryService.createChatHistory(chatId);
          } else {
            throw error;
          }
        }
      } else {
        // Create new chat if no chatId provided
        const newHistory = await this.chatHistoryService.createChatHistory();
        chatId = newHistory.chatId;
      }

      // Run chat pipeline (RAG or general) with conversation history
      const result = await this.chatService.query(
        message,
        topK,
        useRAG,
        compressPrompt,
        maxSummaryTokens,
        conversationHistory,
      );

      // Save user message to history
      await this.chatHistoryService.addMessage(chatId, {
        role: 'user',
        content: message,
        timestamp: new Date(),
      });

      // Save assistant response to history
      await this.chatHistoryService.addMessage(chatId, {
        role: 'assistant',
        content: result.answer,
        timestamp: new Date(),
        context: result.context,
        tokensUsed: result.tokensUsed,
      });

      return {
        success: true,
        data: {
          ...result,
          chatId: chatId as string,
        },
      };
    } catch (error) {
      this.logger.error('Error processing chat query', error);

      // Handle specific error types
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
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

  /**
   * Get chat history by ID
   */
  @Get('history/:chatId')
  async getChatHistory(@Param('chatId') chatId: string) {
    try {
      const history = await this.chatHistoryService.getChatHistory(chatId);
      return {
        success: true,
        data: {
          chatId: history.chatId,
          messages: history.messages,
          createdAt: history.createdAt,
          updatedAt: history.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting chat history ${chatId}`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get chat history');
    }
  }

  /**
   * Get all chat histories
   */
  @Get('history')
  async getAllChatHistories() {
    try {
      const histories = await this.chatHistoryService.getAllChatHistories();
      return {
        success: true,
        data: histories.map((h) => ({
          chatId: h.chatId,
          messageCount: h.messages.length,
          createdAt: h.createdAt,
          updatedAt: h.updatedAt,
          lastMessage: h.messages.length > 0 ? h.messages[h.messages.length - 1] : null,
        })),
      };
    } catch (error) {
      this.logger.error('Error getting all chat histories', error);
      throw new InternalServerErrorException('Failed to get chat histories');
    }
  }

  /**
   * Create a new chat
   */
  @Post('history')
  async createChat() {
    try {
      const history = await this.chatHistoryService.createChatHistory();
      return {
        success: true,
        data: {
          chatId: history.chatId,
          messages: history.messages,
          createdAt: history.createdAt,
          updatedAt: history.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error('Error creating chat history', error);
      throw new InternalServerErrorException('Failed to create chat history');
    }
  }

  /**
   * Delete chat history
   */
  @Delete('history/:chatId')
  async deleteChatHistory(@Param('chatId') chatId: string) {
    try {
      const deleted = await this.chatHistoryService.deleteChatHistory(chatId);
      if (!deleted) {
        throw new NotFoundException(`Chat history with ID ${chatId} not found`);
      }
      return {
        success: true,
        message: `Chat history ${chatId} deleted successfully`,
      };
    } catch (error) {
      this.logger.error(`Error deleting chat history ${chatId}`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete chat history');
    }
  }
}

