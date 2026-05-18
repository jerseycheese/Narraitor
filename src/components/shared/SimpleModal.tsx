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
import { cssClasses } from '@/lib/utils/classNames';

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
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Whether to close on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Whether to close on escape key */
  closeOnEscape?: boolean;
  /** ID of element describing the modal content */
  ariaDescribedBy?: string;
  /** Optional contextual descriptor rendered under the title */
  description?: React.ReactNode;
  /** Footer region rendered inside a padded container */
  footer?: React.ReactNode;
  /** Optional class overrides for the footer wrapper */
  footerClassName?: string;
  /** Scroll behavior: 'overlay' (default) or 'content' */
  scrollBehavior?: 'overlay' | 'content';
  /** Whether the footer should stick to the bottom */
  stickyFooter?: boolean;
}

export const isJoyrideTooltipTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest('.react-joyride__tooltip'));
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
        className={cssClasses(
          className
        )}
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