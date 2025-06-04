// src/components/devtools/PortraitDebugSection/PortraitDebugSection.tsx

import React, { useState } from 'react';
import Image from 'next/image';
import { CollapsibleSection } from '../CollapsibleSection';
import { PortraitGenerator } from '../../../lib/ai/portraitGenerator';
import { createAIClient } from '../../../lib/ai';
import { characterStore } from '../../../state/characterStore';
import { worldStore } from '../../../state/worldStore';
import { PromptBreakdown } from './PromptBreakdown';
import { Character } from '../../../types/character.types';
import { World } from '../../../types/world.types';


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
  const characters = characterStore((state) => state.characters);
  const charactersArray = Object.values(characters);
  const selectedCharacter = selectedCharacterId ? characters[selectedCharacterId] : null;
  
  // Get worlds from store
  const worlds = worldStore((state) => state.worlds);
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

  const generatePromptPreview = async () => {
    if (!effectiveCharacterData) {
      setGeneratedPrompt('No character data available. Please select a character or provide character data.');
      return;
    }

    try {
      const aiClient = createAIClient();
      const generator = new PortraitGenerator(aiClient);
      
      // Create a mock character for prompt generation
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
      
      const mockCharacter: Character = {
        id: 'preview',
        name: effectiveCharacterData.name || 'Test Character',
        description: '',
        worldId: effectiveCharacterData.worldId || 'world-1',
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
          characterId: 'preview' 
        },
        status: { 
          health: getStatusProp('health') || getStatusProp('hp') || 100, 
          maxHealth: getStatusProp('maxHealth') || 100, 
          conditions: getStatusProp('conditions') || [] 
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const prompt = await generator.buildPortraitPrompt(mockCharacter, {
        worldTheme: effectiveWorldConfig?.theme
      });

      setGeneratedPrompt(prompt);
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
      
      const mockCharacter: Character = {
        id: 'test',
        name: effectiveCharacterData.name || 'Test Character',
        description: '',
        worldId: effectiveCharacterData.worldId || 'world-1',
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
          characterId: 'test' 
        },
        status: { 
          health: getStatusProp('health') || getStatusProp('hp') || 100, 
          maxHealth: getStatusProp('maxHealth') || 100, 
          conditions: getStatusProp('conditions') || [] 
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await generator.generatePortrait(mockCharacter, {
        worldTheme: effectiveWorldConfig?.theme
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
          <div className="bg-slate-700 p-3 rounded border border-slate-600">
            <label className="block text-sm font-medium mb-2 text-slate-200">
              Select Character:
            </label>
            <select
              value={selectedCharacterId}
              onChange={(e) => setSelectedCharacterId(e.target.value)}
              className="w-full px-3 py-1 bg-slate-800 text-slate-200 border border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a character --</option>
              {charactersArray.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name} (Level {'level' in char ? (char as {level?: number}).level || 1 : 1})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Character Info Summary */}
        {effectiveCharacterData && (
          <div className="bg-slate-700 p-3 rounded border border-slate-600">
            <h4 className="font-medium mb-2 text-slate-200">Character Summary</h4>
            <div className="text-sm space-y-1 text-slate-300">
              <div><strong>Name:</strong> {effectiveCharacterData.name || 'Not set'}</div>
              <div><strong>World Theme:</strong> {effectiveWorldConfig?.theme || 'Not set'}</div>
              <div><strong>Attributes:</strong> {effectiveCharacterData.attributes?.length || 0}</div>
              <div><strong>Skills:</strong> {
                effectiveCharacterData.skills?.filter((s) => 'isSelected' in s ? s.isSelected : true)?.length || 
                effectiveCharacterData.skills?.length || 0
              }</div>
              <div><strong>Background:</strong> {effectiveCharacterData.background?.personality ? 'Set' : 'Not set'}</div>
            </div>
          </div>
        )}

        {/* Prompt Generation */}
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={generatePromptPreview}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              disabled={!effectiveCharacterData}
            >
              Generate Prompt Preview
            </button>
            <button
              onClick={testPromptGeneration}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              disabled={!effectiveCharacterData || isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Test Full Generation'}
            </button>
            {generatedPrompt && (
              <>
                <button
                  onClick={copyPromptToClipboard}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                >
                  Copy Prompt
                </button>
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                >
                  {showBreakdown ? 'Hide' : 'Show'} Breakdown
                </button>
              </>
            )}
          </div>

          {generatedPrompt && (
            <div className="bg-slate-700 p-3 rounded border border-slate-600">
              <h4 className="font-medium mb-2 text-slate-200">Generated Prompt:</h4>
              <pre className="text-sm whitespace-pre-wrap break-words bg-slate-800 p-2 rounded border border-slate-600 text-slate-300">
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
          <div className="bg-slate-700 p-3 rounded border border-slate-600">
            <h4 className="font-medium mb-2 text-slate-200">Last Generated Image:</h4>
            <div className="relative w-32 h-32">
              <Image
                src={lastGeneratedImage}
                alt="Generated portrait"
                fill
                className="rounded border border-slate-500 object-cover"
                unoptimized // For base64 data URLs
              />
            </div>
          </div>
        )}

        {/* Prompt Building Tips */}
        <div className="bg-blue-900 bg-opacity-30 p-3 rounded text-sm border border-blue-700">
          <h4 className="font-medium mb-2 text-blue-300">💡 Prompt Building Tips:</h4>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li>Character name is included automatically</li>
            <li>Personality traits influence appearance description</li>
            <li>Skills determine character class (warrior, mage, etc.)</li>
            <li>World theme affects art style</li>
            <li>Background history adds context</li>
          </ul>
        </div>

        {/* API Debug Info */}
        <div className="bg-yellow-900 bg-opacity-30 p-3 rounded text-sm border border-yellow-700">
          <h4 className="font-medium mb-2 text-yellow-300">🔧 API Debug Info:</h4>
          <div className="space-y-1 text-slate-300">
            <div><strong>Endpoint:</strong> /api/generate-portrait</div>
            <div><strong>Model:</strong> gemini-2.0-flash-preview-image-generation</div>
            <div><strong>Security:</strong> ✅ Server-side API key (secure)</div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}