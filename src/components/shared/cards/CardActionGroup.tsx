import React from 'react';

export interface CardAction {
  /** Unique key for the action */
  key: string;
  /** Button text */
  text: string;
  /** Click handler */
  onClick: (e: React.MouseEvent) => void;
  /**
   * Button variant. `accent` is the card's main action without a fill;
   * `quiet` and `quiet-danger` are borderless text actions beside it.
   */
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'accent'
    | 'quiet'
    | 'quiet-danger';
  /** Optional icon */
  icon?: React.ReactNode;
  /** Optional tooltip */
  title?: string;
  /** Accessible name when the visible text alone doesn't say which item it acts on */
  ariaLabel?: string;
  /** Whether this action should take full width in its group */
  flex?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

export interface CardActionGroupProps {
  /** Primary actions (more prominent styling) */
  primaryActions?: CardAction[];
  /** Secondary actions (less prominent styling) */
  secondaryActions?: CardAction[];
  /** Layout direction */
  layout?: 'horizontal' | 'vertical';
  /** Gap between buttons */
  gap?: 'sm' | 'md' | 'lg';
  /** Custom CSS classes for the container */
  className?: string;
}

/**
 * CardActionGroup - Handles button layouts for card actions
 *
 * Each rendered state must have exactly one filled ink-blue primary CTA. On list
 * pages the page-level Create action is that primary; per-card Play is unfilled.
 * On detail pages Play is primary and Edit is secondary.
 *
 * On list cards Play is the one bordered action, in accent, and the rest are
 * quiet text actions. Each carries the item's name in its accessible label,
 * because a list repeats the same visible text on every card.
 *
 * Consumer cards adapt this layout deliberately on mobile:
 * - CharacterCard (3 actions: Play, Edit, Delete) uses display: contents to
 *   collapse rows into a single wrapping row.
 * - WorldCard (4 actions: Play, Characters, Edit, Delete) retains its 2-row
 *   structure (full-width primary, balanced secondaries) so Delete is never
 *   stranded alone.
 *
 * @example List page (worlds list, characters list)
 * <CardActionGroup
 *   primaryActions={[
 *     { key: 'play', text: 'Play', ariaLabel: `Play as ${name}`, onClick: handlePlay, variant: 'accent', flex: true }
 *   ]}
 *   secondaryActions={[
 *     { key: 'edit', text: 'Edit', ariaLabel: `Edit ${name}`, onClick: handleEdit, variant: 'quiet' },
 *     { key: 'delete', text: 'Delete', ariaLabel: `Delete ${name}`, onClick: handleDelete, variant: 'quiet-danger' }
 *   ]}
 * />
 */
export const CardActionGroup: React.FC<CardActionGroupProps> = ({
  primaryActions = [],
  secondaryActions = [],
  className = '',
  layout = 'vertical',
  gap = 'md'
}) => {
  const getButtonClasses = (action: CardAction) => {
    const variantClass = action.variant ? `card-action-variant-${action.variant}` : '';
    return [variantClass, action.className || ''].filter(Boolean).join(' ');
  };
  const renderActions = (actions: CardAction[]) => {
    return actions.map(action => (
      <button
        key={action.key}
        onClick={action.onClick}
        className={getButtonClasses(action)}
        title={action.title}
        aria-label={action.ariaLabel}
        data-testid={action.testId}
        data-flex={action.flex ? 'true' : undefined}
        type="button"
      >
        {action.icon && (
          <span>{action.icon}</span>
        )}
        <span>{action.text}</span>
      </button>
    ));
  };

  return (
    <div 
      className={`card-action-group ${className}`}
      data-layout={layout}
      data-gap={gap}
    >
      {primaryActions.length > 0 && (
        <div className="card-action-row primary">
          {renderActions(primaryActions)}
        </div>
      )}
      {secondaryActions.length > 0 && (
        <div className="card-action-row secondary">
          {renderActions(secondaryActions)}
        </div>
      )}
    </div>
  );
};

