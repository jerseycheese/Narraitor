import React from 'react';
import { World } from '@/types/world.types';
import WorldCard from '@/components/WorldCard/WorldCard';
import { useCharacterStore, type StoreCharacter } from '@/state/characterStore';

interface WorldListProps {
  worlds: World[];
  currentWorldId?: string | null;
  onDeleteWorld: (worldId: string) => void;
}

const WorldList: React.FC<WorldListProps> = ({
  worlds,
  currentWorldId,
  onDeleteWorld,
}) => {
  // Get character counts and character data for each world using proper hook
  const characters = useCharacterStore((state) => state.characters);
  const allCharacters = Object.values(characters) as StoreCharacter[];
  const charactersByWorld = worlds.reduce(
    (acc, world) => {
      acc[world.id] = allCharacters.filter((char) => char.worldId === world.id);
      return acc;
    },
    {} as Record<string, StoreCharacter[]>
  );

  if (worlds.length === 0) {
    return (
      <section
        data-testid="world-list-empty-message"
        className="world-list-empty"
      >
        <div className="world-list-empty-lead">
          <h2 className="world-list-empty-title">
            Every story starts with a world.
          </h2>
          <p className="world-list-empty-lede">
            A world holds the setting, the rules your characters are measured
            by, and the tone the story is told in. Build one and the rest of
            Narraitor has somewhere to happen.
          </p>
          <p className="world-list-empty-description">
            You can keep as many worlds as you like and switch between them
            whenever you want.
          </p>
        </div>

        <ol className="world-list-empty-steps">
          <li>
            <span className="world-list-empty-step-title">Create a world</span>
            <span className="world-list-empty-step-body">
              Set the theme, the attributes characters are built from, and the
              rules play runs on.
            </span>
          </li>
          <li>
            <span className="world-list-empty-step-title">
              Build characters
            </span>
            <span className="world-list-empty-step-body">
              Write them yourself or have one generated from the world you just
              described.
            </span>
          </li>
          <li>
            <span className="world-list-empty-step-title">Start playing</span>
            <span className="world-list-empty-step-body">
              Choose what happens next, and the story keeps the consequences.
            </span>
          </li>
        </ol>
      </section>
    );
  }

  const sortedWorlds = [...worlds].sort((a, b) => {
    if (a.id === currentWorldId) return -1;
    if (b.id === currentWorldId) return 1;
    return 0;
  });

  return (
    <section data-testid="world-list-container" className="world-list">
      <div className="world-list-grid">
        {sortedWorlds.map((world) => (
          <WorldCard
            key={world.id}
            world={world}
            isActive={world.id === currentWorldId}
            characters={charactersByWorld[world.id] || []}
            onDelete={onDeleteWorld}
          />
        ))}
      </div>
    </section>
  );
};

export default WorldList;
