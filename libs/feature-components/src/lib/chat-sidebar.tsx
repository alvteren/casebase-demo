import { useEffect, useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarRail,
  useSidebar,
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Badge,
} from '@casebase-demo/ui-components';
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
  const { state } = useSidebar();

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

  // Load chats on mount and when trigger changes
  useEffect(() => {
    loadChats();
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
    <Sidebar variant="inset" collapsible="icon" side="left">
      <SidebarHeader>
        <div className="flex justify-end p-2">
          <Tooltip>
            <TooltipTrigger asChild>
        <Button
          onClick={onNewChat}
                variant="outline"
                size="icon"
        >
                <Plus className="w-4 h-4" />
        </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>New Chat</p>
            </TooltipContent>
          </Tooltip>
      </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className={cn(state === 'collapsed' && 'hidden')}>No chat history</p>
            </div>
          ) : (
              <SidebarMenu>
                {chats.map((chat) => {
                  const isActive = currentChatId === chat.chatId;
                  return (
                    <SidebarMenuItem key={chat.chatId}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={state === 'collapsed' ? formatDate(chat.updatedAt) : undefined}
                  onClick={() => handleChatClick(chat.chatId)}
                        className="flex flex-col gap-1 items-start h-auto py-2"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <MessageSquare className={cn(
                            'w-4 h-4 shrink-0',
                            isActive ? 'text-primary' : 'text-muted-foreground'
                          )} />
                          {state !== 'collapsed' && (
                            <>
                              <span className={cn(
                                'text-xs flex-1 text-left',
                                isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                              )}>
                          {formatDate(chat.updatedAt)}
                        </span>
                              <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs shrink-0">
                                {chat.messageCount}
                              </Badge>
                            </>
                          )}
                      </div>
                        {state !== 'collapsed' && chat.lastMessage && (
                          <p className={cn(
                            'text-sm line-clamp-2 text-left w-full',
                            isActive ? 'text-foreground font-medium' : 'text-foreground'
                          )}>
                          {truncateText(chat.lastMessage.content)}
                        </p>
                        )}
                        {state !== 'collapsed' && !chat.lastMessage && (
                          <p className={cn(
                            'text-sm text-left w-full',
                            isActive ? 'text-muted-foreground' : 'text-muted-foreground'
                          )}>
                            Empty chat
                          </p>
                        )}
                      </SidebarMenuButton>
                      {state !== 'collapsed' && (
                        <SidebarMenuAction showOnHover>
                          <Tooltip>
                            <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                                className="h-6 w-6"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDelete(e, chat.chatId)}
                      disabled={deleting === chat.chatId}
                    >
                      {deleting === chat.chatId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      )}
                    </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete chat</p>
                            </TooltipContent>
                          </Tooltip>
                        </SidebarMenuAction>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
          )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
}
