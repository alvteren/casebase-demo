import { useState } from 'react';

interface UploadResponse {
  success: boolean;
  document?: {
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
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">File Upload Test</h1>
      
      <form onSubmit={handleSubmit} className="mb-5">
        <div className="mb-4">
          <label 
            htmlFor="file" 
            className="block mb-2 font-semibold text-gray-700"
          >
            Select file (PDF, DOCX, or TXT):
          </label>
          <input
            type="file"
            id="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileChange}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        
        <button
          type="submit"
          disabled={!file || loading}
          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>

      {error && (
        <div className="p-4 mb-5 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <strong className="font-semibold">Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-gray-800">Upload Result</h2>
          
          {result.document && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Document Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong className="text-gray-700">Document ID:</strong> <span className="text-gray-600">{result.document.documentId}</span></p>
                <p><strong className="text-gray-700">Filename:</strong> <span className="text-gray-600">{result.document.filename}</span></p>
                <p><strong className="text-gray-700">Content Type:</strong> <span className="text-gray-600">{result.document.contentType}</span></p>
                <p><strong className="text-gray-700">Size:</strong> <span className="text-gray-600">{(result.document.size / 1024).toFixed(2)} KB</span></p>
                <p><strong className="text-gray-700">Chunks:</strong> <span className="text-gray-600">{result.document.chunkCount}</span></p>
                <p><strong className="text-gray-700">Uploaded:</strong> <span className="text-gray-600">{new Date(result.document.uploadedAt).toLocaleString()}</span></p>
              </div>
            </div>
          )}

          {result.text && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Extracted Text</h3>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md max-h-[500px] overflow-auto whitespace-pre-wrap">
                {result.text || 'No text extracted'}
              </div>
              <p className="mt-3 text-sm text-gray-600">
                <strong>Text length:</strong> {result.text.length} characters
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
