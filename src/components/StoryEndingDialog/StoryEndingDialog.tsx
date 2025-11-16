"use client"

import React, { useEffect, useRef } from 'react';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/classNames';
import { safeTrim } from '@/lib/utils';


export type EndingType = 'triumphant' | 'mysterious' | 'tragic' | 'default';

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
  triumphant: 'ending-triumphant border-amber-300',
  mysterious: 'ending-mysterious border-gray-300',
  tragic: 'ending-tragic border-destructive',
  default: 'ending-default border-gray-300',
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
    <SimpleModal 
      isOpen={isOpen} 
      onClose={onClose}
      title={(title && safeTrim(title)) || "Story Ending"}
      showCloseButton={false}
      size="xl"
      ariaDescribedBy="story-ending-content"
      className={cn(
        'sm:rounded-lg',
        endingTypeClasses[endingType]
      )}
    >
      <div
        id="story-ending-content"
        className="text-base leading-relaxed text-gray-700 mb-6"
      >
        {typeof content === 'string' ? (
          <p>{content}</p>
        ) : (
          content
        )}
      </div>
      
      <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2">
        <Button
          ref={closeButtonRef}
          onClick={onClose}
          variant="outline"
          className="w-full sm:w-auto"
          type="button"
          aria-label={`${closeText} and dismiss dialog`}
        >
          {closeText}
        </Button>
        {onContinue && (
          <Button
            ref={continueButtonRef}
            onClick={onContinue}
            className="w-full sm:w-auto bg-blue-700 hover:bg-blue-900 text-white border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            variant="default"
            type="button"
            aria-label={`${continueText} - this will show the story ending`}
          >
            {continueText}
          </Button>
        )}
      </div>
    </SimpleModal>
  );
}
