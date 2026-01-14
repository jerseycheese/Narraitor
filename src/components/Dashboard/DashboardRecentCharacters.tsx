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
      <section className="bg-background rounded-lg border p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Recent Characters</h2>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No characters yet</p>
          <Button onClick={() => onNavigate('/characters')} variant="default">
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Create Your First Character
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background rounded-lg border p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Recent Characters</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Recent Characters */}
        {recentCharacters.map((character) => {
          const world = worlds[character.worldId];
          return (
            <div
              key={character.id}
              className="rounded-lg border p-4 hover:border-primary transition-colors cursor-pointer"
              onClick={() => onNavigate(`/characters/${character.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate(`/characters/${character.id}`);
                }
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <CharacterPortrait
                  portrait={character.portrait || { type: 'placeholder', url: null }}
                  characterName={character.name}
                  size="small"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{character.name}</h3>
                  {world && (
                    <p className="text-xs text-muted-foreground truncate">{world.name}</p>
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
              className="rounded-lg border border-dashed p-4 flex items-center justify-center"
            >
              <Button
                onClick={() => onNavigate('/characters')}
                variant="ghost"
                size="sm"
                className="w-full h-full"
              >
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Create Character
              </Button>
            </div>
          ))}
      </div>
    </section>
  );
}
