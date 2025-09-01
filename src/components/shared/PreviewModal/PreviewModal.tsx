// src/components/shared/PreviewModal/PreviewModal.tsx

import React, { memo } from 'react';
import { Modal, ModalProps } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/button';
import { wizardStyles } from '@/components/shared/wizard/styles/wizardStyles';

interface PreviewModalProps<T> extends Pick<ModalProps, 'size' | 'closeOnBackdropClick'> {
  /** Whether the modal is open */
  isOpen: boolean;
  /** The data to preview */
  data: T;
  /** Title for the preview modal */
  title: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Function to render the preview content */
  renderContent: (data: T) => React.ReactNode;
  /** Called when user confirms/accepts the preview */
  onConfirm: () => void;
  /** Called when user cancels/goes back */
  onCancel: () => void;
  /** Text for the confirm button */
  confirmText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Additional footer content */
  footerNote?: string;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Generic preview modal component for displaying generated content
 * Extends the existing Modal component for consistent behavior
 * Reusable across different features (world templates, characters, etc.)
 */
function PreviewModalInner<T>({
  isOpen,
  data,
  title,
  subtitle,
  renderContent,
  onConfirm,
  onCancel,
  confirmText = 'Use This',
  cancelText = 'Back',
  footerNote,
  size = 'xl',
  closeOnBackdropClick = false,
  className
}: PreviewModalProps<T>) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size={size}
      closeOnBackdropClick={closeOnBackdropClick}
      showCloseButton={true}
      className={className}
    >
      <div className="space-y-6">
        {subtitle && (
          <p className="text-gray-700 -mt-2">{subtitle}</p>
        )}

        {renderContent(data)}

        {/* Action Buttons */}
        <div className={wizardStyles.navigation.container}>
          <Button
            onClick={onCancel}
            variant="outline"
            size="default"
          >
            {cancelText}
          </Button>
          <div className={wizardStyles.navigation.buttonGroup}>
            <Button
              onClick={onConfirm}
              variant="default"
              size="default"
            >
              {confirmText}
            </Button>
          </div>
        </div>

        {/* Footer Note */}
        {footerNote && (
          <div className="text-center text-sm text-gray-500 italic border-t pt-4 mt-6">
            {footerNote}
          </div>
        )}
      </div>
    </Modal>
  );
}

export const PreviewModal = memo(PreviewModalInner) as typeof PreviewModalInner;