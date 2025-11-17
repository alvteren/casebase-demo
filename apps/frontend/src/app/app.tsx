import '../styles.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './header';
import { Chat } from './chat';

export function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
