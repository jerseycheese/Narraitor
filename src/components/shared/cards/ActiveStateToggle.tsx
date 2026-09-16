import React from 'react';
import { clsx } from 'clsx';
import { CheckCircle } from 'lucide-react';

export interface ActiveStateToggleProps {
  /** Whether the card's item is the active one */
  isActive: boolean;
  /** Called when the player makes this item active */
  onActivate: () => void;
  /** Test ID for testing */
  testId?: string;
}

/**
 * ActiveStateToggle - The one control on a list card that makes its item active
 *
 * Inactive, it reads "Make Active" and looks like a link, because it's an
 * action. Active, it reads "Active" as a tinted pill, because it's state, and
 * does nothing when pressed. It stays the same button in both states, so
 * keyboard focus survives the switch, and the live region reads the new label
 * out to screen readers.
 *
 * @example
 * <ActiveStateToggle
 *   isActive={character.id === currentCharacterId}
 *   onActivate={() => setCurrentCharacter(character.id)}
 * />
 */
export const ActiveStateToggle: React.FC<ActiveStateToggleProps> = ({
  isActive,
  onActivate,
  testId,
}) => (
  <button
    type="button"
    className={clsx(
      'active-state-toggle',
      isActive && 'active-state-toggle-active'
    )}
    aria-disabled={isActive}
    aria-live="polite"
    onClick={isActive ? undefined : onActivate}
    data-testid={testId}
  >
    {isActive && <CheckCircle aria-hidden="true" />}
    {isActive ? 'Active' : 'Make Active'}
  </button>
);
