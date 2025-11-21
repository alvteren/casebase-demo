import '../styles.css';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Chat } from './chat';
import { ChatLayout } from './chat-layout';
import { getLastChatId } from '@casebase-demo/utils';
import { TooltipProvider } from '@casebase-demo/ui-components';

function ChatRoute() {
  const { chatId } = useParams<{ chatId?: string }>();
  const lastChatId = getLastChatId();

  // If no chatId in URL, redirect to last chat or create new
  if (!chatId) {
    if (lastChatId) {
      return <Navigate to={`/chat/${lastChatId}`} replace />;
    }
    // Will be handled by Chat component to create new chat
  }

  return <Chat chatId={chatId} />;
}

export function App() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatLayout />}>
            <Route index element={<ChatRoute />} />
            <Route path=":chatId" element={<ChatRoute />} />
          </Route>
        </Routes>
      </div>
    </TooltipProvider>
  );
}

export default App;
