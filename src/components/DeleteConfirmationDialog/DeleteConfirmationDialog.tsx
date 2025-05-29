import React, { useEffect } from 'react';

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
  // Handle Escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      data-testid="dialog-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dialog-title" className="text-xl font-bold mb-4">
          {title}
        </h2>
        
        <div id="dialog-description" className="mb-4">
          <p className="text-gray-700 mb-2">{description}</p>
          <p className="font-medium text-gray-900">{itemName}</p>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className={`px-4 py-3 font-medium rounded-md transition-colors ${
              isDeleting
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cancelButtonText}
          </button>
          
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className={`px-4 py-3 font-medium rounded-md transition-colors ${
              isDeleting
                ? 'bg-red-300 text-red-100 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isDeleting ? 'Deleting...' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog;