import { MessageCircle } from 'lucide-react';
import { Card } from '@casebase-demo/ui-components';

export function EmptyChat() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <Card className="p-8 max-w-md">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">
            Start a conversation by asking a question
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Ask general questions or upload documents to ask questions about them
          </p>
        </div>
      </Card>
    </div>
  );
}

