// src/components/CharacterCreationWizard/steps/PortraitStep.tsx

import React, { useState } from 'react';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { CharacterPortrait as CharacterPortraitType } from '@/types/character.types';
// Removed direct AI client imports - using API routes instead
import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';
import { LoadingState } from '@/components/ui/LoadingState';
import { PortraitCustomizationSection } from '@/components/shared';
import { useAsyncOperation } from '@/lib/hooks/useAsyncOperation';

interface CharacterFormData {
  name: string;
  description?: string;
  portrait?: CharacterPortraitType;
  attributes: Array<{ attributeId: string; value: number }>;
  skills: Array<{ skillId: string; level: number; isSelected: boolean }>;
  background: {
    history: string;
    personality: string;
    physicalDescription?: string;
    goals: string[];
    isKnownFigure?: boolean;
    knownFigureType?: 'historical' | 'fictional' | 'celebrity' | 'mythological' | 'other';
  };
}

interface PortraitStepProps {
  data: {
    characterData: CharacterFormData;
    worldId: string;
  };
  onUpdate: (updates: { portrait: CharacterPortraitType }) => void;
  worldConfig: Partial<World>;
}

export function PortraitStep({ data, onUpdate, worldConfig }: PortraitStepProps) {
  // Local state for prompt-affecting fields
  const [localPhysicalDescription, setLocalPhysicalDescription] = useState(
    data.characterData.background?.physicalDescription || ''
  );
  const [environmentHint, setEnvironmentHint] = useState('');

  const portrait: CharacterPortraitType = data.characterData.portrait || {
    type: 'placeholder',
    url: null
  };

  // Async operation hook for portrait generation
  const portraitOperation = useAsyncOperation(
    async () => {
      // Create a character object for the API
      const characterForGeneration: Character = {
        id: 'temp',
        name: data.characterData.name,
        description: '', // Character doesn't have a description in the wizard, using empty string
        worldId: data.worldId,
        attributes: data.characterData.attributes.map((attr) => ({
          attributeId: attr.attributeId,
          value: attr.value
        })),
        skills: data.characterData.skills
          .filter((skill) => skill.isSelected)
          .map((skill) => ({
            skillId: skill.skillId,
            level: skill.level,
            experience: 0,
            isActive: true
          })),
        background: {
          history: data.characterData.background.history + (environmentHint ? ` ${environmentHint}` : ''),
          personality: data.characterData.background.personality,
          physicalDescription: localPhysicalDescription || data.characterData.background.physicalDescription,
          goals: data.characterData.background.goals,
          fears: [],
          relationships: []
        },
        inventory: { items: [], capacity: 100, categories: [], characterId: 'temp' },
        status: { health: 100, maxHealth: 100, conditions: [] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Use the portrait generation API route
      const response = await fetch('/api/generate-portrait', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character: characterForGeneration,
          world: worldConfig,
          customDescription: localPhysicalDescription
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate portrait');
      }

      const { portrait: generatedPortrait } = await response.json();
      return generatedPortrait;
    },
    {
      onSuccess: (generatedPortrait) => {
        onUpdate({
          portrait: generatedPortrait
        });
      }
    }
  );

  const handleGeneratePortrait = () => {
    portraitOperation.execute();
  };

  const handleRemovePortrait = () => {
    onUpdate({
      portrait: {
        type: 'placeholder',
        url: null
      }
    });
    portraitOperation.clearError();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Character Portrait</h3>
        <p className="text-sm text-gray-700">
          {data.characterData.background?.isKnownFigure
            ? `Generate an AI portrait of ${data.characterData.name} as they are commonly recognized`
            : 'Generate an AI portrait for your character or use a placeholder'
          }
        </p>
      </div>

      {/* Portrait customization fields */}
      {portrait.type === 'placeholder' && (
        <PortraitCustomizationSection
          physicalDescription={localPhysicalDescription}
          setPhysicalDescription={setLocalPhysicalDescription}
          environmentHint={environmentHint}
          setEnvironmentHint={setEnvironmentHint}
          className="max-w-md mx-auto"
        />
      )}

      <div className="flex flex-col items-center space-y-4">
        {portraitOperation.isLoading ? (
          <div className="w-32 h-32 flex items-center justify-center">
            <LoadingState 
              variant="spinner" 
              size="md" 
              centered={false}
            />
          </div>
        ) : (
          <CharacterPortrait
            portrait={portrait}
            characterName={data.characterData.name}
            size="xlarge"
            error={portraitOperation.error}
          />
        )}

        {portrait.type === 'placeholder' && (
          <button
            type="button"
            onClick={handleGeneratePortrait}
            disabled={portraitOperation.isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Portrait
          </button>
        )}

        {portrait.type === 'ai-generated' && portrait.url && (
          <div className="text-center space-y-2">
            <p className="text-sm text-green-500">✓ Portrait generated successfully</p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={handleGeneratePortrait}
                disabled={portraitOperation.isLoading}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Regenerate Portrait
              </button>
              <button
                type="button"
                onClick={handleRemovePortrait}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
              >
                Remove Portrait
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
          Portrait generation is optional. You can skip portrait generation and continue.
        </p>
      </div>
    </div>
  );
}
