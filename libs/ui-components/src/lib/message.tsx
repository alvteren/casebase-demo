import { Card, CardContent } from './card';
import { Button } from './button';
import { cn } from '@casebase-demo/utils';
import { User, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { Markdown } from './markdown';
import { ChatMessage, ContextItem } from '@casebase-demo/shared-types';

interface MessageProps {
  message: ChatMessage & { timestamp: Date };
  index: number;
  showContext: boolean;
  onToggleContext: () => void;
}

export function Message({
  message,
  showContext,
  onToggleContext,
}: MessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div
      className={cn('flex items-end gap-3', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="shrink-0">
          <Bot className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      
      <Card
        className={cn(
          'max-w-3xl',
          isUser
            ? 'bg-blue-400 border-blue-400 text-white'
            : 'bg-card text-card-foreground'
        )}
      >
        <CardContent className="px-4 py-3">
          <div className="flex-1">
              <Markdown className={isUser ? 'text-white' : 'text-card-foreground'}>{message.content}</Markdown>
            
              {message.context && message.context.length > 0 && (
                <div className="mt-2">
                  <Button
                    onClick={onToggleContext}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'text-xs h-auto p-0',
                      isUser
                        ? 'text-accent-foreground/80 hover:text-accent-foreground'
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
                      {message.context.map((item: ContextItem, ctxIndex: number) => (
                        <Card
                          key={ctxIndex}
                          className={cn(
                            'text-xs p-2',
                            isUser
                              ? 'bg-accent/20 text-accent-foreground/90'
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
              
            </div>
        </CardContent>
      </Card>
      
      {isUser && (
        <div className="shrink-0">
          <User className="w-6 h-6 text-blue-400" />
        </div>
      )}
    </div>
  );
}

