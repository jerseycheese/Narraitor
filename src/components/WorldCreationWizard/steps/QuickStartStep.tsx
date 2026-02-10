// src/components/WorldCreationWizard/steps/QuickStartStep.tsx

'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { World } from '@/types/world.types';
import { CharacterArchetype } from '@/lib/utils/characterArchetypes';
import { QuickStartCharacters } from '@/components/QuickStartCharacters/QuickStartCharacters';
import {
  useCharacterStore,
  type Character,
  type CharacterStore,
} from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export interface QuickStartStepProps {
  world: World;
  onBack: () => void;
  onComplete: () => void;
  onCustomizeCharacter: () => void;
}

export default function QuickStartStep({
  world,
  onBack,
  onComplete,
  onCustomizeCharacter,
}: QuickStartStepProps) {
  const router = useRouter();
  const createCharacter = useCharacterStore(
    (state: CharacterStore) => state.createCharacter
  );
  const setCurrentCharacter = useCharacterStore(
    (state: CharacterStore) => state.setCurrentCharacter
  );
  const initializeSession = useSessionStore((state) => state.initializeSession);

  const handleCharacterSelect = async (archetype: CharacterArchetype) => {
    try {
      // Convert archetype to character format
      const characterData = {
        name: archetype.name,
        description: archetype.description,
        worldId: world.id,
        level: archetype.level,
        isPlayer: true,
        attributes: archetype.attributes.map(
          (attr: { id: string; name: string; value: number }) => ({
            id: `attr-${Date.now()}-${Math.random()}`,
            characterId: '', // Will be set by store
            worldAttributeId: attr.id,
            name: attr.name,
            baseValue: attr.value,
            modifiedValue: attr.value,
            category: 'Generated',
          })
        ),
        skills: archetype.skills.map(
          (skill: { id: string; name: string; level: number }) => ({
            id: `skill-${Date.now()}-${Math.random()}`,
            characterId: '', // Will be set by store
            worldSkillId: skill.id,
            name: skill.name,
            level: skill.level,
            category: 'Generated',
          })
        ),
        background: {
          history: archetype.background.description,
          personality: archetype.background.personality,
          goals: [archetype.background.motivation],
          fears: archetype.background.fears,
          physicalDescription: archetype.background.physicalDescription,
          relationships: [],
          isKnownFigure: false,
        },
        derivedStats: [],
        status: {
          health: 100,
          maxHealth: 100,
          conditions: [],
          location: world.name,
        },
        inventory: {
          characterId: '', // Will be set by store
          items: [],
          capacity: 10,
          categories: [],
          itemOrder: [],
        },
      };

      // Create the character
      const characterId = createCharacter(characterData);
      setCurrentCharacter(characterId);

      // Start a new game session
      await initializeSession(world.id, characterId, () => {
        // Navigate to the game after session is initialized
        router.push('/play');
      });
    } catch (error) {
      console.error('Failed to create character:', error);
      // Could show an error message here
    }
  };

  const handleCustomizeClick = () => {
    onCustomizeCharacter();
  };

  // Fix infinite loop with memoized selector
  const existingCharacterNames = useMemo(() => {
    const characters = useCharacterStore.getState().characters;
    return (Object.values(characters) as Character[])
      .filter((char) => char.worldId === world.id)
      .map((char) => char.name);
  }, [world.id]);

  return (
    <div>
      {/* Back Button */}
      <div>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          Back to World Setup
        </Button>
      </div>

      {/* Quick Start Characters Component */}
      <QuickStartCharacters
        world={world}
        onCharacterSelect={handleCharacterSelect}
        onCustomizeClick={handleCustomizeClick}
        existingCharacterNames={existingCharacterNames}
      />

      {/* Alternative Actions */}
      <div>
        <Button
          variant="outline"
          onClick={onComplete}
          data-tutorial="quickstart-skip"
        >
          Skip Character Creation for Now
        </Button>
      </div>
    </div>
  );
}
