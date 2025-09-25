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
      size="lg"
      tone="destructive"
      description={description}
      footer={(
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
      )}
      footerClassName="bg-background"
    >
      <p className="text-sm font-medium text-foreground">{itemName}</p>
    </SimpleModal>
  );
};

export default DeleteConfirmationDialog;
