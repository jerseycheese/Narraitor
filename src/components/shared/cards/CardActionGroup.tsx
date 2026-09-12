import React from 'react';

export interface CardAction {
  /** Unique key for the action */
  key: string;
  /** Button text */
  text: string;
  /** Click handler */
  onClick: (e: React.MouseEvent) => void;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  /** Optional icon */
  icon?: React.ReactNode;
  /** Optional tooltip */
  title?: string;
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
 * pages the page-level Create action is that primary; per-card Play is secondary.
 * On detail pages Play is primary and Edit is secondary.
 *
 * @example List page (worlds list, characters list)
 * <CardActionGroup
 *   primaryActions={[
 *     { key: 'make-active', text: 'Make Active', onClick: handleMakeActive, variant: 'secondary', flex: true },
 *     { key: 'play', text: 'Play', onClick: handlePlay, variant: 'secondary', flex: true }
 *   ]}
 *   secondaryActions={[
 *     { key: 'edit', text: 'Edit', onClick: handleEdit },
 *     { key: 'delete', text: 'Delete', onClick: handleDelete, variant: 'danger' }
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

