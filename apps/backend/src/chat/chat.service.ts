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

    // System instruction for general questions
    this.generalSystemInstruction = `You are a helpful AI assistant. Answer questions clearly and comprehensively. 
If the question is about uploaded documents, refer to the context provided. 
Otherwise, use your general knowledge to provide helpful answers.`;
  }

  private readonly generalSystemInstruction: string;

  /**
   * Process a user query through the RAG pipeline or general chat
   */
  async query(
    userMessage: string,
    topK: number = 5,
    useRAG: boolean = true,
  ): Promise<ChatResponse> {
    try {
      this.logger.log(`Processing query: ${userMessage.substring(0, 50)}...`);

      let searchResults: Array<{ id: string; score: number; metadata: any }> =
        [];
      let context = '';
      let useRAGContext = false;

      if (useRAG) {
        try {
          // Step 1: Embed user query
          const queryEmbedding =
            await this.vectorStoreService.generateEmbedding(userMessage);

          // Step 2: Fetch relevant context from Pinecone
          searchResults = await this.vectorStoreService.similaritySearch(
            queryEmbedding,
            topK,
          );

          // Step 3: Check if we have relevant context (score threshold)
          const relevanceThreshold = 0.5;
          const relevantResults = searchResults.filter(
            (r) => r.score >= relevanceThreshold,
          );

          if (relevantResults.length > 0) {
            useRAGContext = true;
            context = this.buildContextFromResults(relevantResults);
          } else if (searchResults.length > 0) {
            // Low relevance, but still use context
            useRAGContext = true;
            context = this.buildContextFromResults(searchResults);
          }
        } catch (error) {
          this.logger.warn(
            'Failed to retrieve context from vector store, falling back to general chat',
            error,
          );
          // Fall back to general chat if vector store fails
        }
      }

      // Step 4: Compose messages
      const messages: ChatMessage[] = [];

      if (useRAGContext && context) {
        // Use RAG with context
        messages.push({
          role: 'system',
          content: this.systemInstruction,
        });
        messages.push({
          role: 'user',
          content: this.composePrompt(userMessage, context),
        });
      } else {
        // Use general chat
        messages.push({
          role: 'system',
          content: this.generalSystemInstruction,
        });
        messages.push({
          role: 'user',
          content: userMessage,
        });
      }

      // Step 5: Send to OpenAI Chat Completion
      const completion = await this.openaiService.createChatCompletion(
        messages,
        {
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 1000,
        },
      );

      const answer = completion.choices[0]?.message?.content || '';

      // Step 6: Return clean answer with context (if available)
      return {
        answer,
        context:
          useRAGContext && searchResults.length > 0
            ? searchResults.map((result) => ({
                text: result.metadata?.text || '',
                score: result.score,
                source: result.metadata?.filename || undefined,
              }))
            : undefined,
        tokensUsed: {
          prompt: completion.usage?.prompt_tokens || 0,
          completion: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      this.logger.error('Error in chat pipeline', error);
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
