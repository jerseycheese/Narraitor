'use client';

import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';

interface DashboardRecentCharactersProps {
  characters: ReturnType<typeof useCharacterStore.getState>["characters"];
  worlds: ReturnType<typeof useWorldStore.getState>["worlds"];
  maxItems: number;
  onNavigate: (path: string) => void;
}

export function DashboardRecentCharacters({
  characters,
  worlds,
  maxItems,
  onNavigate
}: DashboardRecentCharactersProps) {
  const recentCharacters = useMemo(() => {
    return Object.values(characters)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, maxItems);
  }, [characters, maxItems]);

  const emptySlots = maxItems - recentCharacters.length;

  if (recentCharacters.length === 0) {
    return (
      <section className="component-dashboard-recent-characters">
        <h2 >Recent Characters</h2>
        <div >
          <p >No characters yet</p>
          <Button onClick={() => onNavigate('/characters')} variant="default">
            <Plus  aria-hidden="true" />
            Create Your First Character
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="component-dashboard-recent-characters">
      <h2 >Recent Characters</h2>

      <div >
        {/* Recent Characters */}
        {recentCharacters.map((character) => {
          const world = worlds[character.worldId];
          return (
            <div
              key={character.id}
              
              onClick={() => onNavigate(`/characters/${character.id}`)}
              role="button"
              tabIndex={0}
              aria-label={`View character: ${character.name}${world ? ` from ${world.name}` : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === '') {
                  e.preventDefault();
                  onNavigate(`/characters/${character.id}`);
                }
              }}
            >
              <div >
                <CharacterPortrait
                  portrait={character.portrait || { type: 'placeholder', url: null }}
                  characterName={character.name}
                  size="small"
                />
                <div >
                  <h3 >{character.name}</h3>
                  {world && (
                    <p >{world.name}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty Slots */}
        {emptySlots > 0 &&
          Array.from({ length: emptySlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              
            >
              <Button
                onClick={() => onNavigate('/characters')}
                variant="ghost"
                size="sm"
                
              >
                <Plus  aria-hidden="true" />
                Create Character
              </Button>
            </div>
          ))}
      </div>
    </section>
  );
}
