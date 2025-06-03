import React from 'react';

export interface CardAction {
  /** Unique key for the action */
  key: string;
  /** Button text */
  text: string;
  /** Click handler */
  onClick: (e: React.MouseEvent) => void;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger';
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
 * @example
 * <CardActionGroup
 *   primaryActions={[
 *     { key: 'create', text: 'Create Character', onClick: handleCreate, variant: 'primary', flex: true },
 *     { key: 'play', text: 'Play', onClick: handlePlay, variant: 'primary', flex: true }
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
  className = ''
}) => {
  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3'
  };

  const getButtonClasses = (action: CardAction) => {
    const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors';
    const flexClass = action.flex ? 'flex-1' : '';
    
    let variantClasses = '';
    switch (action.variant) {
      case 'primary':
        // Allow for custom primary colors via className
        if (action.className?.includes('bg-')) {
          variantClasses = action.className;
        } else {
          variantClasses = 'bg-blue-600 text-white hover:bg-blue-700';
        }
        break;
      case 'danger':
        variantClasses = 'bg-gray-100 text-red-600 hover:bg-red-50';
        break;
      case 'secondary':
      default:
        variantClasses = 'bg-gray-100 text-gray-700 hover:bg-gray-200';
        break;
    }

    // If custom className includes bg-, use it instead of variant classes
    if (action.variant === 'primary' && action.className?.includes('bg-')) {
      return `${baseClasses} ${flexClass} ${action.className}`;
    }

    return `${baseClasses} ${variantClasses} ${flexClass} ${action.className || ''}`;
  };

  const renderActions = (actions: CardAction[]) => {
    return actions.map(action => (
      <button
        key={action.key}
        onClick={action.onClick}
        className={getButtonClasses(action)}
        title={action.title}
        data-testid={action.testId}
        type="button"
      >
        {action.icon && (
          <span className="inline-flex items-center">{action.icon}</span>
        )}
        {action.text}
      </button>
    ));
  };

  const containerClasses = layout === 'vertical' ? 'flex flex-col' : 'flex';

  return (
    <div className={`space-y-2 ${className}`}>
      {primaryActions.length > 0 && (
        <div className={`${containerClasses} ${gapClasses[gap]}`}>
          {renderActions(primaryActions)}
        </div>
      )}
      {secondaryActions.length > 0 && (
        <div className={`${containerClasses} ${gapClasses[gap]}`}>
          {renderActions(secondaryActions)}
        </div>
      )}
    </div>
  );
};

export default CardActionGroup;