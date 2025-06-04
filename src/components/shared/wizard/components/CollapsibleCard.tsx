import React from 'react';
import { wizardStyles } from '../styles/wizardStyles';

export interface CollapsibleCardProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  children: React.ReactNode;
  header: React.ReactNode;
  testId?: string;
  className?: string;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  isExpanded,
  onToggleExpand,
  children,
  header,
  testId,
  className = '',
}) => {
  return (
    <div 
      className={`${wizardStyles.card.base} ${className}`}
      data-testid={testId}
    >
      <div 
        className="flex justify-between items-center cursor-pointer select-none hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
        onClick={onToggleExpand}
      >
        {header}
        
        <button 
          type="button" 
          className="text-sm text-blue-600 hover:underline focus:outline-none ml-2"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          {isExpanded ? 'Hide details' : 'Show details'}
        </button>
      </div>
      
      {isExpanded && (
        <div 
          className="mt-4"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
};
