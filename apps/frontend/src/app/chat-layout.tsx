import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ChatSidebar } from '@casebase-demo/ui-components';
import { chatService } from '@casebase-demo/api-services';
import { setLastChatId } from '@casebase-demo/utils';

export function ChatLayout() {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewChat = () => {
    // Navigate to new chat without creating one
    // Chat will be created automatically when first message is sent
    navigate('/chat');
  };

  const handleChatSelect = (chatId: string) => {
    setLastChatId(chatId);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <ChatSidebar 
          onNewChat={handleNewChat} 
          onChatSelect={handleChatSelect}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet context={{ refreshChatList: () => setRefreshTrigger((prev) => prev + 1) }} />
      </div>
    </div>
  );
}

