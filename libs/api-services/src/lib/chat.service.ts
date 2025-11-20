import {
  ChatMessage,
  ChatQueryDto,
  ChatHistoryMessage,
  ChatHistoryListItem,
  ApiResponse,
  ContextItem,
  TokensUsed,
} from '@casebase-demo/shared-types';

// Re-export for convenience
export type { ChatMessage, ChatQueryDto, ChatHistoryMessage, ChatHistoryListItem };

// API-specific response types
export type ChatResponse = ApiResponse<{
  answer: string;
  chatId?: string;
  context?: ContextItem[];
  tokensUsed?: TokensUsed;
}>;

export type ChatHistoryResponse = ApiResponse<{
  chatId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}>;

export type ChatHistoryListResponse = ApiResponse<ChatHistoryListItem[]>;

export class ChatService {
  private readonly baseUrl = (process.env["REACT_APP_BACKEND_URL"]);

  /**
   * Send a streaming chat query to the RAG pipeline
   * @param message - The user's message
   * @param options - Optional query parameters including chatId
   * @param onChunk - Callback for each chunk of text
   * @param onContext - Callback when context is received
   * @param onDone - Callback when streaming is complete
   * @throws Error if request fails
   */
  async queryStream(
    message: string,
    options: {
      chatId?: string;
      topK?: number;
      useRAG?: boolean;
      compressPrompt?: boolean;
      maxSummaryTokens?: number;
    },
    onChunk: (chunk: string) => void,
    onContext?: (context: Array<{ text: string; score: number; source?: string }>) => void,
    onDone?: (data: { chatId: string; answer: string; context?: Array<{ text: string; score: number; source?: string }> }) => void,
  ): Promise<void> {
    const body: ChatQueryDto = {
      message,
      chatId: options?.chatId,
      topK: options?.topK ?? 5,
      useRAG: options?.useRAG ?? true,
      compressPrompt: options?.compressPrompt ?? true,
      maxSummaryTokens: options?.maxSummaryTokens ?? 500,
    };

    const response = await fetch(`${this.baseUrl}/chat/query/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(errorData.message || `Request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let chatId = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              switch (data.type) {
                case 'chatId':
                  chatId = data.data;
                  break;
                case 'chunk':
                  onChunk(data.data);
                  break;
                case 'context':
                  onContext?.(data.data);
                  break;
                case 'done':
                  onDone?.(data.data);
                  break;
                case 'error':
                  throw new Error(data.data);
                default:
                  // Unknown type, ignore
                  break;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Send a chat query to the RAG pipeline
   * @param message - The user's message
   * @param options - Optional query parameters including chatId
   * @returns Promise with chat response
   * @throws Error if request fails
   */
  async query(
    message: string,
    options?: {
      chatId?: string;
      topK?: number;
      useRAG?: boolean;
      compressPrompt?: boolean;
      maxSummaryTokens?: number;
    },
  ): Promise<ChatResponse> {
    const body: ChatQueryDto = {
      message,
      chatId: options?.chatId,
      topK: options?.topK ?? 5,
      useRAG: options?.useRAG ?? true,
      compressPrompt: options?.compressPrompt ?? true,
      maxSummaryTokens: options?.maxSummaryTokens ?? 500,
    };

    const response = await fetch(`${this.baseUrl}/chat/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(errorData.message || `Request failed: ${response.statusText}`);
    }

    const data: ChatResponse = await response.json();
    return data;
  }

  /**
   * Get chat history by ID
   * @param chatId - The chat ID
   * @returns Promise with chat history
   * @throws Error if request fails
   */
  async getChatHistory(chatId: string): Promise<ChatHistoryResponse> {
    const response = await fetch(`${this.baseUrl}/chat/history/${chatId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(errorData.message || `Request failed: ${response.statusText}`);
    }

    const data: ChatHistoryResponse = await response.json();
    return data;
  }

  /**
   * Get all chat histories
   * @returns Promise with list of chat histories
   * @throws Error if request fails
   */
  async getAllChatHistories(): Promise<ChatHistoryListResponse> {
    const response = await fetch(`${this.baseUrl}/chat/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(errorData.message || `Request failed: ${response.statusText}`);
    }

    const data: ChatHistoryListResponse = await response.json();
    return data;
  }

  /**
   * Create a new chat
   * @returns Promise with new chat history
   * @throws Error if request fails
   */
  async createChat(): Promise<ChatHistoryResponse> {
    const response = await fetch(`${this.baseUrl}/chat/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(errorData.message || `Request failed: ${response.statusText}`);
    }

    const data: ChatHistoryResponse = await response.json();
    return data;
  }

  /**
   * Delete chat history
   * @param chatId - The chat ID to delete
   * @returns Promise<void>
   * @throws Error if request fails
   */
  async deleteChatHistory(chatId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chat/history/${chatId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(errorData.message || `Request failed: ${response.statusText}`);
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();

