import React from 'react';

export interface ActiveStateIndicatorProps {
  /** The text to display in the indicator */
  text?: string;
  /** Custom CSS classes to apply */
  className?: string;
  /** Icon to display before the text */
  icon?: React.ReactNode;
}

/**
 * ActiveStateIndicator - Displays a green header banner to indicate active state
 * 
 * @example
 * <ActiveStateIndicator text="Currently Active World" />
 * 
 * @example With custom icon
 * <ActiveStateIndicator 
 *   text="Active Character" 
 *   icon={<UserIcon className="w-4 h-4" />} 
 * />
 */
export const ActiveStateIndicator: React.FC<ActiveStateIndicatorProps> = ({ 
  text = 'Currently Active',
  className = '',
  icon
}) => {
  const defaultIcon = (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path 
        fillRule="evenodd" 
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
        clipRule="evenodd" 
      />
    </svg>
  );

  return (
    <div className={`bg-green-600 text-white px-4 py-2 flex items-center justify-center ${className}`}>
      <div className="flex items-center gap-2">
        {icon || defaultIcon}
        <span className="font-medium text-sm">{text}</span>
      </div>
    </div>
  );
};

export default ActiveStateIndicator;