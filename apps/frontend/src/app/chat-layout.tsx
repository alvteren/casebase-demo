import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ChatSidebar } from '@casebase-demo/ui-components';
import { setLastChatId, clearLastChatId } from '@casebase-demo/utils';
import { cn } from '@casebase-demo/utils';

const MIN_SIDEBAR_WIDTH = 200;
const DEFAULT_SIDEBAR_WIDTH = 320; // w-80 = 320px

export function ChatLayout() {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const currentWidthRef = useRef<number>(DEFAULT_SIDEBAR_WIDTH);

  const sidebarCollapsed = sidebarWidth < MIN_SIDEBAR_WIDTH;

  const handleNewChat = () => {
    // Clear last chat ID to prevent redirect to last chat
    // Navigate to new chat without creating one
    // Chat will be created automatically when first message is sent
    clearLastChatId();
    navigate('/chat');
  };

  const handleChatSelect = (chatId: string) => {
    setLastChatId(chatId);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    currentWidthRef.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = startXRef.current - e.clientX; // Positive when dragging left
      const newWidth = Math.max(0, Math.min(startWidthRef.current - deltaX, 600)); // Max width 600px
      currentWidthRef.current = newWidth;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // Auto-collapse if width is less than minimum
        if (currentWidthRef.current < MIN_SIDEBAR_WIDTH) {
          currentWidthRef.current = 0;
          setSidebarWidth(0);
        }
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <div className="flex h-screen bg-background relative">
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="relative shrink-0 border-r border-border overflow-hidden"
        style={{ width: sidebarCollapsed ? 0 : `${sidebarWidth}px`, transition: isDragging ? 'none' : 'width 0.2s ease-in-out' }}
      >
        <div className={cn(
          'h-full transition-opacity duration-200',
          sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}>
          <ChatSidebar 
            onNewChat={handleNewChat} 
            onChatSelect={handleChatSelect}
            refreshTrigger={refreshTrigger}
          />
        </div>
        
        {/* Resize Handle */}
        {!sidebarCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              'absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10',
              isDragging && 'bg-primary'
            )}
            style={{ cursor: 'col-resize' }}
          />
        )}
      </div>

      {/* Expand Handle (when collapsed) */}
      {sidebarCollapsed && (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            currentWidthRef.current = DEFAULT_SIDEBAR_WIDTH;
            setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
          }}
          className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/30 transition-colors z-10"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet context={{ refreshChatList: () => setRefreshTrigger((prev) => prev + 1) }} />
      </div>
    </div>
  );
}

