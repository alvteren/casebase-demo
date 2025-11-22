import { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Snackbar, Button, Input, Card, ScrollArea } from '@casebase-demo/ui-components';
import { Message, EmptyChat, DocumentsDialog } from '@casebase-demo/feature-components';
import { setLastChatId, clearLastChatId } from '@casebase-demo/utils';
import { chatService, uploadService } from '@casebase-demo/api-services';
import { ChatMessage, ChatHistoryMessage } from '@casebase-demo/shared-types';
import { Send, Loader2, FolderOpen, Paperclip } from 'lucide-react';

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
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const failedChatIdsRef = useRef<Set<string>>(new Set()); // Track failed chat IDs to prevent retries
  const messagesCacheRef = useRef<Map<string, ChatMessage[]>>(new Map()); // Cache loaded messages by chatId
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
          // If we've already tried this chatId and it failed, don't try again
          if (failedChatIdsRef.current.has(currentChatId)) {
            // Clear from localStorage and redirect to new chat
            clearLastChatId();
            setChatIdState(null);
            setMessages([]);
            navigate('/chat', { replace: true });
            return;
          }

          // Check if we have cached messages for this chatId
          const cachedMessages = messagesCacheRef.current.get(currentChatId);
          if (cachedMessages) {
            // Use cached messages, no need to reload
            setChatIdState(currentChatId);
            setLastChatId(currentChatId);
            setMessages(cachedMessages);
            setLoadingHistory(false);
            return;
          }

          try {
            const historyResponse = await chatService.getChatHistory(currentChatId);
            if (historyResponse.success && historyResponse.data) {
              setChatIdState(currentChatId);
              setLastChatId(currentChatId);
              // Remove from failed list if it was there
              failedChatIdsRef.current.delete(currentChatId);
              const historyMessages: ChatMessage[] = historyResponse.data.messages.map((msg: ChatHistoryMessage) => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
                context: msg.context,
                tokensUsed: msg.tokensUsed,
              }));
              // Cache the messages
              messagesCacheRef.current.set(currentChatId, historyMessages);
              setMessages(historyMessages);
            }
          } catch (error) {
            // Chat not found - mark as failed and clear from localStorage
            console.error(`Chat ${currentChatId} not found:`, error);
            failedChatIdsRef.current.add(currentChatId);
            clearLastChatId();
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
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadChatHistory();
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

    const updatedMessagesWithUser = [...messages, userMessage];
    setMessages(updatedMessagesWithUser);
    
    // Update cache with user message
    const currentChatIdForUser = chatId;
    if (currentChatIdForUser) {
      messagesCacheRef.current.set(currentChatIdForUser, updatedMessagesWithUser);
    }
    
    const currentInput = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Create assistant message placeholder for streaming
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      
      // Add empty assistant message to show streaming
      setMessages([...updatedMessagesWithUser, assistantMessage]);

      let streamedContent = '';
      let streamedContext: Array<{ text: string; score: number; source?: string }> | undefined;

      await chatService.queryStream(
        currentInput,
        {
          chatId: chatId || undefined,
          topK: 5,
        },
        (chunk: string) => {
          // Update streaming content
          streamedContent += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (updated[lastIndex]?.role === 'assistant') {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: streamedContent,
              };
            }
            return updated;
          });
        },
        (context) => {
          streamedContext = context;
        },
        (data) => {
          streamedContent = data.answer;
          streamedContext = data.context;

          // Update chatId if we got a new one
          if (data.chatId && data.chatId !== chatId) {
            setChatIdState(data.chatId);
            setLastChatId(data.chatId);
            refreshChatList?.(); // Refresh sidebar when new chat is created
            navigate(`/chat/${data.chatId}`, { replace: true });
          } else if (data.chatId) {
            // Refresh sidebar when message is added to existing chat
            refreshChatList?.();
          }

          // Update final message with context
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (updated[lastIndex]?.role === 'assistant') {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: streamedContent,
                context: streamedContext,
              };
            }
            return updated;
          });

          // Update cache with final messages
          const currentChatIdForCache = data.chatId || chatId;
          if (currentChatIdForCache) {
            setMessages((prev) => {
              messagesCacheRef.current.set(currentChatIdForCache, prev);
              return prev;
            });
          }
        },
      );
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
      // Get the latest messages (which should include the user message we just added)
      setMessages((prev) => {
        const errorChatMessage: ChatMessage = {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${userFriendlyMessage}`,
          timestamp: new Date(),
        };
        const updatedMessagesWithError = [...prev, errorChatMessage];
        
        // Update cache with error message
        const currentChatIdForError = chatId;
        if (currentChatIdForError) {
          messagesCacheRef.current.set(currentChatIdForError, updatedMessagesWithError);
        }
        
        return updatedMessagesWithError;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportSuccess = () => {
    setSnackbarMessage('Message exported to PDF successfully');
    setSnackbarOpen(true);
  };

  const handleExportError = (error: string) => {
    setError(error);
    setSnackbarMessage(`Failed to export message: ${error}`);
    setSnackbarOpen(true);
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
        <h1 className="text-2xl font-bold text-foreground">Chat</h1>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setDocumentsDialogOpen(true)}
            variant="default"
          >
            <FolderOpen className="w-4 h-4" />
            Documents Library
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-6 py-4">
          <div className="flex flex-col space-y-4">
          {loadingHistory ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyChat />
          ) : null}

          { messages.map((message, index) => (
            message.content && (<Message
              key={index}
              message={message}
              onExportSuccess={message.role === 'assistant' ? handleExportSuccess : undefined}
              onExportError={message.role === 'assistant' ? handleExportError : undefined}
            />)
          ))}

          {loading && !(messages[messages.length - 1]?.content) && (
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

