import React from 'react';

export interface ActiveStateCardProps {
  /** Whether the card is in active state */
  isActive: boolean;
  /** Base CSS classes for the card */
  className?: string;
  /** Classes to apply when active */
  activeClassName?: string;
  /** Classes to apply when inactive */
  inactiveClassName?: string;
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
 * The card only styles the state; it isn't clickable. Pair it with
 * ActiveStateLabel to mark the active item in text.
 *
 * @example Basic usage
 * <ActiveStateCard isActive={isActive}>
 *   <CardContent />
 * </ActiveStateCard>
 *
 * @example With an image
 * <ActiveStateCard isActive={isActive} hasImage>
 *   <CardImage />
 *   <CardContent />
 * </ActiveStateCard>
 */
export const ActiveStateCard: React.FC<ActiveStateCardProps> = ({
  isActive,
  className = '',
  activeClassName,
  inactiveClassName,
  children,
  testId = 'active-state-card',
  hasImage = false
}) => {
  const defaultActiveClass = 'active-state-card-active';
  const defaultInactiveClass = 'active-state-card-inactive';
  const stateClasses = isActive ? (activeClassName || defaultActiveClass) : (inactiveClassName || defaultInactiveClass);

  // Extract the image and content
  const childrenArray = React.Children.toArray(children);
  const imageChild = hasImage ? childrenArray[0] : null;
  const contentChildren = hasImage ? childrenArray.slice(1) : childrenArray;

  return (
    <article
      data-testid={testId}
      className={`active-state-card ${stateClasses} ${className}`}
    >
      {hasImage && <div>{imageChild}</div>}
      {contentChildren}
    </article>
  );
};
