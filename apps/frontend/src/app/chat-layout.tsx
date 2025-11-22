import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ChatSidebar, SidebarProvider, SidebarInset, SidebarTrigger } from '@casebase-demo/ui-components';
import { setLastChatId, clearLastChatId } from '@casebase-demo/utils';

export function ChatLayout() {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  return (
    <SidebarProvider className="flex flex-row h-screen w-full">
      <ChatSidebar 
        onNewChat={handleNewChat} 
        onChatSelect={handleChatSelect}
        refreshTrigger={refreshTrigger}
      />
      <SidebarInset className="flex-1 min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <div className="flex flex-1 flex-col overflow-hidden">
          <Outlet context={{ refreshChatList: () => setRefreshTrigger((prev) => prev + 1) }} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
