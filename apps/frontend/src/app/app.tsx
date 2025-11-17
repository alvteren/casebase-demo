import '../styles.css';
import { useState } from 'react';
import { FileUpload } from './file-upload';
import { Chat } from './chat';

type Tab = 'upload' | 'chat';

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Casebase Demo</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === 'upload'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Upload Documents
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === 'chat'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Chat
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <button
              onClick={() => setActiveTab('upload')}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                activeTab === 'upload'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              Upload Documents
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                activeTab === 'chat'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              Chat
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main>
        {activeTab === 'upload' && <FileUpload />}
        {activeTab === 'chat' && <Chat />}
      </main>
    </div>
  );
}

export default App;
