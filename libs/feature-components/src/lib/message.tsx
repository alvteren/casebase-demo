import { useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { Card, CardContent, Button, Tooltip, TooltipContent, TooltipTrigger } from '@casebase-demo/ui-components';
import { cn, exportElementToPdf } from '@casebase-demo/utils';
import { User, Bot, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Markdown } from '@casebase-demo/ui-components';
import { ChatMessage, ContextItem } from '@casebase-demo/shared-types';

interface MessageProps {
  message: ChatMessage & { timestamp: Date };
  onExportSuccess?: () => void;
  onExportError?: (error: string) => void;
}

export interface MessageRef {
  getElement: () => HTMLElement | null;
}

export const Message = forwardRef<MessageRef, MessageProps>(({
  message,
  onExportSuccess,
  onExportError,
}, ref) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const [showContext, setShowContext] = useState(false);
  const [isPdfVersion, setPdfVersion] = useState(false);
  const isUser = message.role === 'user';
  
  useImperativeHandle(ref, () => ({
    getElement: () => messageRef.current,
  }));

  const handleToggleContext = () => {
    setShowContext((prev) => !prev);
  };

  const handleExport = async () => {
    const element = messageRef.current;
    if (!element) {
      onExportError?.('Message element not found');
      return;
    }
    setPdfVersion(true)

    try {
      await exportElementToPdf(element);
      setPdfVersion(false)
      onExportSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export message';
      onExportError?.(errorMessage);
    }
  };
  
  return (
    <>
      <div
        className={cn('flex items-end max-w-3xl gap-3', isUser ? 'justify-end self-end' : 'justify-start self-start')}
      >
        {!isUser && (
          <div className="shrink-0">
            <Bot className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        
        <Card
          className={cn(
            isUser
              ? 'bg-primary text-white'
              : 'bg-card text-card-foreground'
          )}
        >
          <CardContent className="px-4 py-3">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Markdown className={isUser ? 'text-white' : 'text-card-foreground'}>{message.content}</Markdown>
                </div>
              </div>
              
                {message.context && message.context.length > 0 && (
                  <div className="mt-2">
                    <Button
                      onClick={handleToggleContext}
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
            <User className="w-6 h-6 text-primary" />
          </div>
        )}
        {!isUser && (
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleExport}
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-8 w-8 p-0"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export this message to PDF</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      {/* This is the hidden PDF version of the message */}
      <div className="-z-50" ref={messageRef}>
        {isPdfVersion && (
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <Markdown className={isUser ? 'text-white' : 'text-card-foreground'}>{message.content}</Markdown>
              </div>
            </div>
            
              {message.context && message.context.length > 0 && (
                <div className="mt-2">
                    <b>Used sources ({message.context.length})</b>
                    
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
                </div>
              )}
          </div>
        )}
      </div>
    </>
  );
});

Message.displayName = 'Message';

