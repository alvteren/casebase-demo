export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: Array<{
    text: string;
    score: number;
    source?: string;
  }>;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface ChatQueryDto {
  message: string;
  chatId?: string;
  topK?: number;
  useRAG?: boolean;
  compressPrompt?: boolean;
  maxSummaryTokens?: number;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    answer: string;
    chatId?: string;
    context?: Array<{
      text: string;
      score: number;
      source?: string;
    }>;
    tokensUsed?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
  error?: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  data?: {
    chatId: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
}

export interface ChatHistoryListItem {
  chatId: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessage: ChatMessage | null;
}

export interface ChatHistoryListResponse {
  success: boolean;
  data?: ChatHistoryListItem[];
  error?: string;
}

export class ChatService {
  private readonly baseUrl = (process.env["REACT_APP_BACKEND_URL"]);

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

