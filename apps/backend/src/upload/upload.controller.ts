import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{
    success: boolean;
    document: {
      documentId: string;
      filename: string;
      contentType: string;
      size: number;
      chunkCount: number;
      uploadedAt: Date;
    };
    text?: string;
    error?: string;
  }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      // Process document (this already extracts text internally)
      const document = await this.uploadService.processDocument(file);

      return {
        document,
        success: true,
        text: document.text,
      };
    } catch (error) {
      this.logger.error('Error processing file upload', error);

      // Handle specific error types
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Check for OpenAI quota/rate limit errors
      const errorMessage = error?.message || 'Unknown error';
      if (
        errorMessage.includes('quota') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('OpenAI')
      ) {
        throw new InternalServerErrorException({
          message: errorMessage,
          error: 'OpenAI API Error',
          statusCode: 500,
        });
      }

      // Generic error
      throw new InternalServerErrorException({
        message: `Failed to process file: ${errorMessage}`,
        error: 'File Processing Error',
        statusCode: 500,
      });
    }
  }

  @Get(':documentId')
  async getDocumentMetadata(@Param('documentId') documentId: string) {
    const metadata = await this.uploadService.getDocumentMetadata(documentId);
    return {
      documentId,
      metadata,
    };
  }

  @Delete(':documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param('documentId') documentId: string): Promise<void> {
    await this.uploadService.deleteDocument(documentId);
  }
}
