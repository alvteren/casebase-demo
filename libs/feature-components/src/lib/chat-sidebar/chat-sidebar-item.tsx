import { useCallback, memo } from 'react';
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Badge,
} from '@casebase-demo/ui-components';
import { MessageSquare, Loader2, Trash2 } from 'lucide-react';
import { ChatHistoryListItem } from '@casebase-demo/api-services';
import { cn, formatDate } from '@casebase-demo/utils';

interface ChatSidebarItemProps {
  chat: ChatHistoryListItem;
  isActive: boolean;
  isCollapsed: boolean;
  onChatClick: (chatId: string) => void;
  onDelete: (e: React.MouseEvent, chatId: string) => void;
  isDeleting: boolean;
}

const truncateText = (text: string, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const ChatSidebarItem = memo(({
  chat,
  isActive,
  isCollapsed,
  onChatClick,
  onDelete,
  isDeleting,
}: ChatSidebarItemProps) => {
  const handleChatClick = useCallback(() => {
    onChatClick(chat.chatId);
  }, [chat.chatId, onChatClick]);

  const handleDelete = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    onDelete(e, chat.chatId);
  }, [chat.chatId, onDelete]);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={isCollapsed ? formatDate(chat.updatedAt) : undefined}
        onClick={handleChatClick}
        className="flex flex-col gap-1 items-start h-auto py-2"
      >
        <div className="flex items-center gap-2 w-full">
          <MessageSquare className={cn(
            'w-4 h-4 shrink-0',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )} />
          {!isCollapsed && (
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
        {!isCollapsed && chat.lastMessage && (
          <p className={cn(
            'text-sm line-clamp-2 text-left w-full',
            isActive ? 'text-foreground font-medium' : 'text-foreground'
          )}>
            {truncateText(chat.lastMessage.content)}
          </p>
        )}
        {!isCollapsed && !chat.lastMessage && (
          <p className={cn(
            'text-sm text-left w-full',
            isActive ? 'text-muted-foreground' : 'text-muted-foreground'
          )}>
            Empty chat
          </p>
        )}
      </SidebarMenuButton>
      {!isCollapsed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuAction
              showOnHover
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-6 w-6"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 text-destructive" />
              )}
            </SidebarMenuAction>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete chat</p>
          </TooltipContent>
        </Tooltip>
      )}
    </SidebarMenuItem>
  );
});

ChatSidebarItem.displayName = 'ChatSidebarItem';

