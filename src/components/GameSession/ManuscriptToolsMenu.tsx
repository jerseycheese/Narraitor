'use client';

import React from 'react';

interface ManuscriptToolsMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ManuscriptToolsMenu: React.FC<ManuscriptToolsMenuProps> = ({
  isOpen,
  onToggle,
}) => {
  return (
    <button
      type="button"
      className="manuscript-hud-text-button"
      onClick={onToggle}
      aria-label="Toggle Tools menu"
      aria-expanded={isOpen}
    >
      Tools
    </button>
  );
};
