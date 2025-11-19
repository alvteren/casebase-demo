import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [VectorStoreModule, UploadModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}

