'use client';

import React from 'react';
import { X } from 'lucide-react';

interface HudCloseButtonProps {
  /** Returns the player to the world from the active session (page-level exit flow). */
  onBack?: () => void;
  /** Chrome-bar themes (DS1/DS2) use the text label; the DS3 pill uses the icon. */
  variant: 'text' | 'icon';
}

/**
 * The single Close control for the game-session HUD. Every design system renders
 * this same component so the only way to leave a session can't drift apart between
 * themes (#1424) — the presentation differs, the behavior does not.
 */
export function HudCloseButton({ onBack, variant }: HudCloseButtonProps) {
  if (variant === 'icon') {
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

  return (
    <button
      type="button"
      onClick={onBack}
      title="Close"
      aria-label="Close"
      className="manuscript-hud-text-button manuscript-hud-close-button"
    >
      Close
    </button>
  );
}
