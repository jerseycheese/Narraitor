import React from 'react';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';

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
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={description}
      variant="destructive"
      confirmText={confirmButtonText}
      cancelText={cancelButtonText}
      confirmAriaLabel={`${confirmButtonText} ${itemName}`}
      cancelAriaLabel={`${cancelButtonText} deletion`}
      isLoading={isDeleting}
      loadingText="Deleting..."
      customBody={<p>{itemName}</p>}
    />
  );
};

export default DeleteConfirmationDialog;
