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
  message?: React.ReactNode;
  /** Extra body rendered as modal children below the description. */
  customBody?: React.ReactNode;
  variant?: ConfirmationVariant;
  confirmText?: string;
  cancelText?: string;
  confirmAriaLabel?: string;
  cancelAriaLabel?: string;
  isLoading?: boolean;
  loadingText?: string;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  customBody,
  variant = 'default',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmAriaLabel,
  cancelAriaLabel,
  isLoading = false,
  loadingText = 'Loading...',
}: ConfirmationDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && !isLoading) {
      const timer = setTimeout(() => {
        if (variant === 'destructive' && cancelButtonRef.current) {
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
      description={message}
      footer={(
        <div>
          <Button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
            aria-label={cancelAriaLabel}
          >
            {cancelText}
          </Button>
          <Button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            variant={variant}
            disabled={isLoading}
            aria-label={confirmAriaLabel}
          >
            {isLoading ? loadingText : confirmText}
          </Button>
        </div>
      )}
    >
      {customBody}
    </SimpleModal>
  );
}
