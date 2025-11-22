import { Card } from '@casebase-demo/ui-components';
import { Markdown } from '@casebase-demo/ui-components';
import { cn } from '@casebase-demo/utils';
import { ContextItem } from '@casebase-demo/shared-types';

interface MessagePdfContentProps {
  content: string;
  context?: ContextItem[];
}

export function MessagePdfContent({
  content,
  context,
}: MessagePdfContentProps) {
  return (
    <div className="flex-1">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <Markdown className="text-card-foreground">
            {content}
          </Markdown>
        </div>
      </div>

      {context && context.length > 0 && (
        <div className="mt-2">
          <b>Used sources ({context.length})</b>

          <div className="mt-2 space-y-2">
            {context.map((item: ContextItem, ctxIndex: number) => (
              <Card
                key={ctxIndex}
                className={cn(
                  'text-xs p-2',
                  'bg-muted text-muted-foreground'
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
  );
}

