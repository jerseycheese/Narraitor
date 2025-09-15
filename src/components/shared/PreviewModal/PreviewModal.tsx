// src/components/shared/PreviewModal/PreviewModal.tsx

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { wizardStyles } from '@/components/shared/wizard/styles/wizardStyles';

interface PreviewModalProps<T> {
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
  /** Modal size */
  size?: string;
  /** Whether to close on backdrop click */
  closeOnBackdropClick?: boolean;
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
  className
}: PreviewModalProps<T>) {
  return (
    <SimpleModal 
      isOpen={isOpen} 
      onClose={onCancel}
      title={title}
      showCloseButton={false}
      size="lg"
      className={className}
    >
      <p className="text-sm text-gray-700 mb-6">
        {subtitle || "Preview content before confirming your selection."}
      </p>

      <div className="space-y-6">
        {renderContent(data)}

        {/* Footer Note */}
        {footerNote && (
          <div className="text-center text-sm text-muted-foreground italic border-t pt-4 mt-6">
            {footerNote}
          </div>
        )}
      </div>

      <div className={wizardStyles.navigation.container + " mt-6"}>
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
    </SimpleModal>
  );
}

export const PreviewModal = memo(PreviewModalInner) as typeof PreviewModalInner;