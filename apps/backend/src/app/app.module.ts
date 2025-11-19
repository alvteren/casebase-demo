import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from '../chat/chat.module';
import { UploadModule } from '../upload/upload.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { PdfModule } from '../pdf/pdf.module';
import { OpenAIModule } from '../openai/openai.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    OpenAIModule,
    ChatModule,
    UploadModule,
    VectorStoreModule,
    PdfModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
