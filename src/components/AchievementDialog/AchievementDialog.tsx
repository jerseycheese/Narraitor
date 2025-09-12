"use client"

import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog';
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
  quest: 'achievement-quest border-green-200 bg-gradient-to-br from-green-50 to-green-50',
  skill: 'achievement-skill border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50',
  discovery: 'achievement-discovery border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50',
  milestone: 'achievement-milestone border-amber-500 bg-gradient-to-br from-amber-50 to-amber-50',
  default: 'achievement-default border-gray-200 bg-gradient-to-br from-gray-50 to-gray-50',
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          'max-w-lg text-center',
          achievementTypeClasses[type]
        )}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            {title || "Achievement Unlocked"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
        {icon && (
          <div className="flex justify-center text-4xl mb-2">
            {icon}
          </div>
        )}
        
        {description && (
          <div className="text-base text-muted-foreground">
            {description}
          </div>
        )}

        
        <div className="py-6" role="status" aria-live="polite">
          <div className="bg-white/50 rounded-lg p-4 border border-white/20 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Achievement Unlocked
            </h3>
            <p className="text-xl font-bold text-foreground mb-4">
              {achievement}
            </p>
            
            {reward && (
              <div className="border-t border-border pt-3">
                <p className="text-sm text-muted-foreground mb-1">
                  <span className="font-medium">Reward:</span>
                </p>
                <p className="text-base font-semibold text-foreground">
                  {reward}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-center pt-4">
          <Button
            ref={continueButtonRef}
            onClick={handleContinue}
            className="w-full"
            variant="default"
          >
            {buttonText}
          </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}