import React from 'react';
import { cssClasses } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

interface ManuscriptFloatingHudProps {
  onToggleCharacterSummary: () => void;
  isCharacterSummaryExpanded: boolean;
  className?: string;
  characterSummaryPanel?: React.ReactNode;
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
}

export const ManuscriptFloatingHud: React.FC<ManuscriptFloatingHudProps> = ({
  onToggleCharacterSummary,
  isCharacterSummaryExpanded,
  className,
  characterSummaryPanel,
  rightContent,
  leftContent,
}) => {
  return (
    <div 
      className={cssClasses("w-full flex justify-between p-4 pointer-events-auto", className)}
      data-testid="manuscript-floating-hud"
    >
      <div className="flex items-start gap-4">
        {leftContent}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleCharacterSummary}
            aria-expanded={isCharacterSummaryExpanded}
            aria-label="Character summary"
            title="Character summary"
            className="rounded-full shadow-md bg-background/80 backdrop-blur-sm"
          >
            <User className="h-5 w-5" />
          </Button>
          
          {isCharacterSummaryExpanded && characterSummaryPanel && (
            <div className="w-80 animate-in slide-in-from-top-2 fade-in duration-200">
              {characterSummaryPanel}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-start gap-4">
        {rightContent}
      </div>
    </div>
  );
};
