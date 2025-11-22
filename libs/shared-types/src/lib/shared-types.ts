/**
 * Shared types for frontend and backend
 * This library ensures type consistency across the application
 */

/**
 * Chat message role types
 */
export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * Frontend chat message role (excludes system)
 */
export type FrontendChatRole = 'user' | 'assistant';

/**
 * Context item from vector search
 */
export interface ContextItem {
  text: string;
  score: number;
  source?: string;
}

/**
 * Token usage information
 */
export interface TokensUsed {
  prompt: number;
  completion: number;
  total: number;
}

/**
 * Chat message interface for frontend (with timestamp, excludes system role)
 */
export interface ChatMessage {
  role: FrontendChatRole;
  content: string;
  timestamp: Date;
  context?: ContextItem[];
  tokensUsed?: TokensUsed;
}

/**
 * Chat message for OpenAI API (simplified, no timestamp)
 */
export interface OpenAIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Chat query DTO for API requests
 */
export interface ChatQueryDto {
  message: string;
  chatId?: string;
  topK?: number;
  useRAG?: boolean;
  compressPrompt?: boolean;
  maxSummaryTokens?: number;
}

/**
 * Chat response from backend
 */
export interface ChatResponse {
  answer: string;
  context?: ContextItem[];
  tokensUsed?: TokensUsed;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Chat history message (with timestamp)
 */
export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: ContextItem[];
  tokensUsed?: TokensUsed;
}

/**
 * Chat history item in list
 */
export interface ChatHistoryListItem {
  chatId: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessage: ChatHistoryMessage | null;
}

/**
 * Chat history response
 */
export interface ChatHistoryResponse {
  chatId: string;
  messages: ChatHistoryMessage[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Document metadata
 */
export interface DocumentMetadata {
  documentId: string;
  filename: string;
  chunkIndex: number;
  size: number;
  totalChunks: number;
  contentType?: string;
  uploadedAt?: Date;
}

/**
 * Uploaded document
 */
export interface UploadedDocument {
  documentId: string;
  filename: string;
  contentType: string;
  size: number;
  chunkCount: number;
  uploadedAt: Date;
  text?: string;
}

/**
 * Document summary
 */
export interface DocumentSummary {
  documentId: string;
  filename: string;
  contentType: string;
  size: number;
  chunkCount: number;
  uploadedAt: string;
}
