import React from 'react';
import { World } from '@/types/world.types';
import WorldCard from '@/components/WorldCard/WorldCard';
import { useCharacterStore, type Character } from '@/state/characterStore';
import { Globe } from 'lucide-react';
import { EntityID } from '@/types/common.types';

interface WorldListProps {
  worlds: World[];
  currentWorldId?: string | null;
  onSelectWorld: (worldId: string) => void;
  onDeleteWorld: (worldId: string) => void;
  selectedWorldIds?: EntityID[];
  onToggleSelect?: (worldId: EntityID) => void;
  _router?: {
    push: (url: string) => void;
  };
  _storeActions?: {
    setCurrentWorld: (id: string) => void;
  };
}

const WorldList: React.FC<WorldListProps> = ({
  worlds,
  currentWorldId,
  onSelectWorld,
  onDeleteWorld,
  selectedWorldIds = [],
  onToggleSelect,
  _router,
  _storeActions,
}) => {
  // Get character counts and character data for each world using proper hook
  const characters = useCharacterStore((state) => state.characters);
  const allCharacters = Object.values(characters) as Character[];
  const charactersByWorld = worlds.reduce(
    (acc, world) => {
      acc[world.id] = allCharacters.filter((char) => char.worldId === world.id);
      return acc;
    },
    {} as Record<string, Character[]>
  );
  if (worlds.length === 0) {
    return (
      <section data-testid="world-list-empty-message">
        <div>
          <Globe aria-hidden="true" />
        </div>
        <h2>Welcome to Narraitor!</h2>
        <p>Begin your storytelling journey by creating your first world.</p>
        <p>
          Each world is a unique setting with its own rules, attributes, and
          possibilities.
        </p>
        <div>
          <p>Getting Started Guide:</p>
          <ol>
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
          <div>
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
    <section data-testid="world-list-container">
      <div>
        {sortedWorlds.map((world) => (
          <WorldCard
            key={world.id}
            world={world}
            isActive={world.id === currentWorldId}
            isSelected={selectedWorldIds.includes(world.id)}
            onToggleSelect={onToggleSelect}
            characters={charactersByWorld[world.id] || []}
            onSelect={onSelectWorld}
            onDelete={onDeleteWorld}
            _router={_router}
            _storeActions={_storeActions}
          />
        ))}
      </div>
    </section>
  );
};

export default WorldList;
