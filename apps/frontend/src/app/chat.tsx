import { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Snackbar, Message, Button, Input, Card, ScrollArea, EmptyChat, DocumentsDialog } from '@casebase-demo/ui-components';
import { cn, setLastChatId } from '@casebase-demo/utils';
import { chatService, pdfService, uploadService, ChatResponse } from '@casebase-demo/api-services';
import { Download, Send, Loader2, FolderOpen, Paperclip } from 'lucide-react';

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

interface ChatProps {
  chatId?: string;
}

interface ChatLayoutContext {
  refreshChatList?: () => void;
}

export function Chat({ chatId: propChatId }: ChatProps) {
  const navigate = useNavigate();
  const { refreshChatList } = useOutletContext<ChatLayoutContext>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatIdState] = useState<string | null>(propChatId || null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showContext, setShowContext] = useState<{ [key: number]: boolean }>({});
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when chatId changes
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setLoadingHistory(true);
        const currentChatId = propChatId;
        
        if (currentChatId) {
          try {
            const historyResponse = await chatService.getChatHistory(currentChatId);
            if (historyResponse.success && historyResponse.data) {
              setChatIdState(currentChatId);
              setLastChatId(currentChatId);
              const historyMessages: ChatMessage[] = historyResponse.data.messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.timestamp),
                context: msg.context,
                tokensUsed: msg.tokensUsed,
              }));
              setMessages(historyMessages);
            }
          } catch (err) {
            // Chat not found, redirect to new chat (without creating one)
            // Chat will be created automatically when first message is sent
            setChatIdState(null);
            setMessages([]);
            navigate('/chat', { replace: true });
          }
        } else {
          // No chatId - don't create a chat yet
          // Chat will be created automatically when first message is sent
          setChatIdState(null);
          setMessages([]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propChatId]);

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
    const currentInput = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const data = await chatService.query(currentInput, {
        chatId: chatId || undefined,
        topK: 5,
      });

      if (data.success && data.data) {
        // Update chatId if we got a new one
        if (data.data.chatId && data.data.chatId !== chatId) {
          setChatIdState(data.data.chatId);
          setLastChatId(data.data.chatId);
          refreshChatList?.(); // Refresh sidebar when new chat is created
          navigate(`/chat/${data.data.chatId}`, { replace: true });
        } else if (data.data.chatId) {
          // Refresh sidebar when message is added to existing chat
          refreshChatList?.();
        }

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
      
      // Provide user-friendly error messages
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('timeout')) {
        userFriendlyMessage = 'Request timed out. Please try again.';
      } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        userFriendlyMessage = 'API rate limit exceeded. Please wait a moment and try again.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(userFriendlyMessage);
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${userFriendlyMessage}`,
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

      const blob = await pdfService.generateChatPdf({
        messages: pdfMessages,
        title: 'Chat Conversation',
        includeMetadata: true,
        includeContext: false,
      });

      pdfService.downloadPdf(blob, `chat-${new Date().toISOString().split('T')[0]}.pdf`);

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

  const handleUploadSuccess = () => {
    setSnackbarMessage('Document uploaded and indexed successfully!');
    setSnackbarOpen(true);
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
      await uploadService.uploadFile(file);
      handleUploadSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      setSnackbarMessage(`Upload failed: ${errorMessage}`);
      setSnackbarOpen(true);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">RAG Chat</h1>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setDocumentsDialogOpen(true)}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            <FolderOpen className="w-4 h-4" />
            Documents Library
          </Button>
          <Button
            onClick={handleGeneratePdf}
            disabled={messages.length === 0 || generatingPdf}
            variant="default"
            title={messages.length === 0 ? 'No messages to export' : 'Download chat as PDF'}
          >
            {generatingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-6 py-4">
          <div className="space-y-4">
          {loadingHistory ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyChat />
          ) : null}

          {messages.map((message, index) => (
            <Message
              key={index}
              message={message}
              index={index}
              showContext={showContext[index] || false}
              onToggleContext={() => toggleContext(index)}
            />
          ))}

          {loading && (
            <div className="flex justify-start">
              <Card className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-muted-foreground">Thinking...</span>
                </div>
              </Card>
            </div>
          )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-6 py-2">
          <Card className="bg-destructive/10 border-destructive text-destructive px-4 py-3">
            <strong>Error:</strong> {error}
          </Card>
        </div>
      )}

      {/* Input */}
      <div className="bg-card border-t border-border px-6 py-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            disabled={loading}
            className="flex-1"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleUploadClick}
            disabled={loading || uploading}
            title="Upload document"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>
          <Button
            type="submit"
            disabled={!input.trim() || loading}
            size="default"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Snackbar */}
      <Snackbar
        message={snackbarMessage}
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
      />

      {/* Documents Dialog */}
      <DocumentsDialog
        open={documentsDialogOpen}
        onOpenChange={setDocumentsDialogOpen}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}

