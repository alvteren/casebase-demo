import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatHistoryService } from './chat-history.service';
import { ChatHistory, ChatHistorySchema } from './schemas/chat-history.schema';
import { VectorStoreModule } from '../vector-store/vector-store.module';

@Module({
  imports: [
    VectorStoreModule,
    MongooseModule.forFeature([
      { name: ChatHistory.name, schema: ChatHistorySchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatHistoryService],
  exports: [ChatService, ChatHistoryService],
})
export class ChatModule {}

