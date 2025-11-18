export interface PdfMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface PdfGenerationOptions {
  messages: PdfMessage[];
  title?: string;
  includeMetadata?: boolean;
  includeContext?: boolean;
}

export class PdfService {
  private readonly baseUrl = 'http://localhost:3000/api';

  /**
   * Generate PDF from chat conversation
   * @param options - PDF generation options
   * @returns Promise with PDF blob
   * @throws Error if generation fails
   */
  async generateChatPdf(options: PdfGenerationOptions): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/pdf/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: options.messages,
        title: options.title || 'Chat Conversation',
        includeMetadata: options.includeMetadata ?? true,
        includeContext: options.includeContext ?? false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    const blob = await response.blob();
    return blob;
  }

  /**
   * Download PDF blob as a file
   * @param blob - The PDF blob
   * @param filename - The filename for the download
   */
  downloadPdf(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

// Export singleton instance
export const pdfService = new PdfService();

