'use client';

import React from 'react';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { cssClasses } from '@/lib/utils/classNames';

interface ManuscriptDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
}

export const ManuscriptDrawer: React.FC<ManuscriptDrawerProps> = ({
  open,
  onOpenChange,
  title,
  children,
  side = 'right',
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
      <DialogPortal>
        <DialogOverlay className="manuscript-overlay-backdrop manuscript-drawer-backdrop" />
        <DialogContent
          showCloseButton={false}
          data-testid="manuscript-drawer"
          className={cssClasses(
            'manuscript-drawer-panel',
            side === 'right' 
              ? 'manuscript-drawer-panel-right'
              : 'manuscript-drawer-panel-left'
          )}
        >
          <div className="manuscript-drawer-header">
            <DialogTitle className="manuscript-drawer-title">
              {title}
            </DialogTitle>
            <DialogClose className="manuscript-drawer-close-text">
              Close
            </DialogClose>
          </div>
          <div className="manuscript-drawer-content">
            {children}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
