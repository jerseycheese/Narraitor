import React from 'react';
import { CheckCircle } from 'lucide-react';

export interface ActiveStateLabelProps {
  /** Whether the card's item is the active one */
  isActive: boolean;
  /** Test ID for testing */
  testId?: string;
}

/**
 * ActiveStateLabel - Marks the active item on a list card
 *
 * State only, never a control: Play and the header world switcher are what
 * change the active world or character. Renders nothing for inactive items.
 *
 * @example
 * <ActiveStateLabel isActive={character.id === currentCharacterId} />
 */
export const ActiveStateLabel: React.FC<ActiveStateLabelProps> = ({
  isActive,
  testId,
}) =>
  isActive ? (
    <span className="active-state-label" data-testid={testId}>
      <CheckCircle aria-hidden="true" />
      Active
    </span>
  ) : null;
