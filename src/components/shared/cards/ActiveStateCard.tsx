import React from 'react';
import { ActiveStateIndicator } from './ActiveStateIndicator';

export interface ActiveStateCardProps {
  /** Whether the card is in active state */
  isActive: boolean;
  /** Text to show in the active state indicator */
  activeText?: string;
  /** Icon for the active state indicator */
  activeIcon?: React.ReactNode;
  /** Click handler for the card */
  onClick?: () => void;
  /** Base CSS classes for the card */
  className?: string;
  /** Classes to apply when active */
  activeClassName?: string;
  /** Classes to apply when inactive */
  inactiveClassName?: string;
  /** Whether to show the active state indicator banner */
  showActiveIndicator?: boolean;
  /** Children to render inside the card */
  children: React.ReactNode;
  /** Test ID for testing */
  testId?: string;
  /** Whether the card has an image at the top */
  hasImage?: boolean;
}

/**
 * ActiveStateCard - A wrapper component for cards with active state
 * 
 * @example Basic usage
 * <ActiveStateCard 
 *   isActive={isActive}
 *   onClick={() => handleSelect(id)}
 *   activeText="Currently Active World"
 * >
 *   <CardContent />
 * </ActiveStateCard>
 * 
 * @example With custom styling
 * <ActiveStateCard 
 *   isActive={isActive}
 *   activeClassName=""
 *   inactiveClassName=""
 *   showActiveIndicator={false}
 * >
 *   <CardContent />
 * </ActiveStateCard>
 */
export const ActiveStateCard: React.FC<ActiveStateCardProps> = ({
  isActive,
  activeText = 'Currently Active',
  activeIcon,
  onClick,
  className = '',
  activeClassName = '',
  inactiveClassName = '',
  showActiveIndicator = true,
  children,
  testId = 'active-state-card',
  hasImage = false
}) => {
  const baseClasses = '';
  const cursorClass = onClick ? '' : '';
  const stateClasses = isActive ? activeClassName : inactiveClassName;

  // Extract the image and content
  const childrenArray = React.Children.toArray(children);
  const imageChild = hasImage ? childrenArray[0] : null;
  const contentChildren = hasImage ? childrenArray.slice(1) : childrenArray;

  return (
    <article
      data-testid={testId}
      onClick={onClick}
      className={`${baseClasses} ${cursorClass} ${stateClasses} ${className}`}
    >
      {/* Image section with overlay if present */}
      {hasImage ? (
        <div>
          {imageChild}
          {/* Active state indicator overlay */}
          {isActive && showActiveIndicator && (
            <div>
              <ActiveStateIndicator 
                text={activeText}
                icon={activeIcon}
              />
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Active state indicator for cards without images */}
          {isActive && showActiveIndicator && (
            <ActiveStateIndicator 
              text={activeText}
              icon={activeIcon}
            />
          )}
        </>
      )}
      
      {/* Card content */}
      {contentChildren}
    </article>
  );
};

export default ActiveStateCard;
