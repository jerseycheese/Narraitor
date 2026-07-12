'use client';

import React from 'react';
import { X } from 'lucide-react';

interface HudCloseButtonProps {
  /** Returns the player to the world from the active session (page-level exit flow). */
  onBack?: () => void;
}

/**
 * The single Close control for the game-session HUD (#1424): one component so the
 * only way to leave a session can't drift apart across the app.
 */
export function HudCloseButton({ onBack }: HudCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onBack}
      title="Close"
      aria-label="Close"
      className="manuscript-hud-icon-button manuscript-hud-close-button"
    >
      <X size={16} aria-hidden="true" />
    </button>
  );
}
