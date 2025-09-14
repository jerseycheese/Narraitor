"use client"

import React, { useEffect, useRef } from 'react';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/classNames';
import { safeTrim } from '@/lib/utils';


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
  triumphant: 'ending-triumphant border-amber-200 bg-gradient-to-br from-amber-50 to-amber-50',
  bittersweet: 'ending-bittersweet border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50',
  tragic: 'ending-tragic border-red-500 bg-gradient-to-br from-red-50 to-red-50',
  default: 'ending-default border-gray-200 bg-gradient-to-br from-gray-50 to-gray-50',
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
      size="md"
      className={cn(
        'max-w-lg sm:rounded-lg',
        endingTypeClasses[endingType]
      )}
    >
      <div
        className="text-base leading-relaxed text-gray-700 mb-6"
        aria-describedby="story-ending-content"
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
            aria-label={`${continueText} - this will generate the story ending`}
          >
            {continueText}
          </Button>
        )}
      </div>
    </SimpleModal>
  );
}