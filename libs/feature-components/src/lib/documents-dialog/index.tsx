import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  ScrollArea,
  Card,
  FileDropZone,
} from '@casebase-demo/ui-components';
import { Upload, Loader2, FileText } from 'lucide-react';
import { documentsApiService, uploadService } from '@casebase-demo/api-services';
import { formatDate } from '@casebase-demo/utils';
import { DocumentSummary } from '@casebase-demo/shared-types';
import { DeleteButton } from './delete-button';

interface DocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

export function DocumentsDialog({
  open,
  onOpenChange,
  onUploadSuccess,
}: DocumentsDialogProps) {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentsApiService.getAllDocuments();
      setDocuments(response.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadDocuments();
    }
  }, [open]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const validateFile = (file: File): boolean | string => {
    const validTypes = ['.pdf', '.docx', '.doc', '.txt'];
    const fileName = file.name.toLowerCase();
    const isValidType = validTypes.some(type => fileName.endsWith(type));
    
    if (!isValidType) {
      return 'Invalid file type. Please upload PDF, DOCX, DOC, or TXT files only.';
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'File size exceeds 10MB limit.';
    }
    
    return true;
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    const uploadResults: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Upload files sequentially to avoid overwhelming the server
    for (const file of files) {
      try {
        await uploadService.uploadFile(file);
        uploadResults.success++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
        uploadResults.failed++;
        uploadResults.errors.push(`${file.name}: ${errorMessage}`);
      }
    }

    // Reload documents list after all uploads complete
    await loadDocuments();

    // Show appropriate message based on results
    if (uploadResults.success > 0) {
      onUploadSuccess?.();
      if (uploadResults.failed > 0) {
        setError(
          `${uploadResults.success} file(s) uploaded successfully, ${uploadResults.failed} failed: ${uploadResults.errors.join('; ')}`
        );
      }
    } else {
      const errorMessage = uploadResults.errors.join('; ') || 'Failed to upload files';
      setError(errorMessage);
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    for (const file of Array.from(files)) {
      const validationResult = validateFile(file);
      if (validationResult === true) {
        validFiles.push(file);
      } else if (typeof validationResult === 'string') {
        invalidFiles.push(`${file.name}: ${validationResult}`);
      }
    }

    if (invalidFiles.length > 0) {
      setError(invalidFiles.join('; '));
    }

    if (validFiles.length > 0) {
      await handleFileUpload(validFiles);
    }
  };

  const handleFileDrop = async (files: File[]) => {
    if (uploading) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    for (const file of files) {
      const validationResult = validateFile(file);
      if (validationResult === true) {
        validFiles.push(file);
      } else if (typeof validationResult === 'string') {
        invalidFiles.push(`${file.name}: ${validationResult}`);
      }
    }

    if (invalidFiles.length > 0) {
      setError(invalidFiles.join('; '));
    }

    if (validFiles.length > 0) {
      await handleFileUpload(validFiles);
    }
  };

  const handleDelete = useCallback(async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeleting(documentId);
    setError(null);

    try {
      await documentsApiService.deleteDocument(documentId);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setDeleting(null);
    }
  }, [loadDocuments]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Documents Library</DialogTitle>
          <DialogDescription>
            Manage your uploaded documents. Upload new files or delete existing ones. You can also drag and drop files here.
          </DialogDescription>
        </DialogHeader>

        <FileDropZone
          onFileDrop={handleFileDrop}
          accept={['.pdf', '.docx', '.doc', '.txt']}
          maxSize={10 * 1024 * 1024} // 10MB
          validateFile={validateFile}
          disabled={uploading}
          multiple
          overlayText="Drop files here to upload"
          overlaySubtext="Supports PDF, DOCX, DOC, TXT"
          className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden relative"
        >

          {/* Upload Button */}
          <div className="flex justify-end shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              onClick={handleUploadClick}
              disabled={uploading}
              variant="default"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Document
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="bg-destructive/10 border-destructive text-destructive px-4 py-3 shrink-0">
              <strong>Error:</strong> {error}
            </Card>
          )}

          {/* Documents List */}
          <div className="flex-1 min-h-0 overflow-hidden border rounded-md">
            <ScrollArea className="h-full">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading documents...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No documents uploaded yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click "Upload Document" or drag and drop files here to add your first document
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {documents.map((doc) => (
                  <Card key={doc.documentId} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <h3 className="font-semibold text-sm truncate">{doc.filename}</h3>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Type: {doc.contentType}</p>
                          <p>Size: {formatFileSize(doc.size)}</p>
                          <p>Chunks: {doc.chunkCount}</p>
                          <p>Uploaded: {formatDate(doc.uploadedAt)}</p>
                        </div>
                      </div>
                      <DeleteButton
                        documentId={doc.documentId}
                        onDelete={handleDelete}
                        isDeleting={deleting === doc.documentId}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
            </ScrollArea>
          </div>
        </FileDropZone>
      </DialogContent>
    </Dialog>
  );
}

