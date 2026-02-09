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
      description={description}
      showCloseButton={false}
      size="lg"
      tone="destructive"
      footer={(
        <div >
          <Button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            variant=""
            aria-label={`${cancelButtonText}deletion`}
          >
            {cancelButtonText}
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            variant="destructive"
            aria-label={`${confirmButtonText}${itemName}`}
          >
            {isDeleting ? 'Deleting...' : confirmButtonText}
          </Button>
        </div>
      )}
      footerClassName=""
    >
      <p >{itemName}</p>
    </SimpleModal>
  );
};

export default DeleteConfirmationDialog;
