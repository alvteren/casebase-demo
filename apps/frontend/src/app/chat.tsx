import { useState, useRef, useEffect } from 'react';
import { Snackbar } from './snackbar';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: Array<{
    text: string;
    score: number;
    source?: string;
  }>;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

interface ChatResponse {
  success: boolean;
  data?: {
    answer: string;
    context?: Array<{
      text: string;
      score: number;
      source?: string;
    }>;
    tokensUsed?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
  error?: string;
}

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

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showContext, setShowContext] = useState<{ [key: number]: boolean }>({});
  const [uploading, setUploading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          topK: 5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: response.statusText,
        }));
        throw new Error(errorData.message || `Request failed: ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();

      if (data.success && data.data) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.data.answer,
          timestamp: new Date(),
          context: data.data.context,
          tokensUsed: data.data.tokensUsed,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorChatMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (messages.length === 0) {
      setError('No messages to export');
      return;
    }

    setGeneratingPdf(true);
    setError(null);

    try {
      const pdfMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      const response = await fetch('http://localhost:3000/api/pdf/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: pdfMessages,
          title: 'Chat Conversation',
          includeMetadata: true,
          includeContext: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success message
      setSnackbarMessage('Chat exported to PDF successfully');
      setSnackbarOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const toggleContext = (index: number) => {
    setShowContext((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: response.statusText,
        }));
        throw new Error(
          errorData.message || `Upload failed: ${response.statusText}`,
        );
      }

      const data: UploadResponse = await response.json();
      if (data.success && data.document) {
        setSnackbarMessage(
          `File "${data.document.filename}" uploaded successfully`,
        );
        setSnackbarOpen(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">RAG Chat</h1>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload Document
              </>
            )}
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={messages.length === 0 || generatingPdf}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            title={messages.length === 0 ? 'No messages to export' : 'Download chat as PDF'}
          >
            {generatingPdf ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-gray-500 text-lg">
                Start a conversation by asking a question
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Make sure you've uploaded documents first to get relevant answers
              </p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {message.role === 'user' ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.tokensUsed && (
                    <div
                      className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      Tokens: {message.tokensUsed.total} (prompt: {message.tokensUsed.prompt},
                      completion: {message.tokensUsed.completion})
                    </div>
                  )}
                  {message.context && message.context.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleContext(index)}
                        className={`text-xs underline ${
                          message.role === 'user'
                            ? 'text-blue-100'
                            : 'text-blue-600'
                        }`}
                      >
                        {showContext[index] ? 'Hide' : 'Show'} sources (
                        {message.context.length})
                      </button>
                      {showContext[index] && (
                        <div className="mt-2 space-y-2">
                          {message.context.map((item, ctxIndex) => (
                            <div
                              key={ctxIndex}
                              className={`text-xs p-2 rounded ${
                                message.role === 'user'
                                  ? 'bg-blue-500 text-blue-50'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              <div className="font-semibold mb-1">
                                Source {ctxIndex + 1}
                                {item.source && ` - ${item.source}`}
                                <span className="ml-2 opacity-75">
                                  (Score: {item.score.toFixed(3)})
                                </span>
                              </div>
                              <div className="opacity-90">
                                {item.text.substring(0, 200)}
                                {item.text.length > 200 && '...'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="px-6 py-2">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Snackbar */}
      <Snackbar
        message={snackbarMessage}
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
      />
    </div>
  );
}

