// src/components/shared/AttributeSkillBadges.tsx
// DEPRECATED: Use Badge from @/components/ui/badge directly instead
// This component will be removed in a future version

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface AttributeSkillItem {
  id: string;
  name: string;
  value?: number;
  level?: number;
}

interface AttributeSkillBadgesProps {
  /** Array of attributes or skills to display */
  items: AttributeSkillItem[];
  /** Maximum number of items to display */
  maxItems?: number;
  /** Badge variant for styling */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  /** Type of items for appropriate labeling */
  type: 'attributes' | 'skills';
  /** Show remaining count when items exceed maxItems */
  showRemainingCount?: boolean;
  /** CSS classes for container */
  className?: string;
}

/**
 * Reusable component for displaying attributes or skills as badges
 * Automatically sorts by value/level and shows top N items
 */
export function AttributeSkillBadges({
  items,
  maxItems = 3,
  variant = 'secondary',
  type,
  showRemainingCount = true,
  className = 'flex flex-wrap gap-1'
}: AttributeSkillBadgesProps) {
  // Sort items by value (attributes) or level (skills) in descending order
  const sortedItems = React.useMemo(() => {
    return items
      .filter(item => (item.value !== undefined) || (item.level !== undefined))
      .sort((a, b) => {
        const aVal = type === 'attributes' ? (a.value || 0) : (a.level || 0);
        const bVal = type === 'attributes' ? (b.value || 0) : (b.level || 0);
        return bVal - aVal;
      });
  }, [items, type]);

  const topItems = sortedItems.slice(0, maxItems);
  const remainingCount = Math.max(0, sortedItems.length - maxItems);

  return (
    <div className={className}>
      {topItems.map((item) => {
        const displayValue = type === 'attributes' ? item.value : item.level;
        return (
          <Badge key={item.id} variant={variant} count={displayValue} className="text-xs">
            {item.name}
          </Badge>
        );
      })}
      {showRemainingCount && remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}

/**
 * Preset component for displaying top attributes
 */
export function TopAttributesBadges(props: Omit<AttributeSkillBadgesProps, 'type'>) {
  return <AttributeSkillBadges {...props} type="attributes" variant="secondary" />;
}

/**
 * Preset component for displaying top skills  
 */
export function TopSkillsBadges(props: Omit<AttributeSkillBadgesProps, 'type'>) {
  return <AttributeSkillBadges {...props} type="skills" variant="outline" />;
}