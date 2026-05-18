// src/components/CharacterCreationWizard/steps/PortraitStep.tsx

import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { GeneratedImage } from '@/types/common.types';
import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';
import { LoadingState } from '@/components/ui/LoadingState';
import { PortraitCustomizationSection } from '@/components/shared';
import { getTimestamp } from '@/lib/utils';
import { usePortraitGeneration } from '@/lib/hooks/usePortraitGeneration';

interface CharacterFormData {
  name: string;
  description?: string;
  portrait?: GeneratedImage;
  attributes: Array<{ attributeId: string; value: number }>;
  skills: Array<{ skillId: string; level: number; isSelected: boolean }>;
  background: {
    history: string;
    personality: string;
    physicalDescription?: string;
    goals: string[];
    isKnownFigure?: boolean;
    knownFigureType?:
      | 'historical'
      | 'fictional'
      | 'celebrity'
      | 'mythological'
      | 'other';
  };
}

interface PortraitStepProps {
  data: {
    characterData: CharacterFormData;
    worldId: string;
  };
  onUpdate: (updates: { portrait: GeneratedImage }) => void;
  worldConfig: Partial<World>;
}

export function PortraitStep({
  data,
  onUpdate,
  worldConfig,
}: PortraitStepProps) {
  const { isGenerating, error, generate, clearError } = usePortraitGeneration();

  // Local state for prompt-affecting fields
  const [localPhysicalDescription, setLocalPhysicalDescription] = useState(
    data.characterData.background?.physicalDescription || ''
  );
  const [environmentHint, setEnvironmentHint] = useState('');

  const portrait: GeneratedImage = data.characterData.portrait || {
    type: 'placeholder',
    url: null,
  };

  const handleGeneratePortrait = async () => {
    const characterForGeneration: Character = {
      id: 'temp',
      name: data.characterData.name,
      description: '',
      worldId: data.worldId,
      attributes: data.characterData.attributes.map((attr) => ({
        attributeId: attr.attributeId,
        value: attr.value,
      })),
      skills: data.characterData.skills
        .filter((skill) => skill.isSelected)
        .map((skill) => ({
          skillId: skill.skillId,
          level: skill.level,
          experience: 0,
          isActive: true,
        })),
      derivedStats: [],
      background: {
        history:
          data.characterData.background.history +
          (environmentHint ? `${environmentHint}` : ''),
        personality: data.characterData.background.personality,
        physicalDescription:
          localPhysicalDescription ||
          data.characterData.background.physicalDescription,
        goals: data.characterData.background.goals,
        fears: [],
        relationships: [],
      },
      inventory: {
        items: [],
        capacity: 100,
        categories: [],
        characterId: 'temp',
        itemOrder: [],
      },
      status: { health: 100, maxHealth: 100, conditions: [] },
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
    };

    try {
      const generatedPortrait = await generate({
        character: characterForGeneration,
        world: worldConfig,
        customDescription: localPhysicalDescription,
      });
      if (generatedPortrait) {
        onUpdate({ portrait: generatedPortrait });
      }
    } catch {
      // Error already captured in hook state
    }
  };

  const handleRemovePortrait = () => {
    onUpdate({
      portrait: {
        type: 'placeholder',
        url: null,
      },
    });
    clearError();
  };

  return (
    <div className="component-portrait-step">
      <div>
        <h3>Character Portrait</h3>
        <p>
          {data.characterData.background?.isKnownFigure
            ? `Generate a portrait of ${data.characterData.name} as they are commonly recognized`
            : 'Generate a portrait for your character or use a placeholder'}
        </p>
      </div>

      {/* Portrait customization fields */}
      {portrait.type === 'placeholder' && (
        <PortraitCustomizationSection
          physicalDescription={localPhysicalDescription}
          setPhysicalDescription={setLocalPhysicalDescription}
          environmentHint={environmentHint}
          setEnvironmentHint={setEnvironmentHint}
        />
      )}

      <div>
        {isGenerating ? (
          <div>
            <LoadingState variant="spinner" size="md" centered={false} />
          </div>
        ) : (
          <CharacterPortrait
            portrait={portrait}
            characterName={data.characterData.name}
            size="xlarge"
            error={error}
          />
        )}

        {portrait.type === 'placeholder' && (
          <button
            type="button"
            onClick={handleGeneratePortrait}
            disabled={isGenerating}
          >
            Generate Portrait
          </button>
        )}

        {portrait.type === 'ai-generated' && portrait.url && (
          <div>
            <p>
              <CheckCircle aria-hidden="true" />
              Portrait generated successfully
            </p>
            <div>
              <button
                type="button"
                onClick={handleGeneratePortrait}
                disabled={isGenerating}
              >
                Regenerate Portrait
              </button>
              <button type="button" onClick={handleRemovePortrait}>
                Remove Portrait
              </button>
            </div>
          </div>
        )}

        <p>
          Portrait generation is optional. You can skip portrait generation and
          continue.
        </p>
      </div>
    </div>
  );
}
