import React from 'react';
import clsx from 'clsx';

export interface ActiveStateCardProps {
  /** Whether the card is in active state */
  isActive: boolean;
  /** Base CSS classes for the card */
  className?: string;
  /** Children to render inside the card */
  children: React.ReactNode;
  /** Test ID for testing */
  testId?: string;
  /** Id of the element that names the card, usually its title */
  labelledBy?: string;
}

/**
 * ActiveStateCard - A wrapper component for cards with active state
 *
 * The card only styles the state; it isn't clickable. Pair it with
 * ActiveStateLabel to mark the active item in text.
 *
 * @example
 * <ActiveStateCard isActive={isActive} labelledBy={titleId}>
 *   <CardContent />
 * </ActiveStateCard>
 */
export const ActiveStateCard: React.FC<ActiveStateCardProps> = ({
  isActive,
  className,
  children,
  testId = 'active-state-card',
  labelledBy,
}) => (
  <article
    data-testid={testId}
    className={clsx(
      'active-state-card',
      isActive ? 'active-state-card-active' : 'active-state-card-inactive',
      className
    )}
    aria-labelledby={labelledBy}
  >
    {children}
  </article>
);
