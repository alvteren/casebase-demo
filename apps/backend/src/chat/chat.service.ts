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
    compressPrompt: boolean = true,
    maxSummaryTokens: number = 500,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
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
            const rawContext = this.buildContextFromResults(relevantResults);
            // Compress context to reduce token usage if enabled
            context = compressPrompt
              ? await this.compressContext(rawContext, userMessage, maxSummaryTokens)
              : rawContext;
          } else if (searchResults.length > 0) {
            // Low relevance, but still use context
            useRAGContext = true;
            const rawContext = this.buildContextFromResults(searchResults);
            // Compress context to reduce token usage if enabled
            context = compressPrompt
              ? await this.compressContext(rawContext, userMessage, maxSummaryTokens)
              : rawContext;
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

      // Add system instruction
      if (useRAGContext && context) {
        messages.push({
          role: 'system',
          content: this.systemInstruction,
        });
      } else {
        messages.push({
          role: 'system',
          content: this.generalSystemInstruction,
        });
      }

      // Add conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        // Add history messages (last 10 messages to avoid token limit)
        const recentHistory = conversationHistory.slice(-10);
        for (const msg of recentHistory) {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      // Add current user message
      if (useRAGContext && context) {
        messages.push({
          role: 'user',
          content: this.composePrompt(userMessage, context),
        });
      } else {
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
   * Compress context by summarizing retrieved chunks to reduce token usage
   */
  private async compressContext(
    context: string,
    userQuestion: string,
    maxSummaryTokens: number = 500,
  ): Promise<string> {
    try {
      // If context is already short, skip compression
      const estimatedTokens = context.length / 4; // Rough estimate: ~4 chars per token
      if (estimatedTokens <= maxSummaryTokens) {
        this.logger.log('Context is already short, skipping compression');
        return context;
      }

      this.logger.log(
        `Compressing context (estimated ${Math.round(estimatedTokens)} tokens -> target ${maxSummaryTokens} tokens)`,
      );

      const compressionPrompt = `You are a context compression assistant. Your task is to summarize the following retrieved document chunks while preserving all information relevant to answering the user's question.

User's question: ${userQuestion}

Retrieved context chunks:
${context}

Instructions:
1. Summarize each chunk, keeping only information relevant to the user's question
2. Preserve key facts, numbers, dates, and specific details
3. Maintain source attribution (filename) for each summarized chunk
4. Remove redundant information
5. Keep the summary concise but comprehensive
6. Target length: approximately ${maxSummaryTokens} tokens or less

Provide a compressed summary that maintains all relevant information:`;

      const compressionMessages: ChatMessage[] = [
        {
          role: 'system',
          content:
            'You are an expert at compressing and summarizing text while preserving critical information.',
        },
        {
          role: 'user',
          content: compressionPrompt,
        },
      ];

      const compressionResult =
        await this.openaiService.createChatCompletion(compressionMessages, {
          model: 'gpt-4o-mini',
          temperature: 0.3, // Lower temperature for more consistent summarization
          max_tokens: maxSummaryTokens + 100, // Allow slightly more for safety
        });

      const compressedContext =
        compressionResult.choices[0]?.message?.content || context;

      const compressedTokens = compressedContext.length / 4;
      const compressionRatio =
        ((estimatedTokens - compressedTokens) / estimatedTokens) * 100;

      this.logger.log(
        `Context compressed: ${Math.round(estimatedTokens)} -> ${Math.round(compressedTokens)} tokens (${compressionRatio.toFixed(1)}% reduction)`,
      );

      return compressedContext;
    } catch (error) {
      this.logger.warn(
        'Failed to compress context, using original context',
        error,
      );
      // Fall back to original context if compression fails
      return context;
    }
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
