'use client';

import React from 'react';
import { useTheme } from '@/lib/theme';
import type { DesignSystem } from '@/lib/theme';
import { THEMES } from '@/lib/theme';

const themeOptions: { id: DesignSystem; label: string }[] = THEMES.map((t) => ({
  id: t.id,
  label: t.id.toUpperCase(),
}));

interface ThemeSwitcherProps {
  compact?: boolean;
}

export function ThemeSwitcher({ compact }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="theme-switcher"
      role="radiogroup"
      aria-label="Design system theme"
    >
      {themeOptions.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={theme === opt.id}
          className={`theme-switcher-option${theme === opt.id ? ' theme-switcher-option-active' : ''}${compact ? ' theme-switcher-option-compact' : ''}`}
          onClick={() => setTheme(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
