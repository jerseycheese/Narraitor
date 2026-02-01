// src/components/shared/SimpleModal.tsx

import React, { useId } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils/classNames';

interface SimpleModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children?: React.ReactNode;
  /** Additional CSS classes for the modal content */
  className?: string;
  /** Optional classes for the scrolling content wrapper */
  contentClassName?: string;
  /** Determines where scrolling happens */
  scrollBehavior?: 'content' | 'overlay';
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Whether to close on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Whether to close on escape key */
  closeOnEscape?: boolean;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** ID of element describing the modal content */
  ariaDescribedBy?: string;
  /** Optional contextual descriptor rendered under the title */
  description?: React.ReactNode;
  /** Footer region rendered inside a padded container */
  footer?: React.ReactNode;
  /** Optional class overrides for the footer wrapper */
  footerClassName?: string;
  /** Whether to keep the footer visible while overlay scrolling */
  stickyFooter?: boolean;
  /** Contextual tone to align borders and accents with design tokens */
  tone?: 'default' | 'info' | 'success' | 'warning' | 'destructive';
}

export const isJoyrideTooltipTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest('.react-joyride__tooltip'));
};

const SIZE_CLASSES: Record<NonNullable<SimpleModalProps['size']>, string> = {
  sm: '!max-w-sm',
  md: '!max-w-md',
  lg: '!max-w-lg',
  xl: '!max-w-xl',
};

const TONE_STYLES: Record<NonNullable<SimpleModalProps['tone']>, {
  frame: string;
  header: string;
  headerBorder: string;
  footerBorder: string;
  closeButton: string;
}> = {
  default: {
    frame: 'border border-border',
    header: '',
    headerBorder: 'border-border',
    footerBorder: 'border-border',
    closeButton: 'text-muted-foreground hover:text-foreground',
  },
  info: {
    frame: 'border border-info/50',
    header: 'bg-info/10',
    headerBorder: 'border-info/40',
    footerBorder: 'border-info/40',
    closeButton: 'text-info hover:text-info/80',
  },
  success: {
    frame: 'border border-success/50',
    header: 'bg-success/10',
    headerBorder: 'border-success/40',
    footerBorder: 'border-success/40',
    closeButton: 'text-success hover:text-success/80',
  },
  warning: {
    frame: 'border border-warning/60',
    header: 'bg-warning/10',
    headerBorder: 'border-warning/40',
    footerBorder: 'border-warning/40',
    closeButton: 'text-warning hover:text-warning/80',
  },
  destructive: {
    frame: 'border border-destructive/60',
    header: 'bg-destructive/10',
    headerBorder: 'border-destructive/40',
    footerBorder: 'border-destructive/40',
    closeButton: 'text-destructive hover:text-destructive/80',
  },
};

/**
 * SimpleModal - Accessible dialog wrapper using the shared design-system primitives.
 *
 * Provides consistent styling, Radix-driven focus management, and configurable
 * close affordances while keeping the existing component API intact.
 */
export function SimpleModal({
  isOpen,
  onClose,
  title,
  children,
  className,
  contentClassName,
  scrollBehavior = 'overlay',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  size = 'md',
  ariaDescribedBy,
  description,
  footer,
  footerClassName,
  stickyFooter = false,
  tone = 'default',
}: SimpleModalProps) {
  const toneStyles = TONE_STYLES[tone];
  const fallbackDescriptionId = useId();
  const resolvedDescriptionId =
    ariaDescribedBy || (description ? `${fallbackDescriptionId}-description` : undefined);
  const hasHeaderContent = Boolean(title || showCloseButton || description);
  const isOverlayScroll = scrollBehavior === 'overlay';
  const shouldStickFooter = Boolean(footer) && stickyFooter && isOverlayScroll;

  return (
    <Dialog open={isOpen} onOpenChange={open => (open ? undefined : onClose())}>
      <DialogContent
        aria-describedby={resolvedDescriptionId}
        showCloseButton={false}
        overlayScroll={isOverlayScroll}
        className={cn(
          '!flex !flex-col !gap-0 !p-0 bg-background text-foreground shadow-xl focus:outline-none focus-visible:outline-none',
          'dark:bg-white dark:text-gray-900',
          toneStyles.frame,
          'w-full sm:rounded-xl',
          SIZE_CLASSES[size],
          !isOverlayScroll ? 'max-h-[100dvh] overflow-hidden' : undefined,
          className,
        )}
        onInteractOutside={event => {
          if (isJoyrideTooltipTarget(event.target)) {
            event.preventDefault();
            return;
          }

          if (!closeOnBackdropClick) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={event => {
          if (!closeOnEscape) {
            event.preventDefault();
          }
        }}
      >
        {hasHeaderContent && (
          <div
            className={cn(
              'flex items-start justify-between gap-4 border-b px-6 py-5',
              toneStyles.header,
              toneStyles.headerBorder,
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {title && (
                <DialogTitle className="text-lg font-semibold text-foreground dark:text-gray-900">
                  {title}
                </DialogTitle>
              )}
              {description && (
                <div
                  id={ariaDescribedBy ? undefined : resolvedDescriptionId}
                  className="text-sm text-muted-foreground"
                >
                  {description}
                </div>
              )}
            </div>
            {showCloseButton && (
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-9 w-9 shrink-0',
                    toneStyles.closeButton,
                  )}
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DialogClose>
            )}
          </div>
        )}

        {(children !== undefined && children !== null) || !hasHeaderContent ? (
          <div
            data-scroll-container={isOverlayScroll ? undefined : 'content'}
            className={cn(
              'flex-1 px-6 py-6',
              isOverlayScroll ? undefined : 'overflow-y-auto',
              contentClassName,
            )}
          >
            {children}
          </div>
        ) : null}

        {footer && (
          <div
            data-sticky-footer={shouldStickFooter ? 'true' : undefined}
            className={cn(
              'border-t px-6 py-5',
              toneStyles.footerBorder,
              shouldStickFooter ? 'sticky bottom-0 z-10 bg-background dark:bg-white' : undefined,
              footerClassName,
            )}
          >
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
