'use client';

import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Dialog,
} from '@/components/ui/dialog';
import { clsx } from 'clsx';

interface ManuscriptDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
  /**
   * Control to focus once the drawer closes, normally whatever opened it.
   * Radix's own restore runs while the outside content is still hidden from
   * assistive tech, so the focus call lands on nothing and the player is
   * dropped at <body> — the top of the tab order — after every Escape.
   */
  restoreFocusRef?: React.RefObject<HTMLElement | null>;
}

export const ManuscriptDrawer: React.FC<ManuscriptDrawerProps> = ({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  side = 'right',
  restoreFocusRef,
}) => {
  // Add manuscript-overlay-open class to body when drawer is open
  React.useEffect(() => {
    if (open) {
      document.body.classList.add('manuscript-overlay-open');
      document.documentElement.classList.add('manuscript-overlay-open');
    } else {
      document.body.classList.remove('manuscript-overlay-open');
      document.documentElement.classList.remove('manuscript-overlay-open');
    }
    return () => {
      document.body.classList.remove('manuscript-overlay-open');
      document.documentElement.classList.remove('manuscript-overlay-open');
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="manuscript-overlay-backdrop manuscript-drawer-backdrop" />
        <DialogPrimitive.Content
          className="manuscript-drawer-layer"
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            const trigger = restoreFocusRef?.current;
            if (!trigger?.isConnected) return;
            event.preventDefault();
            // A frame after the layer unwinds, so the trigger is visible to
            // focus() again rather than still hidden behind the modal.
            requestAnimationFrame(() => trigger.focus());
          }}
        >
          <aside
            className={clsx(
              'manuscript-drawer-panel',
              side === 'right'
                ? 'manuscript-drawer-panel-right'
                : 'manuscript-drawer-panel-left'
            )}
            data-testid="manuscript-drawer"
          >
            <div className="manuscript-drawer-header">
              <div className="manuscript-drawer-header-titles">
                <DialogPrimitive.Title className="manuscript-drawer-title">
                  {title}
                </DialogPrimitive.Title>
                {subtitle && (
                  <p className="manuscript-drawer-subtitle">{subtitle}</p>
                )}
              </div>
              <DialogPrimitive.Close className="manuscript-drawer-close-text">
                Close
              </DialogPrimitive.Close>
            </div>
            <div className="manuscript-drawer-content">
              {children}
            </div>
          </aside>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
};
