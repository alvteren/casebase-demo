import { useCallback, memo } from 'react';
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@casebase-demo/ui-components';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteButtonProps {
  documentId: string;
  onDelete: (documentId: string) => void | Promise<void>;
  isDeleting: boolean;
}

export const DeleteButton = memo(({ documentId, onDelete, isDeleting }: DeleteButtonProps) => {
  const handleClick = useCallback(() => {
    onDelete(documentId);
  }, [documentId, onDelete]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClick}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Delete document</p>
      </TooltipContent>
    </Tooltip>
  );
});

DeleteButton.displayName = 'DeleteButton';

