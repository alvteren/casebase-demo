import { MessageCircle, Info } from 'lucide-react';
import { Card } from './card';

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
          <div className="flex flex-col gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 justify-center">
              <Info className="w-4 h-4" />
              <span>Upload documents to ask questions about them using RAG</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <MessageCircle className="w-4 h-4" />
              <span>Ask general questions without uploading documents</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

