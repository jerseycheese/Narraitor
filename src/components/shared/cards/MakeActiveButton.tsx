import React from 'react';
import { CheckCircle } from 'lucide-react';

export interface MakeActiveButtonProps {
  /** Called when the button is clicked */
  onClick: (e: React.MouseEvent) => void;
  /** Custom CSS classes to apply */
  className?: string;
  /** Button text */
  text?: string;
  /** Tooltip text */
  title?: string;
  /** Whether the button should take full width */
  fullWidth?: boolean;
  /** Icon to display before the text */
  icon?: React.ReactNode;
}

/**
 * MakeActiveButton - Standardized button for making an entity active
 * 
 * @example
 * <MakeActiveButton onClick={handleMakeActive} />
 * 
 * @example With custom text
 * <MakeActiveButton 
 *   onClick={handleMakeActive} 
 *   text="Set as Active Character"
 *   title="Make this your current character"
 * />
 */
export const MakeActiveButton: React.FC<MakeActiveButtonProps> = ({ 
  onClick,
  className = '',
  text = 'Make Active',
  title = 'Set as active',
  fullWidth = true,
  icon
}) => {
  const defaultIcon = (<CheckCircle className="w-4 h-4" aria-hidden="true" />);

  const baseClasses = `px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-900 
    rounded-md transition-colors border border-green-300 hover:border-green-500 font-medium 
    flex items-center justify-center gap-2`;

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${widthClass} ${className}`}
      title={title}
      type="button"
    >
      {icon || defaultIcon}
      {text}
    </button>
  );
};

export default MakeActiveButton;
