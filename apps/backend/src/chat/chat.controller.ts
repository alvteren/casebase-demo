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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatHistoryService } from './chat-history.service';
import { ChatQueryDto, ChatResponse } from '@casebase-demo/shared-types';

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

  /**
   * Stream chat query with Server-Sent Events
   */
  @Post('query/stream')
  async queryStream(
    @Body() body: ChatQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Validate input
      if (!body.message || typeof body.message !== 'string') {
        throw new BadRequestException('Message is required and must be a string');
      }

      const message = body.message.trim();
      if (message.length === 0) {
        throw new BadRequestException('Message cannot be empty');
      }

      const topK = body.topK !== undefined ? body.topK : 5;
      if (topK < 1 || topK > 20) {
        throw new BadRequestException('topK must be between 1 and 20');
      }

      const useRAG = body.useRAG !== undefined ? body.useRAG : true;
      const compressPrompt = body.compressPrompt !== undefined ? body.compressPrompt : true;
      const maxSummaryTokens = body.maxSummaryTokens !== undefined ? body.maxSummaryTokens : 500;

      if (maxSummaryTokens < 100 || maxSummaryTokens > 2000) {
        throw new BadRequestException('maxSummaryTokens must be between 100 and 2000');
      }

      // Get or create chat history
      let chatId = body.chatId;
      let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

      if (chatId) {
        try {
          const history = await this.chatHistoryService.getChatHistory(chatId);
          conversationHistory = this.chatHistoryService.getMessagesForOpenAI(history);
        } catch (error) {
          if (error instanceof NotFoundException) {
            await this.chatHistoryService.createChatHistory(chatId);
          } else {
            throw error;
          }
        }
      } else {
        const newHistory = await this.chatHistoryService.createChatHistory();
        chatId = newHistory.chatId;
      }

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Send initial chatId
      res.write(`data: ${JSON.stringify({ type: 'chatId', data: chatId })}\n\n`);

      let fullAnswer = '';
      let context: Array<{ text: string; score: number; source?: string }> | undefined;

      // Stream the response
      try {
        for await (const chunk of this.chatService.queryStream(
          message,
          topK,
          useRAG,
          compressPrompt,
          maxSummaryTokens,
          conversationHistory,
        )) {
          if (chunk.type === 'chunk') {
            fullAnswer += chunk.data;
            res.write(`data: ${JSON.stringify({ type: 'chunk', data: chunk.data })}\n\n`);
          } else if (chunk.type === 'context') {
            context = chunk.data;
            res.write(`data: ${JSON.stringify({ type: 'context', data: chunk.data })}\n\n`);
          } else if (chunk.type === 'done') {
            fullAnswer = chunk.data.answer;
            context = chunk.data.context;

            // Save messages to history
            await this.chatHistoryService.addMessage(chatId, {
              role: 'user',
              content: message,
              timestamp: new Date(),
            });

            await this.chatHistoryService.addMessage(chatId, {
              role: 'assistant',
              content: fullAnswer,
              timestamp: new Date(),
              context,
            });

            res.write(`data: ${JSON.stringify({ type: 'done', data: { chatId, answer: fullAnswer, context } })}\n\n`);
            res.end();
            return;
          }
        }
      } catch (error) {
        this.logger.error('Error in streaming chat query', error);
        res.write(`data: ${JSON.stringify({ type: 'error', data: error?.message || 'Streaming failed' })}\n\n`);
        res.end();
      }
    } catch (error) {
      this.logger.error('Error processing streaming chat query', error);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        res.status(error.getStatus()).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: `Failed to process streaming chat query: ${error?.message || 'Unknown error'}`,
      });
    }
  }
}

