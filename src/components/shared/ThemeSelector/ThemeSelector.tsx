// src/components/shared/ThemeSelector/ThemeSelector.tsx

import React, { memo } from 'react';
import { THEMES } from '@/lib/constants/themes';

interface ThemeSelectorProps {
  selectedThemes: string[];
  onToggleTheme: (theme: string) => void;
  maxSelections?: number;
  className?: string;
  disabled?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = memo(({
  selectedThemes,
  onToggleTheme,
  maxSelections,
  className = '',
  disabled = false
}) => {
  const isThemeDisabled = (theme: string) => {
    if (disabled) return true;
    if (!maxSelections) return false;
    return !selectedThemes.includes(theme) && selectedThemes.length >= maxSelections;
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ${className}`}>
      {THEMES.map(theme => {
        const isSelected = selectedThemes.includes(theme.label);
        const isDisabled = isThemeDisabled(theme.label);
        
        return (
          <button
            key={theme.value}
            onClick={() => !isDisabled && onToggleTheme(theme.label)}
            disabled={isDisabled}
            className={`px-3 py-2 text-sm rounded-md border transition-colors ${
              isSelected
                ? 'bg-blue-100 text-blue-700 border-blue-300 selected'
                : isDisabled
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            title={theme.description}
          >
            {theme.label}
          </button>
        );
      })}
    </div>
  );
});

ThemeSelector.displayName = 'ThemeSelector';

export { ThemeSelector };