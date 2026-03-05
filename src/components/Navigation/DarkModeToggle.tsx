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
}

export function DarkModeToggle({ compact }: DarkModeToggleProps) {
  const { colorScheme, setColorScheme } = useTheme();

  return (
    <div
      className="dark-mode-toggle"
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
          className={`dark-mode-toggle-option${colorScheme === id ? ' dark-mode-toggle-option-active' : ''}${compact ? ' dark-mode-toggle-option-compact' : ''}`}
          onClick={() => setColorScheme(id)}
        >
          <Icon aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
