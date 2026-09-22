'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import type { ColorScheme } from '@/lib/theme';

const schemes: { id: ColorScheme; label: string; Icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'system', label: 'System', Icon: Monitor },
];

interface DarkModeToggleProps {
  compact?: boolean;
  showLabels?: boolean;
  className?: string;
}

export function DarkModeToggle({ compact, showLabels, className }: DarkModeToggleProps) {
  const { colorScheme, setColorScheme } = useTheme();

  return (
    <div
      className={`dark-mode-toggle${showLabels ? ' dark-mode-toggle-labeled' : ''}${className ? ` ${className}` : ''}`}
      role="radiogroup"
      aria-label="Color scheme"
    >
      {schemes.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={colorScheme === id}
          aria-label={label}
          className={`dark-mode-toggle-option${colorScheme === id ? ' dark-mode-toggle-option-active' : ''}${compact ? ' dark-mode-toggle-option-compact' : ''}${showLabels ? ' dark-mode-toggle-option-labeled' : ''}`}
          onClick={() => setColorScheme(id)}
        >
          <Icon aria-hidden="true" />
          {showLabels && <span className="dark-mode-toggle-label">{label}</span>}
        </button>
      ))}
    </div>
  );
}
