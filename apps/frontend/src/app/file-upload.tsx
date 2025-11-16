import { useState } from 'react';

interface UploadResponse {
  success: boolean;
  document: {
    documentId: string;
    filename: string;
    contentType: string;
    size: number;
    chunkCount: number;
    uploadedAt: string;
  };
  text?: string;
}

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
      }

      const data: UploadResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>File Upload Test</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="file" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Select file (PDF, DOCX, or TXT):
          </label>
          <input
            type="file"
            id="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileChange}
            disabled={loading}
            style={{ padding: '5px', width: '100%' }}
          />
        </div>
        
        <button
          type="submit"
          disabled={!file || loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
          }}
        >
          {loading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>

      {error && (
        <div
          style={{
            padding: '15px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div>
          <h2>Upload Result</h2>
          
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
            <h3>Document Information</h3>
            <p><strong>Document ID:</strong> {result.document.documentId}</p>
            <p><strong>Filename:</strong> {result.document.filename}</p>
            <p><strong>Content Type:</strong> {result.document.contentType}</p>
            <p><strong>Size:</strong> {(result.document.size / 1024).toFixed(2)} KB</p>
            <p><strong>Chunks:</strong> {result.document.chunkCount}</p>
            <p><strong>Uploaded:</strong> {new Date(result.document.uploadedAt).toLocaleString()}</p>
          </div>

          {result.text && (
            <div>
              <h3>Extracted Text</h3>
              <div
                style={{
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  maxHeight: '500px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                }}
              >
                {result.text || 'No text extracted'}
              </div>
              <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
                <strong>Text length:</strong> {result.text.length} characters
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

