import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatHistory, ChatHistoryDocument } from './schemas/chat-history.schema';
import { randomUUID } from 'crypto';
import { ChatHistoryMessage } from '@casebase-demo/shared-types';

@Injectable()
export class ChatHistoryService {
  private readonly logger = new Logger(ChatHistoryService.name);

  constructor(
    @InjectModel(ChatHistory.name)
    private chatHistoryModel: Model<ChatHistoryDocument>,
  ) {}

  /**
   * Create a new chat history
   */
  async createChatHistory(chatId?: string): Promise<ChatHistoryDocument> {
    const id = chatId || randomUUID();
    const history = new this.chatHistoryModel({
      chatId: id,
      messages: [],
    });
    const saved = await history.save();
    this.logger.log(`Created new chat history: ${id}`);
    return saved;
  }

  /**
   * Get chat history by ID
   * @throws NotFoundException if chat history not found
   */
  async getChatHistory(chatId: string): Promise<ChatHistoryDocument> {
    const history = await this.chatHistoryModel.findOne({ chatId }).exec();
    if (!history) {
      this.logger.warn(`Chat history not found: ${chatId}`);
      throw new NotFoundException(`Chat history with ID ${chatId} not found`);
    }
    return history;
  }

  /**
   * Find chat history by ID (returns null if not found, for internal use)
   */
  async findChatHistory(chatId: string): Promise<ChatHistoryDocument | null> {
    return await this.chatHistoryModel.findOne({ chatId }).exec();
  }

  /**
   * Get all chat histories (for listing)
   */
  async getAllChatHistories(): Promise<ChatHistoryDocument[]> {
    return await this.chatHistoryModel
      .find()
      .sort({ updatedAt: -1 })
      .exec();
  }

  /**
   * Add message to chat history
   */
  async addMessage(chatId: string, message: ChatHistoryMessage): Promise<ChatHistoryDocument> {
    let history = await this.findChatHistory(chatId);
    if (!history) {
      history = await this.createChatHistory(chatId);
    }
    history.messages.push(message);
    history.updatedAt = new Date();
    const saved = await history.save();
    this.logger.log(`Added message to chat history: ${chatId} (${saved.messages.length} messages)`);
    return saved;
  }

  /**
   * Update chat history with full messages array
   */
  async updateChatHistory(chatId: string, messages: ChatHistoryMessage[]): Promise<ChatHistoryDocument> {
    let history = await this.findChatHistory(chatId);
    if (!history) {
      history = await this.createChatHistory(chatId);
    }
    history.messages = messages;
    history.updatedAt = new Date();
    const saved = await history.save();
    this.logger.log(`Updated chat history: ${chatId} (${messages.length} messages)`);
    return saved;
  }

  /**
   * Delete chat history
   */
  async deleteChatHistory(chatId: string): Promise<boolean> {
    const result = await this.chatHistoryModel.deleteOne({ chatId }).exec();
    if (result.deletedCount > 0) {
      this.logger.log(`Deleted chat history: ${chatId}`);
      return true;
    }
    return false;
  }

  /**
   * Get messages for OpenAI API format (only user and assistant messages, no system)
   */
  getMessagesForOpenAI(history: ChatHistoryDocument): Array<{ role: 'user' | 'assistant'; content: string }> {
    return history.messages
      .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
  }
}

