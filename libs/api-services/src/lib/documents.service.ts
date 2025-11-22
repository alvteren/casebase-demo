import { DocumentSummary } from "@casebase-demo/shared-types";


export interface DocumentsListResponse {
  success: boolean;
  documents: DocumentSummary[];
  count: number;
}

export interface DocumentResponse {
  success: boolean;
  document: DocumentSummary;
}

export class DocumentsApiService {
  private readonly baseUrl = (process.env["REACT_APP_BACKEND_URL"]);

  /**
   * Get list of all documents
   * @returns Promise with list of documents
   * @throws Error if request fails
   */
  async getAllDocuments(): Promise<DocumentsListResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: response.statusText,
        }));
        throw new Error(errorData.message || `Failed to get documents: ${response.statusText}`);
      }

      const data: DocumentsListResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const backendUrl = (process.env["REACT_APP_BACKEND_URL"]);
        throw new Error(`Cannot connect to server. Please make sure the backend is running on ${backendUrl}`);
      }
      throw error;
    }
  }

  /**
   * Get document by ID
   * @param documentId - The document ID
   * @returns Promise with document information
   * @throws Error if request fails
   */
  async getDocumentById(documentId: string): Promise<DocumentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${documentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: response.statusText,
        }));
        throw new Error(errorData.message || `Failed to get document: ${response.statusText}`);
      }

      const data: DocumentResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const backendUrl = (process.env["REACT_APP_BACKEND_URL"]);
        throw new Error(`Cannot connect to server. Please make sure the backend is running on ${backendUrl}`);
      }
      throw error;
    }
  }

  /**
   * Delete a document by ID
   * @param documentId - The document ID
   * @returns Promise<void>
   * @throws Error if deletion fails
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: response.statusText,
        }));
        throw new Error(errorData.message || `Failed to delete document: ${response.statusText}`);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const backendUrl = (process.env["REACT_APP_BACKEND_URL"]);
        throw new Error(`Cannot connect to server. Please make sure the backend is running on ${backendUrl}`);
      }
      throw error;
    }
  }
}

// Export singleton instance
export const documentsApiService = new DocumentsApiService();

