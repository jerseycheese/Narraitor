import React from 'react';
import { World } from '@/types/world.types';
import WorldCard from '@/components/WorldCard/WorldCard';
import { useCharacterStore, type StoreCharacter } from '@/state/characterStore';
import { Globe } from 'lucide-react';

interface WorldListProps {
  worlds: World[];
  currentWorldId?: string | null;
  onSelectWorld: (worldId: string) => void;
  onDeleteWorld: (worldId: string) => void;
}

const WorldList: React.FC<WorldListProps> = ({
  worlds,
  currentWorldId,
  onSelectWorld,
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
        <div className="world-list-empty-icon">
          <Globe aria-hidden="true" />
        </div>
        <h2 className="world-list-empty-title">Welcome to Narraitor!</h2>
        <p className="world-list-empty-lede">
          Begin your storytelling journey by creating your first world.
        </p>
        <p className="world-list-empty-description">
          Each world is a unique setting with its own rules, attributes, and
          possibilities.
        </p>
        <div className="world-list-empty-guide">
          <p className="world-list-empty-guide-heading">
            Getting Started Guide:
          </p>
          <ol className="world-list-empty-guide-steps">
            <li>
              <strong>Create a World</strong> - Define your setting, theme, and
              game rules
            </li>
            <li>
              <strong>Build Characters</strong> - Populate your world with
              unique personalities
            </li>
            <li>
              <strong>Start Playing</strong> - Begin your interactive narrative
              experience
            </li>
          </ol>
          <div className="world-list-empty-tip">
            <p>
              <strong>Tip:</strong> You can create multiple worlds and switch
              between them anytime!
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Sort worlds to show active world first
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
            onSelect={onSelectWorld}
            onDelete={onDeleteWorld}
          />
        ))}
      </div>
    </section>
  );
};

export default WorldList;
