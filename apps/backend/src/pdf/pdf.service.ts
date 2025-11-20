import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ChatMessage } from '@casebase-demo/shared-types';

export interface PdfGenerationOptions {
  title?: string;
  includeMetadata?: boolean;
  includeContext?: boolean;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  /**
   * Generate PDF from chat session
   */
  async generateChatPdf(
    messages: ChatMessage[],
    options: PdfGenerationOptions = {},
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          info: {
            Title: options.title || 'Chat Conversation',
            Author: 'Casebase Demo',
            Subject: 'RAG Chat Conversation',
            Creator: 'Casebase Demo Application',
          },
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => {
          chunks.push(chunk);
        });

        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          this.logger.log(`Generated PDF: ${pdfBuffer.length} bytes`);
          resolve(pdfBuffer);
        });

        doc.on('error', (error) => {
          this.logger.error('Error generating PDF', error);
          reject(error);
        });

        // Add title
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text(options.title || 'Chat Conversation', {
            align: 'center',
          })
          .moveDown(2);

        // Add metadata if requested
        if (options.includeMetadata) {
          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('gray')
            .text(
              `Generated: ${new Date().toLocaleString()}`,
              { align: 'right' },
            )
            .moveDown();
        }

        // Add messages
        messages.forEach((message, index) => {
          if (index > 0) {
            doc.moveDown();
            doc
              .moveTo(50, doc.y)
              .lineTo(550, doc.y)
              .strokeColor('#cccccc')
              .lineWidth(0.5)
              .stroke()
              .moveDown();
          }

          const isUser = message.role === 'user';
          const roleLabel = isUser ? 'User' : 'Assistant';

          // Role label
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor(isUser ? '#2563eb' : '#059669')
            .text(roleLabel, {
              continued: false,
            });

          // Timestamp if available
          if (message.timestamp) {
            try {
              const timestamp = message.timestamp instanceof Date 
                ? message.timestamp 
                : new Date(message.timestamp);
              
              if (!isNaN(timestamp.getTime())) {
                doc
                  .fontSize(8)
                  .font('Helvetica')
                  .fillColor('gray')
                  .text(
                    ` - ${timestamp.toLocaleString()}`,
                    { continued: true },
                  );
              }
            } catch (error) {
              // Silently skip timestamp if it's invalid
              this.logger.warn('Invalid timestamp in message, skipping', error);
            }
          }

          doc.moveDown(0.5);

          // Message content
          doc
            .fontSize(11)
            .font('Helvetica')
            .fillColor('black')
            .text(message.content, {
              align: 'left',
              indent: 20,
            });

          doc.moveDown();
        });

        // Add footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('gray')
            .text(
              `Page ${i + 1} of ${pageCount}`,
              50,
              doc.page.height - 30,
              {
                align: 'center',
                width: 500,
              },
            );
        }

        doc.end();
      } catch (error) {
        this.logger.error('Error creating PDF document', error);
        reject(error);
      }
    });
  }

  /**
   * Generate PDF from a single query and response
   */
  async generateQueryPdf(
    query: string,
    answer: string,
    context?: Array<{ text: string; score: number; source?: string }>,
    options: PdfGenerationOptions = {},
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          info: {
            Title: options.title || 'Query Response',
            Author: 'Casebase Demo',
            Subject: 'RAG Query Response',
            Creator: 'Casebase Demo Application',
          },
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => {
          chunks.push(chunk);
        });

        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          this.logger.log(`Generated PDF: ${pdfBuffer.length} bytes`);
          resolve(pdfBuffer);
        });

        doc.on('error', (error) => {
          this.logger.error('Error generating PDF', error);
          reject(error);
        });

        // Add title
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text(options.title || 'Query Response', {
            align: 'center',
          })
          .moveDown(2);

        // Add metadata
        if (options.includeMetadata) {
          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('gray')
            .text(`Generated: ${new Date().toLocaleString()}`, {
              align: 'right',
            })
            .moveDown();
        }

        // Add query
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#2563eb')
          .text('Question:', { continued: false })
          .moveDown(0.5);

        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('black')
          .text(query, {
            align: 'left',
            indent: 20,
          })
          .moveDown(2);

        // Add answer
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#059669')
          .text('Answer:', { continued: false })
          .moveDown(0.5);

        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('black')
          .text(answer, {
            align: 'left',
            indent: 20,
          })
          .moveDown(2);

        // Add context if provided
        if (context && context.length > 0 && options.includeContext) {
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#6b7280')
            .text('Sources:', { continued: false })
            .moveDown(0.5);

          context.forEach((item, index) => {
            doc
              .fontSize(10)
              .font('Helvetica-Bold')
              .fillColor('#4b5563')
              .text(`Source ${index + 1}`, {
                continued: true,
              });

            if (item.source) {
              doc
                .fontSize(9)
                .font('Helvetica')
                .fillColor('gray')
                .text(` (${item.source})`, { continued: true });
            }

            doc
              .fontSize(9)
              .font('Helvetica')
              .fillColor('gray')
              .text(` [Score: ${item.score.toFixed(3)}]`, {
                continued: false,
              })
              .moveDown(0.3);

            doc
              .fontSize(9)
              .font('Helvetica')
              .fillColor('black')
              .text(item.text.substring(0, 200) + (item.text.length > 200 ? '...' : ''), {
                align: 'left',
                indent: 20,
              })
              .moveDown();
          });
        }

        // Add footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('gray')
            .text(
              `Page ${i + 1} of ${pageCount}`,
              50,
              doc.page.height - 30,
              {
                align: 'center',
                width: 500,
              },
            );
        }

        doc.end();
      } catch (error) {
        this.logger.error('Error creating PDF document', error);
        reject(error);
      }
    });
  }
}
