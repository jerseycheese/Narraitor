"use client"

import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  default: 'border-gray-200 bg-white',
  destructive: 'border-red-200 bg-red-50',
  warning: 'border-yellow-200 bg-yellow-50',
  info: 'border-blue-200 bg-blue-50',
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'max-w-md sm:rounded-lg',
          variantClasses[variant]
        )}
        aria-labelledby={title ? "confirmation-title" : undefined}
        aria-describedby="confirmation-message"
      >
        {title && (
          <DialogHeader>
            <DialogTitle
              id="confirmation-title"
              className="text-lg font-semibold"
            >
              {title}
            </DialogTitle>
          </DialogHeader>
        )}
        
        <DialogDescription
          id="confirmation-message"
          className="text-sm text-gray-700 py-4"
          asChild
        >
          <div>
            {typeof message === 'string' ? (
              <p>{message}</p>
            ) : (
              message
            )}
          </div>
        </DialogDescription>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
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
              variant === 'destructive' && 'bg-red-600 hover:bg-red-700 text-white'
            )}
          >
            {isLoading ? loadingText : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}