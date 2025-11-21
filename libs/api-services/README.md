# API Services Library

This library contains API service classes for communicating with the backend API.

## Services

### UploadService
Service for handling file uploads and document management.

**Methods:**
- `uploadFile(file: File): Promise<UploadResponse>` - Upload a file to the server
- `getDocument(documentId: string): Promise<UploadDocument>` - Get document information by ID
- `deleteDocument(documentId: string): Promise<void>` - Delete a document by ID

**Usage:**
```typescript
import { uploadService } from '@casebase-demo/api-services';

const response = await uploadService.uploadFile(file);
```

### ChatService
Service for handling chat queries and RAG pipeline interactions.

**Methods:**
- `query(message: string, options?: QueryOptions): Promise<ChatResponse>` - Send a chat query

**Usage:**
```typescript
import { chatService } from '@casebase-demo/api-services';

const response = await chatService.query('What is in the document?', {
  topK: 5,
  useRAG: true,
  compressPrompt: true,
});
```

## Types

All TypeScript interfaces and types are exported from the library:
- `UploadResponse`, `UploadDocument`
- `ChatResponse`, `ChatQueryDto`

## Building

```bash
nx build api-services
```
