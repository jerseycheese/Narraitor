import React from 'react';

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
  const defaultIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
      />
    </svg>
  );

  const baseClasses = `px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 hover:text-green-900 
    rounded-md transition-colors border border-green-300 hover:border-green-400 font-medium 
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
