import React from 'react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div data-testid="delete-confirmation-dialog">
      <div data-testid="delete-confirmation-dialog-message">{message}</div>
      <button onClick={onConfirm} data-testid="delete-confirmation-dialog-confirm-button">
        Confirm
      </button>
      <button onClick={onClose} data-testid="delete-confirmation-dialog-cancel-button">
        Cancel
      </button>
    </div>
  );
};

export default DeleteConfirmationDialog;