'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { THEMES } from '@/lib/theme';
import { DarkModeToggle } from './DarkModeToggle';
import {
  headerDropdownHeaderClass,
  headerDropdownItemClass,
  headerDropdownMenuClass,
  headerDropdownTriggerClass,
} from './navigationDropdownStyles';

/**
 * ThemeMenu - compact palette-icon "Appearance" menu.
 *
 * One coherent appearance control for the app chrome: visual theme (skin) by
 * human name, plus light/dark/system color mode, in a single dropdown. Replaces
 * the inline DS1/DS2/DS3 segmented control and the separate dark-mode toggle
 * that used to sit beside it. The same control is the canonical home in
 * Settings -> Appearance.
 */
export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="theme-menu" data-identifier="theme-menu" ref={wrapperRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Appearance"
        aria-haspopup="menu"
        aria-expanded={open}
        className={headerDropdownTriggerClass}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Palette aria-hidden="true" />
      </Button>

      {open && (
        <div className={headerDropdownMenuClass} role="menu">
          <p className={headerDropdownHeaderClass}>Theme</p>
          {THEMES.map((t) => (
            <Button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === t.id}
              variant="ghost"
              className={headerDropdownItemClass}
              onClick={() => setTheme(t.id)}
            >
              <div className="theme-menu-item-text">
                <div>{t.name}</div>
                <div>{t.description}</div>
              </div>
              {theme === t.id && <Check aria-hidden="true" />}
            </Button>
          ))}

          <div className="theme-menu-mode">
            <p className={headerDropdownHeaderClass}>Color mode</p>
            <DarkModeToggle />
          </div>
        </div>
      )}
    </div>
  );
}
