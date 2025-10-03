// src/components/devtools/PortraitDebugSection/PortraitDebugSection.tsx

import React, { useState } from 'react';
import Image from 'next/image';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { PortraitGenerator } from '@/lib/ai/portraitGenerator';
import { createAIClient } from '@/lib/ai';
import { useCharacterStore, type Character as StoreCharacter } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { PromptBreakdown } from './PromptBreakdown';
import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getTimestamp } from '@/lib/utils';


interface PortraitDebugSectionProps {
  characterData?: Partial<Character>;
  worldConfig?: Partial<World>;
}

export function PortraitDebugSection({ characterData, worldConfig }: PortraitDebugSectionProps) {
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedImage, setLastGeneratedImage] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  // Get characters from store
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const characters = useCharacterStore((state: any) => state.characters);
  const charactersArray = (Object.values(characters) as StoreCharacter[]);
  const selectedCharacter = selectedCharacterId ? characters[selectedCharacterId] : null;
  
  // Get worlds from store
  const worlds = useWorldStore((state) => state.worlds);
  const selectedWorld = selectedCharacter ? worlds[selectedCharacter.worldId] : null;
  
  // Use selected character data or passed props
  const effectiveCharacterData = selectedCharacter || characterData;
  const effectiveWorldConfig = selectedWorld || worldConfig;
  
  // Helper to safely access background properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getBackgroundProp = (prop: string): any => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bg = effectiveCharacterData?.background as any;
    return bg?.[prop];
  };
  
  // Helper to safely access status properties  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStatusProp = (prop: string): any => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = effectiveCharacterData?.status as any;
    return status?.[prop];
  };

  /**
   * Creates a mock character object for API calls, centralizing the logic
   * to avoid duplication between different generation methods
   */
  const createMockCharacter = (id: string): StoreCharacter => {
    if (!effectiveCharacterData) {
      throw new Error('No character data available');
    }

    // Handle the different attribute/skill formats between store and types
    type AnyAttribute = { id?: string; attributeId?: string; value?: number; baseValue?: number };
    type AnySkill = { id?: string; skillId?: string; level?: number; experience?: number; isActive?: boolean };
    
    const mockAttributes = effectiveCharacterData.attributes?.map((attr: AnyAttribute) => ({
      attributeId: attr.attributeId || attr.id || 'attr-1',
      value: attr.value || attr.baseValue || 10
    })) || [];
    
    const mockSkills = effectiveCharacterData.skills?.map((skill: AnySkill) => ({
      skillId: skill.skillId || skill.id || 'skill-1',
      level: skill.level || 1,
      experience: skill.experience || 0,
      isActive: skill.isActive !== undefined ? skill.isActive : true
    })) || [];
    
    return {
      id,
      name: effectiveCharacterData.name || 'Test Character',
      description: '',
      worldId: effectiveCharacterData.worldId || 'world-1',
      level: effectiveCharacterData.level || 1,
      isPlayer: effectiveCharacterData.isPlayer || false,
      attributes: mockAttributes,
      skills: mockSkills,
      background: {
        history: getBackgroundProp('history') || '',
        personality: getBackgroundProp('personality') || '',
        goals: getBackgroundProp('goals') || [],
        fears: getBackgroundProp('fears') || [],
        relationships: getBackgroundProp('relationships') || []
      },
      inventory: { 
        items: [], 
        capacity: 100, 
        categories: [], 
        characterId: id 
      },
      status: {
        health: getStatusProp('health') || getStatusProp('hp') || 100,
        maxHealth: getStatusProp('maxHealth') || 100,
        conditions: getStatusProp('conditions') || []
      },
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    };
  };

  const generatePromptPreview = async () => {
    console.log('generatePromptPreview called');
    if (!effectiveCharacterData) {
      console.log('No effective character data');
      setGeneratedPrompt('No character data available. Please select a character or provide character data.');
      return;
    }

    console.log('Starting prompt generation with API...');
    try {
      const mockCharacter = createMockCharacter('preview');

      // Use the server-side API for portrait generation to include character detection
      const requestBody = {
        character: mockCharacter,
        world: effectiveWorldConfig,
        customDescription: getBackgroundProp('physicalDescription'),
        promptOnly: true // Add a flag to return only the prompt
      };
      
      console.log('Calling API with character:', mockCharacter.name);
      console.log('Custom description:', requestBody.customDescription);
      console.log('Request body:', requestBody);
      console.log('promptOnly flag:', requestBody.promptOnly);
      
      const response = await fetch('/api/generate-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('API error response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('API response result:', result);
      const prompt = result.prompt || result.portrait?.prompt;
      console.log('Extracted prompt:', prompt);

      setGeneratedPrompt(prompt);
      console.log('Prompt set successfully');
    } catch (error) {
      setGeneratedPrompt(`Error generating prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testPromptGeneration = async () => {
    if (!effectiveCharacterData) return;

    setIsGenerating(true);
    try {
      const aiClient = createAIClient();
      const generator = new PortraitGenerator(aiClient);
      
      const mockCharacter = createMockCharacter('test');

      const result = await generator.generatePortrait(mockCharacter as unknown as Character, {
        worldGenre: effectiveWorldConfig?.genre
      });

      setLastGeneratedImage(result.url);
      setGeneratedPrompt(result.prompt || 'No prompt returned');
    } catch (error) {
      setGeneratedPrompt(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
  };

  return (
    <CollapsibleSection title="Portrait Generation Debug" initialCollapsed={true}>
      <div className="space-y-4">
        {/* Character Selector */}
        {charactersArray.length > 0 && (
          <div className="bg-gray-100 p-3 rounded border border-gray-300">
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Select Character:
            </label>
            <Select 
              value={selectedCharacterId} 
              onChange={(e) => setSelectedCharacterId(e.target.value)}
              className="text-sm"
            >
              <option value="">-- Select a character --</option>
              {charactersArray.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name} (Level {'level' in char ? (char as {level?: number}).level || 1 : 1})
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Character Info Summary */}
        {effectiveCharacterData && (
          <div className="bg-gray-100 p-3 rounded border border-gray-300">
            <h4 className="font-medium mb-2 text-gray-900">Character Summary</h4>
            <div className="text-sm space-y-1 text-gray-700">
              <div><strong>Name:</strong> {effectiveCharacterData.name || 'Not set'}</div>
              <div><strong>World Genre:</strong> {effectiveWorldConfig?.genre || 'Not set'}</div>
              <div><strong>Attributes:</strong> {effectiveCharacterData.attributes?.length || 0}</div>
              <div><strong>Skills:</strong> {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                effectiveCharacterData.skills?.filter((s: any) => 'isSelected' in s ? s.isSelected : true)?.length || 
                effectiveCharacterData.skills?.length || 0
              }</div>
              <div><strong>Background:</strong> {effectiveCharacterData.background?.personality ? 'Set' : 'Not set'}</div>
            </div>
          </div>
        )}

        {/* Prompt Generation */}
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={generatePromptPreview}
              className="!bg-blue-700 hover:!bg-blue-900 !text-white"
              size="sm"
              variant="default"
              disabled={!effectiveCharacterData}
            >
              Generate Prompt Preview
            </Button>
            <Button
              onClick={testPromptGeneration}
              className="!bg-green-700 hover:!bg-green-900 !text-white"
              size="sm"
              variant="default"
              disabled={!effectiveCharacterData || isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Test Full Generation'}
            </Button>
            {generatedPrompt && (
              <>
                <Button
                  onClick={copyPromptToClipboard}
                  className="!bg-gray-700 hover:!bg-gray-900 !text-white"
                  size="sm"
                  variant="default"
                >
                  Copy Prompt
                </Button>
                <Button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="!bg-blue-700 hover:!bg-blue-900 !text-white"
                  size="sm"
                  variant="default"
                >
                  {showBreakdown ? 'Hide' : 'Show'} Breakdown
                </Button>
              </>
            )}
          </div>

          {generatedPrompt && (
            <div className="bg-gray-100 p-3 rounded border border-gray-300">
              <h4 className="font-medium mb-2 text-gray-900">Generated Prompt:</h4>
              <pre className="text-sm whitespace-pre-wrap break-words bg-white p-2 rounded border border-gray-300 text-gray-900">
                {generatedPrompt}
              </pre>
            </div>
          )}
        </div>

        {/* Prompt Breakdown */}
        {showBreakdown && generatedPrompt && (
          <PromptBreakdown
            characterData={effectiveCharacterData as Partial<Character> | undefined}
            worldConfig={effectiveWorldConfig}
            prompt={generatedPrompt}
          />
        )}

        {/* Last Generated Image */}
        {lastGeneratedImage && (
          <div className="bg-gray-100 p-3 rounded border border-gray-300">
            <h4 className="font-medium mb-2 text-gray-900">Last Generated Image:</h4>
            <div className="relative w-32 h-32">
              <Image
                src={lastGeneratedImage}
                alt="Generated portrait"
                fill
                className="rounded border border-gray-500 object-cover"
                unoptimized // For base64 data URLs
              />
            </div>
          </div>
        )}

        {/* Prompt Building Tips */}
        <div className="bg-blue-50 p-3 rounded text-sm border border-blue-200">
          <h4 className="font-medium mb-2 text-blue-900">Prompt Building Tips:</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Character name is included automatically</li>
            <li>Personality traits influence appearance description</li>
            <li>Skills determine character class (warrior, mage, etc.)</li>
            <li>World theme affects art style</li>
            <li>Background history adds context</li>
          </ul>
        </div>

        {/* API Debug Info */}
        <div className="bg-amber-50 p-3 rounded text-sm border border-amber-200">
          <h4 className="font-medium mb-2 text-amber-900">API Debug Info:</h4>
          <div className="space-y-1 text-gray-900">
            <div><strong>Endpoint:</strong> /api/generate-portrait</div>
            <div><strong>Model:</strong> gemini-2.0-flash-preview-image-generation</div>
            <div><strong>Security:</strong> Server-side API key (secure)</div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
