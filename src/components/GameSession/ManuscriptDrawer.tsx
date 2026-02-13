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
          className={cssClasses(
            "fixed top-0 h-full w-full max-w-md z-[230] bg-white border-zinc-200 shadow-2xl flex flex-col animate-in duration-300",
            side === 'right' 
              ? "right-0 border-l slide-in-from-right" 
              : "left-0 border-r slide-in-from-left"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-100">
            <DialogTitle className="text-lg font-serif font-semibold text-zinc-900">
              {title}
            </DialogTitle>
            <DialogClose className="rounded-full p-2 hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400">
              <X className="h-5 w-5 text-zinc-500" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
          <div className="flex-grow overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-200">
            {children}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
