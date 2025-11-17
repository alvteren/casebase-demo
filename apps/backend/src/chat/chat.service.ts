import { Injectable, Logger } from '@nestjs/common';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { OpenAIService } from '../openai/openai.service';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
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
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly systemInstruction: string;

  constructor(
    private readonly vectorStoreService: VectorStoreService,
    private readonly openaiService: OpenAIService,
  ) {
    // System instruction for RAG
    this.systemInstruction = `You are a helpful assistant that answers questions based on the provided context from uploaded documents. 
Use the context information to answer the user's question accurately and comprehensively. 
If the context doesn't contain enough information to answer the question, say so clearly.
Always cite the source when possible.`;
  }

  /**
   * Process a user query through the RAG pipeline
   */
  async query(
    userMessage: string,
    topK: number = 5,
  ): Promise<ChatResponse> {
    try {
      this.logger.log(`Processing query: ${userMessage.substring(0, 50)}...`);

      // Step 1: Embed user query
      const queryEmbedding = await this.vectorStoreService.generateEmbedding(
        userMessage,
      );

      // Step 2: Fetch relevant context from Pinecone
      const searchResults = await this.vectorStoreService.similaritySearch(
        queryEmbedding,
        topK,
      );

      // Step 3: Compose the final prompt
      const context = this.buildContextFromResults(searchResults);
      const prompt = this.composePrompt(userMessage, context);

      // Step 4: Send to OpenAI Chat Completion
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: this.systemInstruction,
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      const completion = await this.openaiService.createChatCompletion(
        messages,
        {
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 1000,
        },
      );

      const answer = completion.choices[0]?.message?.content || '';

      // Step 5: Return clean answer with context
      return {
        answer,
        context: searchResults.map((result) => ({
          text: result.metadata?.text || '',
          score: result.score,
          source: result.metadata?.filename || undefined,
        })),
        tokensUsed: {
          prompt: completion.usage?.prompt_tokens || 0,
          completion: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      this.logger.error('Error in RAG pipeline', error);
      throw error;
    }
  }

  /**
   * Build context string from search results
   */
  private buildContextFromResults(
    results: Array<{ id: string; score: number; metadata: any }>,
  ): string {
    if (results.length === 0) {
      return 'No relevant context found in the knowledge base.';
    }

    const contextParts = results.map((result, index) => {
      const text = result.metadata?.text || '';
      const filename = result.metadata?.filename || 'Unknown';
      const score = result.score.toFixed(3);

      return `[Context ${index + 1}] (Source: ${filename}, Relevance: ${score})\n${text}`;
    });

    return contextParts.join('\n\n---\n\n');
  }

  /**
   * Compose the final prompt with instruction, context, and user question
   */
  private composePrompt(userQuestion: string, context: string): string {
    return `Based on the following context from uploaded documents, please answer the user's question.

Context from documents:
${context}

User's question: ${userQuestion}

Please provide a comprehensive answer based on the context above. If the context doesn't contain enough information, please say so.`;
  }
}
