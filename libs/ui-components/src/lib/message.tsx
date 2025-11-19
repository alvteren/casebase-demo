import { Card, CardContent } from './card';
import { Button } from './button';
import { cn } from '@casebase-demo/utils';
import { User, Bot, ChevronDown, ChevronUp } from 'lucide-react';

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
  showContext,
  onToggleContext,
}: MessageProps) {
  return (
    <div
      className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
    >
      <Card
        className={cn(
          'max-w-3xl',
          message.role === 'user'
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card text-card-foreground'
        )}
      >
        <CardContent className="px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              {message.role === 'user' ? (
                <User className="w-6 h-6" />
              ) : (
                <Bot className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
            <div className="whitespace-pre-wrap">{message.content}</div>
              {message.tokensUsed && (
                <div
                  className={cn(
                    'text-xs mt-2',
                    message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}
                >
                  Tokens: {message.tokensUsed.total} (prompt: {message.tokensUsed.prompt},
                  completion: {message.tokensUsed.completion})
                </div>
              )}
              {message.context && message.context.length > 0 && (
                <div className="mt-2">
                  <Button
                    onClick={onToggleContext}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'text-xs h-auto p-0',
                      message.role === 'user'
                        ? 'text-primary-foreground/80 hover:text-primary-foreground'
                        : 'text-primary hover:text-primary'
                    )}
                  >
                    {showContext ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 mr-1" />
                        Show
                      </>
                    )}{' '}
                    sources ({message.context.length})
                  </Button>
                  {showContext && (
                    <div className="mt-2 space-y-2">
                      {message.context.map((item, ctxIndex) => (
                        <Card
                          key={ctxIndex}
                          className={cn(
                            'text-xs p-2',
                            message.role === 'user'
                              ? 'bg-primary/20 text-primary-foreground/90'
                              : 'bg-muted text-muted-foreground'
                          )}
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
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div
                className={cn(
                  'text-xs mt-1',
                  message.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                )}
              >
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

