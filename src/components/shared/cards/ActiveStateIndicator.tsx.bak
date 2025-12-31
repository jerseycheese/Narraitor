import React from 'react';
import { CheckCircle } from 'lucide-react';

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
  const defaultIcon = (<CheckCircle className="w-4 h-4" aria-hidden="true" />);

  return (
    <div className={`bg-green-500 text-white px-4 py-2 flex items-center justify-center ${className}`}>
      <div className="flex items-center gap-2">
        {icon || defaultIcon}
        <span className="font-medium text-sm">{text}</span>
      </div>
    </div>
  );
};

export default ActiveStateIndicator;
