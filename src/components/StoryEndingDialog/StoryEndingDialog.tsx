"use client"

import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/classNames';

export type EndingType = 'triumphant' | 'bittersweet' | 'tragic' | 'default';

export interface StoryEndingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  endingType?: EndingType;
  onContinue?: () => void;
  continueText?: string;
  closeText?: string;
}

const endingTypeClasses: Record<EndingType, string> = {
  triumphant: 'ending-triumphant border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50',
  bittersweet: 'ending-bittersweet border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50',
  tragic: 'ending-tragic border-red-200 bg-gradient-to-br from-red-50 to-rose-50',
  default: 'ending-default border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50',
};

export function StoryEndingDialog({
  isOpen,
  onClose,
  title,
  content,
  endingType = 'default',
  onContinue,
  continueText = 'Continue',
  closeText = 'Close',
}: StoryEndingDialogProps) {
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the appropriate button when dialog opens
      const timer = setTimeout(() => {
        if (onContinue && continueButtonRef.current) {
          continueButtonRef.current.focus();
        } else if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onContinue]);

  // Radix UI Dialog already handles escape key, so we don't need a custom handler

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'max-w-lg sm:rounded-lg',
          endingTypeClasses[endingType]
        )}
        aria-labelledby="story-ending-title"
        aria-describedby="story-ending-content"
      >
        <DialogHeader>
          <DialogTitle
            id="story-ending-title"
            className="text-xl font-bold text-center mb-4"
          >
            {title}
          </DialogTitle>
          <DialogDescription
            id="story-ending-content"
            className="text-base leading-relaxed text-gray-700"
            asChild
          >
            <div>
              {typeof content === 'string' ? (
                <p>{content}</p>
              ) : (
                content
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="mt-6">
          {onContinue && (
            <Button
              ref={continueButtonRef}
              onClick={onContinue}
              className="w-full sm:w-auto"
              variant="default"
            >
              {continueText}
            </Button>
          )}
          <DialogClose asChild>
            <Button
              ref={closeButtonRef}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {closeText}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}