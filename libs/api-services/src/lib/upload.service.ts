export interface UploadDocument {
  documentId: string;
  filename: string;
  contentType: string;
  size: number;
  chunkCount: number;
  uploadedAt: string;
}

export interface UploadResponse {
  success: boolean;
  document?: UploadDocument;
  text?: string;
}

export class UploadService {
  private readonly baseUrl = (process.env["REACT_APP_BACKEND_URL"] );

  /**
   * Upload a file to the server
   * @param file - The file to upload
   * @returns Promise with upload response
   * @throws Error if upload fails
   */
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
    }

    const data: UploadResponse = await response.json();
    return data;
  }

  /**
   * Get document information by ID
   * @param documentId - The document ID
   * @returns Promise with document information
   * @throws Error if request fails
   */
  async getDocument(documentId: string): Promise<UploadDocument> {
    const response = await fetch(`${this.baseUrl}/upload/${documentId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(errorData.message || `Failed to get document: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Delete a document by ID
   * @param documentId - The document ID
   * @returns Promise<void>
   * @throws Error if deletion fails
   */
  async deleteDocument(documentId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/upload/${documentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(errorData.message || `Failed to delete document: ${response.statusText}`);
    }
  }
}

// Export singleton instance
export const uploadService = new UploadService();

