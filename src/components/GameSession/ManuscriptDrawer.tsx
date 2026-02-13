'use client';

import React from 'react';
import { X } from 'lucide-react';
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[220] bg-black/45 animate-in fade-in duration-300" />
        <DialogContent
          showCloseButton={false}
          data-testid="manuscript-drawer"
          className={cssClasses(
            "fixed top-0 h-full w-full max-w-md z-[230] bg-background border-border shadow-2xl flex flex-col animate-in duration-300",
            side === 'right' 
              ? "right-0 border-l slide-in-from-right" 
              : "left-0 border-r slide-in-from-left"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <DialogTitle className="text-lg font-serif font-semibold text-foreground">
              {title}
            </DialogTitle>
            <DialogClose className="rounded-full p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
              <X className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
          <div className="flex-grow overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-muted">
            {children}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
