import { useEffect, useState } from 'react';
import { Button } from './button';
import { ScrollArea } from './scroll-area';
import { Card } from './card';
import { chatService, ChatHistoryListItem } from '@casebase-demo/api-services';
import { Plus, MessageSquare, Loader2, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn, formatDate } from '@casebase-demo/utils';

interface ChatSidebarProps {
  onNewChat: () => void;
  onChatSelect?: (chatId: string) => void;
  refreshTrigger?: number; // Trigger to refresh chat list
}

export function ChatSidebar({ onNewChat, onChatSelect, refreshTrigger }: ChatSidebarProps) {
  const [chats, setChats] = useState<ChatHistoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const navigate = useNavigate();
  const { chatId: currentChatId } = useParams<{ chatId?: string }>();

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await chatService.getAllChatHistories();
      if (response.success && response.data) {
        setChats(response.data);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setLoading(false);
    }
  };


  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      loadChats();
    }
  }, [refreshTrigger]);

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
    onChatSelect?.(chatId);
  };

  const handleDelete = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      setDeleting(chatId);
      await chatService.deleteChatHistory(chatId);
      setChats((prev) => prev.filter((chat) => chat.chatId !== chatId));
      // If deleted chat is current, navigate to new chat (without creating one)
      // Chat will be created automatically when first message is sent
      if (currentChatId === chatId) {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert('Failed to delete chat');
    } finally {
      setDeleting(null);
    }
  };

  const truncateText = (text: string, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex justify-end">
        <Button
          onClick={onNewChat}
          variant="outline"
          size="icon"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No chat history</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => {
                const isActive = currentChatId === chat.chatId;
                return (
                  <Card
                    key={chat.chatId}
                    tabIndex={0}
                    role="button"
                    aria-label={`Chat from ${formatDate(chat.updatedAt)}`}
                    className={cn(
                      'p-3 cursor-pointer transition-all group relative border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                      isActive
                        ? 'border-primary'
                        : 'hover:bg-accent border-transparent'
                    )}
                    style={isActive ? { backgroundColor: 'hsl(var(--primary) / 0.15)' } : undefined}
                    onClick={() => handleChatClick(chat.chatId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleChatClick(chat.chatId);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className={cn(
                            'w-4 h-4 shrink-0',
                            isActive ? 'text-primary' : 'text-muted-foreground'
                          )} />
                          <span className={cn(
                            'text-xs',
                            isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                          )}>
                            {formatDate(chat.updatedAt)}
                          </span>
                        </div>
                        {chat.lastMessage ? (
                          <p className={cn(
                            'text-sm line-clamp-2',
                            isActive ? 'text-foreground font-medium' : 'text-foreground'
                          )}>
                            {truncateText(chat.lastMessage.content)}
                          </p>
                        ) : (
                          <p className={cn(
                            'text-sm',
                            isActive ? 'text-muted-foreground' : 'text-muted-foreground'
                          )}>
                            Empty chat
                          </p>
                        )}
                        <p className={cn(
                          'text-xs mt-1',
                          isActive ? 'text-primary/70 font-medium' : 'text-muted-foreground'
                        )}>
                          {chat.messageCount} message{chat.messageCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDelete(e, chat.chatId)}
                      disabled={deleting === chat.chatId}
                    >
                      {deleting === chat.chatId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

