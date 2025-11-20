import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatHistoryDocument = ChatHistory & Document;

@Schema({ timestamps: true })
export class ChatHistory {
  @Prop({ required: true, unique: true })
  chatId: string;

  @Prop({
    type: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, required: true },
        context: {
          type: [
            {
              text: String,
              score: Number,
              source: String,
            },
          ],
          required: false,
        },
        tokensUsed: {
          type: {
            prompt: Number,
            completion: Number,
            total: Number,
          },
          required: false,
        },
      },
    ],
    default: [],
  })
  messages: Array<{
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
  }>;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);

