import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { characterStore } from '@/state/characterStore';
import { worldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';
// Removed direct AI client imports - using API routes instead
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { LoadingState } from '@/components/ui/LoadingState';
import { PageError } from '@/components/ui/ErrorDisplay';
import { PortraitSection } from './components/PortraitSection';
import { BasicInfoForm } from './components/BasicInfoForm';
import { BackgroundForm } from './components/BackgroundForm';
import { AttributesForm } from './components/AttributesForm';
import { SkillsForm } from './components/SkillsForm';

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
  const handleGeneratePortrait = async (customDescription?: string) => {
    if (!character || !world) return;
    
    setGeneratingPortrait(true);
    try {
      // Use the portrait generation API route
      const response = await fetch('/api/generate-portrait', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character: {
            id: characterId,
            name: character.name,
            worldId: character.worldId,
            background: {
              history: character.background.history,
              personality: character.background.personality,
              physicalDescription: customDescription || character.background.physicalDescription || '',
              goals: character.background.goals || [],
              fears: character.background.fears || [],
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
              conditions: []
            },
            createdAt: character.createdAt,
            updatedAt: character.updatedAt
          },
          world: world,
          customDescription: customDescription
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate portrait');
      }

      const { portrait } = await response.json();
      
      // Update character with new portrait
      setCharacter({ ...character, portrait });
      
      // Also update the character store
      characterStore.getState().updateCharacter(characterId, { portrait });
    } catch (error) {
      console.error('Failed to generate portrait:', error);
      setError('Failed to generate portrait. Please try again.');
    } finally {
      setGeneratingPortrait(false);
    }
  };
  
  if (loading) {
    return <LoadingState message="Loading character data..." />;
  }
  
  if (error || !character || !world) {
    return (
      <PageError
        title="Character Not Found"
        message={error || 'The requested character could not be found or loaded.'}
        showRetry={true}
        onRetry={() => router.push('/characters')}
      />
    );
  }
  
  return (
    <div className="space-y-8 p-4">
      {/* Portrait Section */}
      <PortraitSection
        portrait={character.portrait}
        characterName={character.name}
        generatingPortrait={generatingPortrait}
        onGeneratePortrait={handleGeneratePortrait}
        onRemovePortrait={() => setCharacter({ ...character, portrait: undefined })}
      />
      
      {/* Basic Info Section */}
      <BasicInfoForm
        name={character.name}
        level={character.level}
        isPlayer={character.isPlayer}
        onNameChange={(name) => setCharacter({ ...character, name })}
        onLevelChange={(level) => setCharacter({ ...character, level })}
        onPlayerTypeChange={(isPlayer) => setCharacter({ ...character, isPlayer })}
      />
      
      {/* Background Section */}
      <BackgroundForm
        background={character.background}
        onBackgroundChange={(background) => setCharacter({ ...character, background })}
      />
      
      {/* Attributes Section */}
      <AttributesForm
        attributes={character.attributes.map(attr => ({
          attributeId: world.attributes.find(wa => wa.name === attr.name)?.id || attr.id,
          value: attr.baseValue
        }))}
        world={world}
        onAttributesChange={(formAttributes) => {
          const updatedAttributes = character.attributes.map(attr => {
            const formAttr = formAttributes.find(fa => {
              const worldAttr = world.attributes.find(wa => wa.id === fa.attributeId);
              return worldAttr?.name === attr.name;
            });
            return formAttr ? { ...attr, baseValue: formAttr.value, modifiedValue: formAttr.value } : attr;
          });
          setCharacter({ ...character, attributes: updatedAttributes });
        }}
      />
      
      {/* Skills Section */}
      <SkillsForm
        skills={character.skills.map(skill => ({
          skillId: world.skills.find(ws => ws.name === skill.name)?.id || skill.id,
          level: skill.level,
          experience: 0,
          isActive: true
        }))}
        world={world}
        onSkillsChange={(formSkills) => {
          const updatedSkills = character.skills.map(skill => {
            const formSkill = formSkills.find(fs => {
              const worldSkill = world.skills.find(ws => ws.id === fs.skillId);
              return worldSkill?.name === skill.name;
            });
            return formSkill ? { ...skill, level: formSkill.level } : skill;
          });
          setCharacter({ ...character, skills: updatedSkills });
        }}
      />
      
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