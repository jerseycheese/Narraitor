'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getGenreLabel } from '@/lib/constants/genres';
import { Globe, ChevronDown, Check, Plus } from 'lucide-react';
import {
  headerDropdownDividerClass,
  headerDropdownItemClass,
  headerDropdownMenuClass,
} from './navigationDropdownStyles';
import { useNavigationData } from './useNavigationData';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { StoreCharacter } from '@/state/characterStore';

/**
 * WorldSwitcher - reads and changes the active world.
 *
 * Lives in the context band beside the breadcrumbs rather than in the header
 * row: it names where you are in the story, which is the band's job, and its
 * width tracks a user-authored world name, which the header row can't absorb
 * without reflowing every control beside it.
 */
export function WorldSwitcher() {
  const {
    currentWorldId,
    worlds,
    characters,
    currentWorld,
    worldCharacterCount,
    navigateWithLoading,
    setCurrentWorld,
  } = useNavigationData();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Escape closes the popup and hands focus back to the trigger. The header's
  // own Escape shortcut is a separate document listener, so both run: the
  // hook's stopPropagation only stops bubbling, not sibling listeners.
  useKeyboardShortcuts(
    [
      {
        key: 'Escape',
        action: () => {
          setIsOpen(false);
          triggerRef.current?.focus();
        },
        description: 'Close the world switcher',
      },
    ],
    isOpen
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleWorldSwitch = (worldId: string) => {
    setCurrentWorld(worldId);
    setIsOpen(false);
    const worldName = worlds[worldId]?.name || 'world';
    navigateWithLoading(`/worlds/${worldId}`, `Loading ${worldName}...`);
  };

  return (
    <div ref={rootRef} className="world-switcher">
      <Button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        className="world-switcher-trigger"
        aria-expanded={isOpen}
      >
        <Globe aria-hidden="true" />
        <span className="world-switcher-name">
          {currentWorld ? currentWorld.name : 'Select world'}
        </span>
        {currentWorld && worldCharacterCount > 0 && (
          <span className="world-switcher-count">
            {worldCharacterCount}{' '}
            {worldCharacterCount === 1 ? 'character' : 'characters'}
          </span>
        )}
        <ChevronDown aria-hidden="true" />
      </Button>

      {isOpen && (
        <div className={headerDropdownMenuClass}>
          {Object.values(worlds).map((world) => {
            const worldCharacters = (
              Object.values(characters) as StoreCharacter[]
            ).filter((c) => c.worldId === world.id).length;

            return (
              <Button
                key={world.id}
                onClick={() => handleWorldSwitch(world.id)}
                variant="ghost"
                className={headerDropdownItemClass}
              >
                <div>
                  <div>{world.name}</div>
                  <div>
                    {getGenreLabel(world.genre)} • {worldCharacters} characters
                  </div>
                </div>
                {world.id === currentWorldId && <Check aria-hidden="true" />}
              </Button>
            );
          })}

          <div className={headerDropdownDividerClass}>
            <Link
              href="/worlds/create"
              className={headerDropdownItemClass}
              onClick={() => setIsOpen(false)}
            >
              <Plus aria-hidden="true" />
              Create a world
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
