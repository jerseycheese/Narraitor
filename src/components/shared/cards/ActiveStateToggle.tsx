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
 * Inactive, it reads "Make Active". Active, it reads "Active" and does nothing
 * when pressed. It stays the same button in both states, so keyboard focus
 * survives the switch, and the live region reads the new label out to screen
 * readers.
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
    className="active-state-toggle"
    aria-disabled={isActive}
    aria-live="polite"
    onClick={isActive ? undefined : onActivate}
    data-testid={testId}
  >
    <span
      className={clsx(
        'badge',
        'badge-md',
        isActive ? 'badge-default-static' : 'badge-secondary-static'
      )}
    >
      {isActive && (
        <span className="badge-icon">
          <CheckCircle aria-hidden="true" />
        </span>
      )}
      {isActive ? 'Active' : 'Make Active'}
    </span>
  </button>
);
