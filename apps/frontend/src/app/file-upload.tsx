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

      {result && result.success && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800">Upload Successful</h2>
          </div>
          
          {result.document && (
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Document Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Document ID</div>
                  <div className="text-sm font-mono text-gray-800 break-all">{result.document.documentId}</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Filename</div>
                  <div className="text-sm text-gray-800 break-words">{result.document.filename}</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Content Type</div>
                  <div className="text-sm text-gray-800">{result.document.contentType}</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">File Size</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {(result.document.size / 1024).toFixed(2)} KB
                    <span className="text-gray-500 font-normal ml-2">({result.document.size.toLocaleString()} bytes)</span>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Text Chunks</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-600">{result.document.chunkCount}</span>
                    <span className="text-xs text-gray-500">chunks created for vector search</span>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Uploaded At</div>
                  <div className="text-sm text-gray-800">
                    {new Date(result.document.uploadedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-green-800">
                    <strong>Status:</strong> Document has been successfully processed, embedded, and indexed in the vector database. 
                    It is now ready for semantic search and RAG queries.
                  </div>
                </div>
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
