import React, { useEffect } from 'react';
import { useFormState } from '@/hooks';
import { useRouter } from 'next/navigation';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
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
import { useAsyncState, useModal } from '@/hooks';

// Use the Character type from the store since it's different from the main types
type Character = ReturnType<typeof useCharacterStore.getState>['characters'][string];

interface CharacterEditorProps {
  characterId: string;
}

const CharacterEditor: React.FC<CharacterEditorProps> = ({ characterId }) => {
  const router = useRouter();
  
  // Character and world data state using hooks
  const characterEditorState = useFormState({
    initialData: {
      character: null as Character | null,
      world: null as World | null
    }
  });
  
  // Error and loading state management using new hooks
  const loadingState = useAsyncState<{ character: Character; world: World }>();
  const saveState = useAsyncState();
  const portraitState = useAsyncState<string>();
  
  // Modal state management
  const deleteModal = useModal();
  
  // Load character data on mount
  useEffect(() => {
    loadingState.execute(async () => {
      const { characters } = useCharacterStore.getState();
      const characterData = characters[characterId];
      
      if (!characterData) {
        throw new Error('Character not found');
      }
      
      // Load world data for attribute/skill limits
      const { worlds } = useWorldStore.getState();
      const worldData = worlds[characterData.worldId];
      
      characterEditorState.updateData({
        character: characterData,
        world: worldData
      });
      
      return { character: characterData, world: worldData };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);
  
  // Handle saving all character changes
  const handleSave = async () => {
    if (!characterEditorState.data.character) return;
    
    await saveState.execute(async () => {
      const { updateCharacter } = useCharacterStore.getState();
      updateCharacter(characterId, characterEditorState.data.character!);
      
      // Small delay to show save state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push(`/characters/${characterId}`); // Navigate back to character view
    });
  };
  
  // Handle canceling edits
  const handleCancel = () => {
    router.push(`/characters/${characterId}`);
  };
  
  // Handle character deletion
  const handleDelete = () => {
    useCharacterStore.getState().deleteCharacter(characterId);
    router.push('/characters');
  };
  
  // Handle portrait generation
  const handleGeneratePortrait = async (customDescription?: string) => {
    if (!characterEditorState.data.character || !characterEditorState.data.world) return;
    
    const newPortrait = await portraitState.execute(async () => {
      // Use the portrait generation API route
      const response = await fetch('/api/generate-portrait', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character: {
            id: characterId,
            name: characterEditorState.data.character!.name,
            worldId: characterEditorState.data.character!.worldId,
            background: {
              history: characterEditorState.data.character!.background.history,
              personality: characterEditorState.data.character!.background.personality,
              physicalDescription: customDescription || characterEditorState.data.character!.background.physicalDescription || '',
              goals: characterEditorState.data.character!.background.goals || [],
              fears: characterEditorState.data.character!.background.fears || [],
              relationships: []
            },
            attributes: characterEditorState.data.character!.attributes.map(attr => ({
              attributeId: attr.id,
              value: attr.modifiedValue
            })),
            skills: characterEditorState.data.character!.skills.map(skill => ({
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
              health: characterEditorState.data.character!.status.health,
              maxHealth: characterEditorState.data.character!.status.maxHealth,
              conditions: characterEditorState.data.character!.status.conditions
            },
            createdAt: characterEditorState.data.character!.createdAt,
            updatedAt: characterEditorState.data.character!.updatedAt
          },
          world: characterEditorState.data.world,
          customDescription: customDescription
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate portrait');
      }

      const { portrait } = await response.json();
      return portrait;
    });

    if (newPortrait) {
      // Update character with new portrait
      characterEditorState.updateField('character', { 
        ...characterEditorState.data.character!, 
        portrait: newPortrait 
      });
      
      // Also update the character store
      useCharacterStore.getState().updateCharacter(characterId, { portrait: newPortrait });
    }
  };
  
  if (loadingState.isLoading) {
    return <LoadingState message="Loading character data..." />;
  }
  
  if (loadingState.error || !characterEditorState.data.character || !characterEditorState.data.world) {
    return (
      <PageError
        title="Character Not Found"
        message={loadingState.error || 'The requested character could not be found or loaded.'}
        showRetry={true}
        onRetry={() => router.push('/characters')}
      />
    );
  }
  
  return (
    <div className="space-y-8 p-4">
      {/* Portrait Section */}
      <PortraitSection
        portrait={characterEditorState.data.character!.portrait}
        characterName={characterEditorState.data.character!.name}
        generatingPortrait={portraitState.isLoading}
        onGeneratePortrait={handleGeneratePortrait}
        onRemovePortrait={() => characterEditorState.updateField('character', { 
          ...characterEditorState.data.character!, 
          portrait: undefined 
        })}
      />
      
      {/* Basic Info Section */}
      <BasicInfoForm
        name={characterEditorState.data.character!.name}
        level={characterEditorState.data.character!.level}
        isPlayer={characterEditorState.data.character!.isPlayer}
        onNameChange={(name) => characterEditorState.updateField('character', { 
          ...characterEditorState.data.character!, 
          name 
        })}
        onLevelChange={(level) => characterEditorState.updateField('character', { 
          ...characterEditorState.data.character!, 
          level 
        })}
        onPlayerTypeChange={(isPlayer) => characterEditorState.updateField('character', { 
          ...characterEditorState.data.character!, 
          isPlayer 
        })}
      />
      
      {/* Background Section */}
      <BackgroundForm
        background={{
          history: characterEditorState.data.character!.background.history,
          personality: characterEditorState.data.character!.background.personality,
          goals: characterEditorState.data.character!.background.goals,
          fears: characterEditorState.data.character!.background.fears,
          physicalDescription: characterEditorState.data.character!.background.physicalDescription
        }}
        onBackgroundChange={(background) => characterEditorState.updateField('character', { 
          ...characterEditorState.data.character!, 
          background: {
            ...characterEditorState.data.character!.background,
            ...background
          }
        })}
      />
      
      {/* Attributes Section */}
      <AttributesForm
        attributes={characterEditorState.data.character!.attributes.map(attr => ({
          attributeId: characterEditorState.data.world!.attributes.find(wa => wa.name === attr.name)?.id || attr.id,
          value: attr.baseValue
        }))}
        world={characterEditorState.data.world!}
        onAttributesChange={(formAttributes) => {
          const updatedAttributes = characterEditorState.data.character!.attributes.map(attr => {
            const formAttr = formAttributes.find(fa => {
              const worldAttr = characterEditorState.data.world!.attributes.find(wa => wa.id === fa.attributeId);
              return worldAttr?.name === attr.name;
            });
            return formAttr ? { ...attr, baseValue: formAttr.value, modifiedValue: formAttr.value } : attr;
          });
          characterEditorState.updateField('character', { 
            ...characterEditorState.data.character!, 
            attributes: updatedAttributes 
          });
        }}
      />
      
      {/* Skills Section */}
      <SkillsForm
        skills={characterEditorState.data.character!.skills.map(skill => ({
          skillId: characterEditorState.data.world!.skills.find(ws => ws.name === skill.name)?.id || skill.id,
          level: skill.level,
          experience: 0,
          isActive: true
        }))}
        world={characterEditorState.data.world!}
        onSkillsChange={(formSkills) => {
          const updatedSkills = characterEditorState.data.character!.skills.map(skill => {
            const formSkill = formSkills.find(fs => {
              const worldSkill = characterEditorState.data.world!.skills.find(ws => ws.id === fs.skillId);
              return worldSkill?.name === skill.name;
            });
            return formSkill ? { ...skill, level: formSkill.level } : skill;
          });
          characterEditorState.updateField('character', { 
            ...characterEditorState.data.character!, 
            skills: updatedSkills 
          });
        }}
      />
      
      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <button 
          onClick={deleteModal.open}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
          disabled={saveState.isLoading}
        >
          Delete Character
        </button>
        <div className="flex space-x-4">
          <button 
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer"
            disabled={saveState.isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            disabled={saveState.isLoading}
          >
            {saveState.isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      {characterEditorState.data.character && (
        <DeleteConfirmationDialog
          {...deleteModal.modalProps}
          onConfirm={handleDelete}
          title="Delete Character"
          description={`Are you sure you want to delete "${characterEditorState.data.character!.name}"? This action cannot be undone.`}
          itemName={characterEditorState.data.character!.name}
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
        />
      )}
    </div>
  );
};

export default CharacterEditor;
