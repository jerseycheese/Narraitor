'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DarkModeToggle } from './DarkModeToggle';
import {
  headerDropdownMenuClass,
  headerDropdownTriggerClass,
} from './navigationDropdownStyles';

/**
 * ThemeMenu - compact palette-icon "Appearance" menu.
 *
 * Single control for the app chrome's color mode (light/dark/system). The
 * same control is the canonical home in Settings -> Appearance.
 */
export function ThemeMenu() {
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
        aria-expanded={open}
        className={headerDropdownTriggerClass}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Palette aria-hidden="true" />
      </Button>

      {open && (
        <div className={headerDropdownMenuClass}>
          <DarkModeToggle />
        </div>
      )}
    </div>
  );
}
