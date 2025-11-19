import {
  Controller,
  Get,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Get list of all documents
   * GET /documents
   */
  @Get()
  async getAllDocuments() {
    try {
      const documents = await this.documentsService.getAllDocuments();
      return {
        success: true,
        documents,
        count: documents.length,
      };
    } catch (error) {
      this.logger.error('Error getting documents list', error);
      throw error;
    }
  }

  /**
   * Get single document by ID
   * GET /documents/:id
   */
  @Get(':id')
  async getDocumentById(@Param('id') id: string) {
    try {
      const document = await this.documentsService.getDocumentById(id);
      return {
        success: true,
        document,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error getting document ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete document by ID
   * DELETE /documents/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param('id') id: string): Promise<void> {
    try {
      await this.documentsService.deleteDocument(id);
    } catch (error) {
      this.logger.error(`Error deleting document ${id}`, error);
      throw error;
    }
  }
}

