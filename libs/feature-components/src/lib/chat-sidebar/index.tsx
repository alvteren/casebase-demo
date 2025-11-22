import { useEffect, useState, useCallback } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
  useSidebar,
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@casebase-demo/ui-components';
import { chatService, ChatHistoryListItem } from '@casebase-demo/api-services';
import { Plus, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@casebase-demo/utils';
import { ChatSidebarItem } from './chat-sidebar-item';

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

  const loadChats = useCallback(async () => {
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
  }, []);

  // Load chats on mount and when trigger changes
  useEffect(() => {
    loadChats();
  }, [loadChats, refreshTrigger]);

  const handleChatClick = useCallback((chatId: string) => {
    navigate(`/chat/${chatId}`);
    onChatSelect?.(chatId);
  }, [navigate, onChatSelect]);

  const handleDelete = useCallback(async (e: React.MouseEvent, chatId: string) => {
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
  }, [currentChatId, navigate]);


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
                {chats.map((chat) => (
                  <ChatSidebarItem
                    key={chat.chatId}
                    chat={chat}
                    isActive={currentChatId === chat.chatId}
                    isCollapsed={state === 'collapsed'}
                    onChatClick={handleChatClick}
                    onDelete={handleDelete}
                    isDeleting={deleting === chat.chatId}
                  />
                ))}
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
