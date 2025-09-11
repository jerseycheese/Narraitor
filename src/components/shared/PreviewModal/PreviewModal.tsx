// src/components/shared/PreviewModal/PreviewModal.tsx

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
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
  size = 'xl',
  closeOnBackdropClick = false,
  className
}: PreviewModalProps<T>) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && (
            <DialogDescription>{subtitle}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {renderContent(data)}

          {/* Footer Note */}
          {footerNote && (
            <div className="text-center text-sm text-muted-foreground italic border-t pt-4 mt-6">
              {footerNote}
            </div>
          )}
        </div>

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const PreviewModal = memo(PreviewModalInner) as typeof PreviewModalInner;