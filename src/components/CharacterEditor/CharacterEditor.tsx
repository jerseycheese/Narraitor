import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { characterStore } from '@/state/characterStore';
import { worldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { PortraitGenerator } from '@/lib/ai/portraitGenerator';
import { createAIClient } from '@/lib/ai/clientFactory';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';

// Use the Character type from the store since it's different from the main types
type Character = ReturnType<typeof characterStore.getState>['characters'][string];

interface CharacterEditorProps {
  characterId: string;
}

const CharacterEditor: React.FC<CharacterEditorProps> = ({ characterId }) => {
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Load character data on mount
  useEffect(() => {
    try {
      const { characters } = characterStore.getState();
      const characterData = characters[characterId];
      
      if (!characterData) {
        setError('Character not found');
        setLoading(false);
        return;
      }
      
      // Load world data for attribute/skill limits
      const { worlds } = worldStore.getState();
      const worldData = worlds[characterData.worldId];
      setWorld(worldData);
      
      setCharacter(characterData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load character data');
      setLoading(false);
      console.error('Error loading character:', err);
    }
  }, [characterId]);
  
  // Handle saving all character changes
  const handleSave = async () => {
    if (!character) return;
    
    setSaving(true);
    try {
      const { updateCharacter } = characterStore.getState();
      updateCharacter(characterId, character);
      
      // Small delay to show save state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push(`/characters/${characterId}`); // Navigate back to character view
    } catch (err) {
      setError('Failed to save character');
      console.error('Error saving character:', err);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle canceling edits
  const handleCancel = () => {
    router.push(`/characters/${characterId}`);
  };
  
  // Handle character deletion
  const handleDelete = () => {
    characterStore.getState().deleteCharacter(characterId);
    router.push('/characters');
  };
  
  // Handle portrait generation
  const handleGeneratePortrait = async () => {
    if (!character || !world) return;
    
    setGeneratingPortrait(true);
    try {
      const aiClient = createAIClient();
      const portraitGenerator = new PortraitGenerator(aiClient);
      
      // Create a Character-like object for portrait generation
      const characterForPortrait = {
        id: characterId,
        name: character.name,
        description: character.background?.description || '',
        worldId: character.worldId,
        background: {
          history: character.background.description,
          personality: character.background.personality,
          physicalDescription: character.background.motivation,
          goals: [],
          fears: [],
          relationships: []
        },
        attributes: character.attributes.map(attr => ({
          attributeId: attr.id,
          value: attr.modifiedValue
        })),
        skills: character.skills.map(skill => ({
          skillId: skill.id,
          level: skill.level,
          experience: 0,
          isActive: true
        })),
        inventory: {
          characterId: characterId,
          items: [],
          capacity: 100,
          categories: []
        },
        status: {
          health: character.status.hp,
          maxHealth: 100,
          conditions: [],
          location: undefined
        },
        createdAt: character.createdAt,
        updatedAt: character.updatedAt
      };
      
      const portrait = await portraitGenerator.generatePortrait(characterForPortrait, {
        worldTheme: world.theme
      });
      
      // Update character with new portrait
      setCharacter({ ...character, portrait });
    } catch (error) {
      console.error('Failed to generate portrait:', error);
      setError('Failed to generate portrait. Please try again.');
    } finally {
      setGeneratingPortrait(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg text-gray-600">Loading character data...</div>
      </div>
    );
  }
  
  if (error || !character || !world) {
    return (
      <div className="p-4">
        <div className="text-red-600">{error || 'Character not found'}</div>
        <button 
          onClick={() => router.push('/characters')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
        >
          Return to Characters
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 p-4">
      {/* Portrait Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Character Portrait</h2>
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <CharacterPortrait
              portrait={character.portrait || { type: 'placeholder', url: null }}
              characterName={character.name}
              size="large"
            />
          </div>
          <div className="flex-1">
            <p className="text-gray-600 mb-4">
              {character.portrait?.type === 'ai-generated' 
                ? 'AI-generated portrait based on character details.'
                : 'No portrait has been generated yet.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleGeneratePortrait}
                disabled={generatingPortrait}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {generatingPortrait ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {character.portrait?.type === 'ai-generated' ? 'Regenerate Portrait' : 'Generate Portrait'}
                  </>
                )}
              </button>
              {character.portrait?.type === 'ai-generated' && (
                <button
                  onClick={() => setCharacter({ ...character, portrait: undefined })}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove Portrait
                </button>
              )}
            </div>
            {character.portrait?.generatedAt && (
              <p className="text-sm text-gray-500 mt-2">
                Generated: {new Date(character.portrait.generatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Basic Info Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Character Name
            </label>
            <input
              type="text"
              value={character.name}
              onChange={(e) => setCharacter({ ...character, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <select
              value={character.level}
              onChange={(e) => setCharacter({ ...character, level: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                <option key={level} value={level}>Level {level}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Character Type
            </label>
            <select
              value={character.isPlayer ? 'player' : 'npc'}
              onChange={(e) => setCharacter({ ...character, isPlayer: e.target.value === 'player' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="player">Player Character</option>
              <option value="npc">Non-Player Character (NPC)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Background Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Background</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={character.background?.description || ''}
              onChange={(e) => setCharacter({ 
                ...character, 
                background: { ...character.background, description: e.target.value }
              })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your character's history and background..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personality
            </label>
            <textarea
              value={character.background?.personality || ''}
              onChange={(e) => setCharacter({ 
                ...character, 
                background: { ...character.background, personality: e.target.value }
              })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your character's personality traits..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivation
            </label>
            <textarea
              value={character.background?.motivation || ''}
              onChange={(e) => setCharacter({ 
                ...character, 
                background: { ...character.background, motivation: e.target.value }
              })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What drives your character?"
            />
          </div>
        </div>
      </div>
      
      {/* Attributes Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Attributes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {character.attributes.map((attr) => (
            <div key={attr.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {attr.name}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={world.attributes.find((wa) => wa.id === attr.id)?.minValue || 1}
                  max={world.attributes.find((wa) => wa.id === attr.id)?.maxValue || 10}
                  value={attr.modifiedValue}
                  onChange={(e) => {
                    const newAttributes = character.attributes.map(a =>
                      a.id === attr.id ? { ...a, modifiedValue: parseInt(e.target.value) } : a
                    );
                    setCharacter({ ...character, attributes: newAttributes });
                  }}
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">{attr.modifiedValue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Skills Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Skills</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {character.skills.map((skill) => (
            <div key={skill.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {skill.name}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={skill.level}
                  onChange={(e) => {
                    const newSkills = character.skills.map(s =>
                      s.id === skill.id ? { ...s, level: parseInt(e.target.value) } : s
                    );
                    setCharacter({ ...character, skills: newSkills });
                  }}
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">{skill.level}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <button 
          onClick={() => setShowDeleteDialog(true)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
          disabled={saving}
        >
          Delete Character
        </button>
        <div className="flex space-x-4">
          <button 
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer"
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      {character && (
        <DeleteConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          title="Delete Character"
          description={`Are you sure you want to delete "${character.name}"? This action cannot be undone.`}
          itemName={character.name}
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
        />
      )}
    </div>
  );
};

export default CharacterEditor;