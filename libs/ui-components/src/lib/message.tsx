interface MessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    context?: Array<{
      text: string;
      score: number;
      source?: string;
    }>;
    tokensUsed?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
  index: number;
  showContext: boolean;
  onToggleContext: () => void;
}

export function Message({
  message,
  index,
  showContext,
  onToggleContext,
}: MessageProps) {
  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-3xl rounded-lg px-4 py-3 ${
          message.role === 'user'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-800 border border-gray-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            {message.role === 'user' ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <div className="whitespace-pre-wrap">{message.content}</div>
            {message.tokensUsed && (
              <div
                className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                Tokens: {message.tokensUsed.total} (prompt: {message.tokensUsed.prompt},
                completion: {message.tokensUsed.completion})
              </div>
            )}
            {message.context && message.context.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={onToggleContext}
                  className={`text-xs underline ${
                    message.role === 'user'
                      ? 'text-blue-100'
                      : 'text-blue-600'
                  }`}
                >
                  {showContext ? 'Hide' : 'Show'} sources (
                  {message.context.length})
                </button>
                {showContext && (
                  <div className="mt-2 space-y-2">
                    {message.context.map((item, ctxIndex) => (
                      <div
                        key={ctxIndex}
                        className={`text-xs p-2 rounded ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-blue-50'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="font-semibold mb-1">
                          Source {ctxIndex + 1}
                          {item.source && ` - ${item.source}`}
                          <span className="ml-2 opacity-75">
                            (Score: {item.score.toFixed(3)})
                          </span>
                        </div>
                        <div className="opacity-90">
                          {item.text.substring(0, 200)}
                          {item.text.length > 200 && '...'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div
              className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
              }`}
            >
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

