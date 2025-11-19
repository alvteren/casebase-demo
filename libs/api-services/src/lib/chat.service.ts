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
  topK?: number;
  useRAG?: boolean;
  compressPrompt?: boolean;
  maxSummaryTokens?: number;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    answer: string;
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

export class ChatService {
  private readonly baseUrl = (process.env["REACT_APP_BACKEND_URL"]);

  /**
   * Send a chat query to the RAG pipeline
   * @param message - The user's message
   * @param options - Optional query parameters
   * @returns Promise with chat response
   * @throws Error if request fails
   */
  async query(
    message: string,
    options?: {
      topK?: number;
      useRAG?: boolean;
      compressPrompt?: boolean;
      maxSummaryTokens?: number;
    },
  ): Promise<ChatResponse> {
    const body: ChatQueryDto = {
      message,
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
}

// Export singleton instance
export const chatService = new ChatService();

