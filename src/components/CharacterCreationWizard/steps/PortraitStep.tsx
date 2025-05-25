// src/components/CharacterCreationWizard/steps/PortraitStep.tsx

import React, { useState } from 'react';
import { CharacterPortrait } from '../../CharacterPortrait';
import { CharacterPortrait as CharacterPortraitType } from '../../../types/character.types';
import { PortraitGenerator } from '../../../lib/ai/portraitGenerator';
import { createAIClient } from '../../../lib/ai/clientFactory';
import { Character } from '../../../types/character.types';
import { World } from '../../../types/world.types';
import { LoadingState } from '../../ui/LoadingState';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local state for prompt-affecting fields
  const [localPhysicalDescription, setLocalPhysicalDescription] = useState(
    data.characterData.background?.physicalDescription || ''
  );
  const [portraitStyle, setPortraitStyle] = useState<'photorealistic' | 'fantasy' | 'anime'>('photorealistic');
  const [environmentHint, setEnvironmentHint] = useState('');

  const portrait: CharacterPortraitType = data.characterData.portrait || {
    type: 'placeholder',
    url: null
  };

  const handleGeneratePortrait = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const aiClient = createAIClient();
      const generator = new PortraitGenerator(aiClient);
      
      // Create a character object for the generator with local overrides
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

      // Determine world theme based on style selection
      let effectiveTheme = worldConfig.theme;
      if (portraitStyle === 'fantasy') {
        effectiveTheme = 'fantasy';
      } else if (portraitStyle === 'anime') {
        effectiveTheme = 'anime';
      }

      const generatedPortrait = await generator.generatePortrait(
        characterForGeneration,
        { 
          worldTheme: effectiveTheme
        }
      );

      onUpdate({
        portrait: generatedPortrait
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate portrait');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemovePortrait = () => {
    onUpdate({
      portrait: {
        type: 'placeholder',
        url: null
      }
    });
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Character Portrait</h3>
        <p className="text-sm text-gray-600">
          {data.characterData.background?.isKnownFigure
            ? `Generate an AI portrait of ${data.characterData.name} as they are commonly recognized`
            : 'Generate an AI portrait for your character or use a placeholder'
          }
        </p>
      </div>

      {/* Portrait customization fields */}
      {portrait.type === 'placeholder' && (
        <div className="space-y-4 max-w-md mx-auto">
          <div>
            <label htmlFor="physical-desc" className="block text-sm font-medium text-gray-700 mb-1">
              Physical Description (for portrait)
            </label>
            <textarea
              id="physical-desc"
              value={localPhysicalDescription}
              onChange={(e) => setLocalPhysicalDescription(e.target.value)}
              placeholder="e.g., Long silver hair, green eyes, wearing a blue robe..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              Describe appearance details you want in the portrait
            </p>
          </div>

          <div>
            <label htmlFor="portrait-style" className="block text-sm font-medium text-gray-700 mb-1">
              Portrait Style
            </label>
            <select
              id="portrait-style"
              value={portraitStyle}
              onChange={(e) => setPortraitStyle(e.target.value as 'photorealistic' | 'fantasy' | 'anime')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="photorealistic">Photorealistic</option>
              <option value="fantasy">Fantasy Art</option>
              <option value="anime">Anime Style</option>
            </select>
          </div>

          <div>
            <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-1">
              Environment/Setting (optional)
            </label>
            <input
              id="environment"
              type="text"
              value={environmentHint}
              onChange={(e) => setEnvironmentHint(e.target.value)}
              placeholder="e.g., In a forest, throne room, starship bridge..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        {isGenerating ? (
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
            error={error}
          />
        )}

        {portrait.type === 'placeholder' && (
          <button
            type="button"
            onClick={handleGeneratePortrait}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Portrait
          </button>
        )}

        {portrait.type === 'ai-generated' && portrait.url && (
          <div className="text-center space-y-2">
            <p className="text-sm text-green-600">✓ Portrait generated successfully</p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={handleGeneratePortrait}
                disabled={isGenerating}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Regenerate Portrait
              </button>
              <button
                type="button"
                onClick={handleRemovePortrait}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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