"use client"

import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/classNames';

export type AchievementType = 'quest' | 'skill' | 'discovery' | 'milestone' | 'default';

export interface AchievementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
  title: string;
  description: React.ReactNode;
  achievement: string;
  reward?: string;
  type?: AchievementType;
  buttonText?: string;
  icon?: React.ReactNode;
}

const achievementTypeClasses: Record<AchievementType, string> = {
  quest: 'achievement-quest border-green-200 bg-gradient-to-br from-green-50 to-emerald-50',
  skill: 'achievement-skill border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50',
  discovery: 'achievement-discovery border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50',
  milestone: 'achievement-milestone border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50',
  default: 'achievement-default border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50',
};

export function AchievementDialog({
  isOpen,
  onClose,
  onContinue,
  title,
  description,
  achievement,
  reward,
  type = 'default',
  buttonText = 'Continue',
  icon,
}: AchievementDialogProps) {
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the continue button when dialog opens
      const timer = setTimeout(() => {
        if (continueButtonRef.current) {
          continueButtonRef.current.focus();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'max-w-lg sm:rounded-lg text-center',
          achievementTypeClasses[type]
        )}
        aria-labelledby="achievement-title"
        aria-describedby="achievement-description"
      >
        <DialogHeader className="space-y-4">
          {icon && (
            <div className="flex justify-center text-4xl mb-2">
              {icon}
            </div>
          )}
          
          <DialogTitle
            id="achievement-title"
            className="text-2xl font-bold text-center"
          >
            {title}
          </DialogTitle>
          
          <DialogDescription
            id="achievement-description"
            className="text-base text-gray-700"
            asChild
          >
            <div>
              {typeof description === 'string' ? (
                <p>{description}</p>
              ) : (
                description
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="py-6" role="status" aria-live="polite">
          <div className="bg-white/50 rounded-lg p-4 border border-white/20 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Achievement Unlocked
            </h3>
            <p className="text-xl font-bold text-gray-900 mb-4">
              {achievement}
            </p>
            
            {reward && (
              <div className="border-t border-gray-200 pt-3">
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Reward:</span>
                </p>
                <p className="text-base font-semibold text-gray-800">
                  {reward}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            ref={continueButtonRef}
            onClick={handleContinue}
            className="w-full"
            variant="default"
          >
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}