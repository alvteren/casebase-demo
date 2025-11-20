import {
  Controller,
  Post,
  Body,
  Res,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { PdfService, PdfGenerationOptions } from './pdf.service';
import { ChatMessage, ContextItem, TokensUsed } from '@casebase-demo/shared-types';

export interface GenerateChatPdfDto {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date | string;
    context?: ContextItem[];
    tokensUsed?: TokensUsed;
  }>;
  title?: string;
  includeMetadata?: boolean;
  includeContext?: boolean;
}

export interface GenerateQueryPdfDto {
  query: string;
  answer: string;
  context?: Array<{ text: string; score: number; source?: string }>;
  title?: string;
  includeMetadata?: boolean;
  includeContext?: boolean;
}

@Controller('pdf')
export class PdfController {
  private readonly logger = new Logger(PdfController.name);

  constructor(private readonly pdfService: PdfService) {}

  @Post('chat')
  async generateChatPdf(
    @Body() body: GenerateChatPdfDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Validate input
      if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
        throw new BadRequestException(
          'Messages array is required and must not be empty',
        );
      }

      // Validate and convert messages structure
      const messages: ChatMessage[] = body.messages.map((msg) => {
        if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
          throw new BadRequestException(
            'Each message must have a valid role (user or assistant)',
          );
        }
        if (!msg.content || typeof msg.content !== 'string') {
          throw new BadRequestException(
            'Each message must have a content string',
          );
        }
        return {
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: msg.timestamp instanceof Date 
            ? msg.timestamp 
            : new Date(msg.timestamp || Date.now()),
          context: msg.context,
          tokensUsed: msg.tokensUsed,
        };
      });

      const options: PdfGenerationOptions = {
        title: body.title,
        includeMetadata: body.includeMetadata ?? true,
        includeContext: body.includeContext ?? false,
      };

      // Generate PDF
      const pdfBuffer = await this.pdfService.generateChatPdf(
        messages,
        options,
      );

      // Set response headers
      const filename = `chat-${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.setHeader('Content-Length', pdfBuffer.length.toString());

      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error('Error generating chat PDF', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: `Failed to generate PDF: ${error?.message || 'Unknown error'}`,
        error: 'PDF Generation Error',
        statusCode: 500,
      });
    }
  }

  @Post('query')
  async generateQueryPdf(
    @Body() body: GenerateQueryPdfDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Validate input
      if (!body.query || typeof body.query !== 'string') {
        throw new BadRequestException('Query is required and must be a string');
      }

      if (!body.answer || typeof body.answer !== 'string') {
        throw new BadRequestException(
          'Answer is required and must be a string',
        );
      }

      const options: PdfGenerationOptions = {
        title: body.title,
        includeMetadata: body.includeMetadata ?? true,
        includeContext: body.includeContext ?? true,
      };

      // Generate PDF
      const pdfBuffer = await this.pdfService.generateQueryPdf(
        body.query,
        body.answer,
        body.context,
        options,
      );

      // Set response headers
      const filename = `query-${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.setHeader('Content-Length', pdfBuffer.length.toString());

      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error('Error generating query PDF', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: `Failed to generate PDF: ${error?.message || 'Unknown error'}`,
        error: 'PDF Generation Error',
        statusCode: 500,
      });
    }
  }
}
