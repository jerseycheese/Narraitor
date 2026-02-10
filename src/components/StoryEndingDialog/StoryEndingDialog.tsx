"use client"

import React, { useEffect, useRef } from 'react';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { Button } from '@/components/ui/button';
import { cssClasses } from '@/lib/utils/classNames';
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
  triumphant: 'ending-triumphant',
  mysterious: 'ending-mysterious',
  tragic: 'ending-tragic',
  default: 'ending-default',
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
      description={content}
      showCloseButton={false}
      size="xl"
      ariaDescribedBy="story-ending-content"
      className={cssClasses(
        '',
        endingTypeClasses[endingType]
      )}
    >
      <div>
        <Button
          ref={closeButtonRef}
          onClick={onClose}
          variant="outline"
          
          type="button"
        aria-label={`${closeText} and dismiss dialog`}
        >
          {closeText}
        </Button>
        {onContinue && (
          <Button
            ref={continueButtonRef}
            onClick={onContinue}
            
            variant="default"
            type="button"
            aria-label={`${continueText}- this will show the story ending`}
          >
            {continueText}
          </Button>
        )}
      </div>
    </SimpleModal>
  );
}
