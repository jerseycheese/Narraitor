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
  /** Button size - applies to all buttons if primarySize and secondarySize not specified */
  size?: 'sm' | 'md' | 'lg';
  /** Primary button size - overrides size for primary actions */
  primarySize?: 'sm' | 'md' | 'lg';
  /** Secondary button size - overrides size for secondary actions */
  secondarySize?: 'sm' | 'md' | 'lg';
  /** Custom CSS classes for the container */
  className?: string;
}

/**
 * CardActionGroup - Handles button layouts for card actions
 * 
 * @example
 * <CardActionGroup
 *   primaryActions={[
 *     { key: 'create', text: 'Create Character', onClick: handleCreate, variant: 'primary', flex: true },
 *     { key: 'play', text: 'Play', onClick: handlePlay, variant: 'success', flex: true }
 *   ]}
 *   secondaryActions={[
 *     { key: 'view', text: 'View', onClick: handleView },
 *     { key: 'edit', text: 'Edit', onClick: handleEdit },
 *     { key: 'delete', text: 'Delete', onClick: handleDelete, variant: 'danger' }
 *   ]}
 * />
 */
export const CardActionGroup: React.FC<CardActionGroupProps> = ({
  primaryActions = [],
  secondaryActions = [],
  layout = 'horizontal',
  gap = 'md',
  size = 'md',
  primarySize,
  secondarySize,
  className = ''
}) => {
      const getButtonClasses = (action: CardAction, actionType: 'primary' | 'secondary') => {
      // Determine which size to use
      let buttonSize = size;
      if (actionType === 'primary' && primarySize) {
        buttonSize = primarySize;
      } else if (actionType === 'secondary' && secondarySize) {
        buttonSize = secondarySize;
      }
      
      let variantClasses = '';
  
      if (action.variant === 'primary' && action.className?.includes('bg-')) {
        variantClasses = action.className;
      }
  
      return `${variantClasses}${action.className || ''}`;
    };
  const renderActions = (actions: CardAction[], actionType: 'primary' | 'secondary') => {
    return actions.map(action => (
      <button
        key={action.key}
        onClick={action.onClick}
        className={`${getButtonClasses(action, actionType)}`}
        title={action.title}
        data-testid={action.testId}
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
    <div className={`${className}`}>
      {primaryActions.length > 0 && (
        <div>
          {renderActions(primaryActions, 'primary')}
        </div>
      )}
      {secondaryActions.length > 0 && (
        <div>
          {renderActions(secondaryActions, 'secondary')}
        </div>
      )}
    </div>
  );
};

export default CardActionGroup;
