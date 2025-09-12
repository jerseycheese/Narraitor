import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isDeleting?: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  isDeleting = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="component-delete-confirmation-dialog max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div>
              <p className="mb-2">{description}</p>
              <p className="font-medium text-foreground">{itemName}</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            variant="outline"
            aria-label={`${cancelButtonText} deletion`}
          >
            {cancelButtonText}
          </Button>
          
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            variant="destructive"
            aria-label={`${confirmButtonText} ${itemName}`}
          >
            {isDeleting ? 'Deleting...' : confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
