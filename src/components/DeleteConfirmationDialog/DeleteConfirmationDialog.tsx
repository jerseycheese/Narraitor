import React from 'react';
import { Button } from '@/components/ui/button';
import { SimpleModal } from '@/components/shared/SimpleModal';

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
    <SimpleModal 
      isOpen={isOpen} 
      onClose={onClose}
      title={title}
      showCloseButton={false}
      size="md"
      className="component-delete-confirmation-dialog max-w-md"
    >
      <div className="mb-6">
        <p className="mb-2 text-sm text-gray-700">{description}</p>
        <p className="font-medium text-foreground">{itemName}</p>
      </div>
      
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
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
      </div>
    </SimpleModal>
  );
};

export default DeleteConfirmationDialog;
