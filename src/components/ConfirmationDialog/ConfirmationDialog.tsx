"use client"

import React, { useEffect, useRef } from 'react';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { Button } from '@/components/ui/button';

export type ConfirmationVariant = 'default' | 'destructive' | 'warning' | 'info';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: React.ReactNode;
  variant?: ConfirmationVariant;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  loadingText?: string;
}

const confirmButtonVariants: Record<ConfirmationVariant, 'default' | 'destructive'> = {
  default: 'default',
  destructive: 'destructive',
  warning: 'default',
  info: 'default',
};

const modalToneMap: Record<ConfirmationVariant, NonNullable<React.ComponentProps<typeof SimpleModal>['tone']>> = {
  default: 'default',
  destructive: 'destructive',
  warning: 'warning',
  info: 'info',
};

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'default',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  loadingText = 'Loading...',
}: ConfirmationDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && !isLoading) {
      // Focus the appropriate button when dialog opens
      const timer = setTimeout(() => {
        if (variant === 'destructive' && cancelButtonRef.current) {
          // Focus cancel button for destructive actions to prevent accidental confirmation
          cancelButtonRef.current.focus();
        } else if (confirmButtonRef.current) {
          confirmButtonRef.current.focus();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen, isLoading, variant]);

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Confirmation Required'}
      showCloseButton={false}
      size="lg"
      tone={modalToneMap[variant]}
      description={message}
      footer={(
        <div >
          <Button
            ref={cancelButtonRef}
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
            
          >
            {cancelText}
          </Button>
          <Button
            ref={confirmButtonRef}
            onClick={onConfirm}
            variant={confirmButtonVariants[variant]}
            disabled={isLoading}
            
          >
            {isLoading ? loadingText : confirmText}
          </Button>
        </div>
      )}
      footerClassName=""
    />
  );
}
