import React from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  ariaDescribedBy?: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  footerClassName?: string;
  scrollBehavior?: 'overlay' | 'content';
  stickyFooter?: boolean;
}

export const isJoyrideTooltipTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest('.react-joyride__tooltip'));
};

export function SimpleModal({
  isOpen,
  onClose,
  title,
  children,
  className,
  overlayClassName,
  contentClassName,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  ariaDescribedBy,
  description,
  footer,
  footerClassName,
  scrollBehavior = 'overlay',
  stickyFooter,
}: SimpleModalProps) {
  // Radix wires DialogContent's aria-describedby to the DialogDescription we
  // render below. Only override that default to point at a caller-owned
  // element (ariaDescribedBy), or to opt out explicitly when the dialog has
  // no descriptive text at all -- a dangling aria-describedby makes Radix
  // warn about a missing Description.
  const describedByOverride =
    description && !ariaDescribedBy
      ? {}
      : { 'aria-describedby': ariaDescribedBy };
  const hasHeaderContent = Boolean(title || showCloseButton || description);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => (open ? undefined : onClose())}
    >
      <DialogContent
        {...describedByOverride}
        showCloseButton={false}
        overlayScroll={scrollBehavior === 'overlay'}
        overlayClassName={overlayClassName}
        className={className}
        onInteractOutside={(event) => {
          if (isJoyrideTooltipTarget(event.target)) {
            event.preventDefault();
            return;
          }

          if (!closeOnBackdropClick) {
            event.preventDefault();
            return;
          }
        }}
        onEscapeKeyDown={(event) => {
          if (!closeOnEscape) {
            event.preventDefault();
          }
        }}
      >
        {hasHeaderContent && (
          <div>
            <div>
              {title && <DialogTitle>{title}</DialogTitle>}
              {/* asChild keeps this a div: description accepts arbitrary
                  nodes (some callers pass <p> blocks), which the default
                  Radix <p> element could not legally contain. */}
              {description && (
                <DialogDescription asChild>
                  <div className="dialog-description">{description}</div>
                </DialogDescription>
              )}
            </div>
            {showCloseButton && (
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close modal"
                >
                  <X aria-hidden="true" />
                </Button>
              </DialogClose>
            )}
          </div>
        )}

        {(children !== undefined && children !== null) || !hasHeaderContent ? (
          <div
            className={clsx('dialog-body', contentClassName)}
            data-scroll-container={scrollBehavior === 'content' ? 'content' : undefined}
          >
            {children}
          </div>
        ) : null}

        {footer && (
          <div
            className={clsx('dialog-footer', footerClassName)}
            data-sticky-footer={stickyFooter ? 'true' : undefined}
          >
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}