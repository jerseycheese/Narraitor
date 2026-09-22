'use client';

import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';

function initialOf(name: string): string {
  return (Array.from(name)[0] ?? '').toUpperCase();
}

interface DashboardRecentCharactersProps {
  characters: ReturnType<typeof useCharacterStore.getState>['characters'];
  worlds: ReturnType<typeof useWorldStore.getState>['worlds'];
  maxItems: number;
  onNavigate: (path: string) => void;
}

export function DashboardRecentCharacters({
  characters,
  worlds,
  maxItems,
  onNavigate,
}: DashboardRecentCharactersProps) {
  const recentCharacters = useMemo(() => {
    return Object.values(characters)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, maxItems);
  }, [characters, maxItems]);

  const emptySlots = maxItems - recentCharacters.length;

  if (recentCharacters.length === 0) {
    return (
      <section
        className="component-dashboard-recent-characters"
        aria-labelledby="recent-characters-heading"
      >
        <h2 id="recent-characters-heading">Recent Characters</h2>
        <div className="dashboard-recent-empty-state">
          <p>No characters yet</p>
          <Button onClick={() => onNavigate('/characters')} variant="secondary">
            <Plus aria-hidden="true" />
            Create Your First Character
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="component-dashboard-recent-characters"
      aria-labelledby="recent-characters-heading"
    >
      <h2 id="recent-characters-heading">Recent Characters</h2>

      <div className="dashboard-recent-list">
        {/* Recent Characters */}
        {recentCharacters.map((character) => {
          const world = worlds[character.worldId];
          return (
            <div
              key={character.id}
              className="dashboard-recent-item"
              onClick={() => onNavigate(`/characters/${character.id}`)}
              role="button"
              tabIndex={0}
              aria-label={`View character: ${character.name}${world ? ` from ${world.name}` : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate(`/characters/${character.id}`);
                }
              }}
            >
              <div className="dashboard-recent-character-content">
                <div
                  className="dashboard-recent-character-portrait"
                  data-testid="character-portrait"
                  aria-hidden="true"
                >
                  {character.portrait?.url ? (
                    <CharacterPortrait
                      portrait={character.portrait}
                      characterName={character.name}
                      size="medium"
                    />
                  ) : (
                    <span className="character-card-plate-initial">
                      {initialOf(character.name)}
                    </span>
                  )}
                </div>
                <div className="dashboard-recent-item-meta">
                  <h3>{character.name}</h3>
                  {world && <p>{world.name}</p>}
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty Slots */}
        {emptySlots > 0 &&
          Array.from({ length: emptySlots }).map((_, index) => (
            <Button
              key={`empty-${index}`}
              onClick={() => onNavigate('/characters')}
              variant="ghost"
              size="sm"
              className="dashboard-recent-empty-slot"
            >
              <Plus aria-hidden="true" />
              Create Character
            </Button>
          ))}
      </div>
    </section>
  );
}
