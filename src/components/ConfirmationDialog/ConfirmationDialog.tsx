"use client"

import React, { useEffect, useRef } from 'react';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/classNames';

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

const variantClasses: Record<ConfirmationVariant, string> = {
  default: 'border-gray-300 bg-white',
  destructive: 'border-red-700 bg-white',
  warning: 'border-amber-700 bg-white',
  info: 'border-blue-300 bg-white',
};

const confirmButtonVariants: Record<ConfirmationVariant, "default" | "destructive"> = {
  default: 'default',
  destructive: 'destructive',
  warning: 'default',
  info: 'default',
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
      title={title || "Confirmation Required"}
      showCloseButton={false}
      size="md"
      className={cn(
        'component-confirmation-dialog max-w-md sm:rounded-lg',
        variantClasses[variant]
      )}
    >
      <div className="text-sm text-gray-700 mb-6">
        {typeof message === 'string' ? (
          message
        ) : (
          message
        )}
      </div>
      
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <Button
          ref={cancelButtonRef}
          onClick={onClose}
          variant="outline"
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {cancelText}
        </Button>
        <Button
          ref={confirmButtonRef}
          onClick={onConfirm}
          variant={confirmButtonVariants[variant]}
          disabled={isLoading}
          className={cn(
            'w-full sm:w-auto',
            variant === 'destructive' && 'bg-red-700 hover:bg-red-900 text-white'
          )}
        >
          {isLoading ? loadingText : confirmText}
        </Button>
      </div>
    </SimpleModal>
  );
}