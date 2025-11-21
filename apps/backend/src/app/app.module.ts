import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatModule } from '../chat/chat.module';
import { UploadModule } from '../upload/upload.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { OpenAIModule } from '../openai/openai.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/casebase-demo';
        return {
          uri,
          retryWrites: true,
          retryReads: true,
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 30000,
          maxPoolSize: 10,
          minPoolSize: 1,
        };
      },
      inject: [ConfigService],
    }),
    OpenAIModule,
    ChatModule,
    UploadModule,
    VectorStoreModule,
    DocumentsModule,
  ],
})
export class AppModule {}
