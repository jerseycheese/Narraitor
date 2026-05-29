import React, { useId } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
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
  const fallbackDescriptionId = useId();
  const resolvedDescriptionId =
    ariaDescribedBy ||
    (description ? `${fallbackDescriptionId}-description` : undefined);
  const hasHeaderContent = Boolean(title || showCloseButton || description);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => (open ? undefined : onClose())}
    >
      <DialogContent
        aria-describedby={resolvedDescriptionId}
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
              {description && (
                <div id={ariaDescribedBy ? undefined : resolvedDescriptionId}>
                  {description}
                </div>
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
            className={contentClassName}
            data-scroll-container={scrollBehavior === 'content' ? 'content' : undefined}
          >
            {children}
          </div>
        ) : null}

        {footer && (
          <div
            className={footerClassName}
            data-sticky-footer={stickyFooter ? 'true' : undefined}
          >
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}