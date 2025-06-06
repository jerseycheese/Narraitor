'use client';

import React from 'react';
import { DecisionWeight } from '@/types/narrative.types';

export interface DecisionPointIndicatorProps {
  isActive: boolean;
  decisionWeight?: DecisionWeight;
  className?: string;
}

/**
 * Visual indicator that appears in the narrative flow to show decision points
 */
export const DecisionPointIndicator: React.FC<DecisionPointIndicatorProps> = ({
  isActive,
  decisionWeight = 'minor',
  className = ''
}) => {
  // Get styling based on decision weight
  const getWeightStyling = (weight: DecisionWeight) => {
    switch (weight) {
      case 'critical':
        return {
          container: 'border-red-400 bg-red-50',
          dot: 'bg-red-500',
          text: 'text-red-700'
        };
      case 'major':
        return {
          container: 'border-amber-400 bg-amber-50',
          dot: 'bg-amber-500',
          text: 'text-amber-700'
        };
      case 'minor':
      default:
        return {
          container: 'border-blue-300 bg-blue-50',
          dot: 'bg-blue-500',
          text: 'text-blue-700'
        };
    }
  };

  const styles = getWeightStyling(decisionWeight);
  const baseOpacity = isActive ? 'opacity-100' : 'opacity-30';
  const baseClasses = `transition-all duration-300 ${baseOpacity}`;

  return (
    <div>
      <div
        data-testid="decision-point-indicator"
        className={`
          relative flex items-center gap-3 p-3 rounded-lg border-2 border-dashed
          ${styles.container} ${baseClasses} ${className}
        `}
        role={isActive ? "group" : undefined}
        aria-label={isActive ? "Decision point indicator" : undefined}
      >
        {/* Decision weight dot with pulse animation */}
        <div 
          data-testid="decision-weight-indicator"
          className={`
            w-3 h-3 rounded-full flex-shrink-0
            ${styles.dot}
            ${isActive ? 'animate-pulse' : ''}
          `} 
          aria-hidden="true"
        />
        
        {/* Decision point label */}
        {isActive && (
          <span className={`
            text-xs uppercase font-bold tracking-wide
            ${styles.text}
          `}>
            Decision Point
          </span>
        )}
        
        {/* Connecting line to choices */}
        {isActive && (
          <div 
            data-testid="decision-connecting-line"
            className="hidden lg:block absolute -right-3 top-1/2 w-6 h-px bg-gray-300"
            aria-hidden="true"
          />
        )}
      </div>
      
      {/* Mobile indicator arrow */}
      {isActive && (
        <div className="lg:hidden flex justify-center mt-2" aria-hidden="true">
          <div className={`w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-400`}></div>
        </div>
      )}
    </div>
  );
};