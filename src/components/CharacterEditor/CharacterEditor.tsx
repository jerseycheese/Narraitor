import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { LoadingState } from '@/components/ui/LoadingState';
import { PageError } from '@/components/ui/ErrorDisplay';
import { Button } from '@/components/ui/button';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { PortraitSection } from './components/PortraitSection';
import { BasicInfoForm } from './components/BasicInfoForm';
import { BackgroundForm } from './components/BackgroundForm';
import { AttributesForm } from './components/AttributesForm';
import { SkillsForm } from './components/SkillsForm';

// Use the Character type from the store since it's different from the main types
type Character = ReturnType<typeof useCharacterStore.getState>['characters'][string];

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
      const { characters } = useCharacterStore.getState();
      const characterData = characters[characterId];
      
      if (!characterData) {
        setError('Character not found');
        setLoading(false);
        return;
      }
      
      const { worlds } = useWorldStore.getState();
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

  const isPoolValid = useMemo(() => {
    if (!character || !world) return true;

    const attributePointsSpent = character.attributes.reduce((sum, attr) => sum + attr.baseValue, 0);
    const skillPointsSpent = character.skills.reduce((sum, skill) => sum + skill.level, 0);

    const isAttributesValid = attributePointsSpent <= world.settings.attributePointPool;
    const isSkillsValid = skillPointsSpent <= world.settings.skillPointPool;

    return isAttributesValid && isSkillsValid;
  }, [character, world]);

  // Handle saving all character changes
  const handleSave = async () => {
    if (!character || !isPoolValid) return;
    
    setSaving(true);
    try {
      const { updateCharacter } = useCharacterStore.getState();
      updateCharacter(characterId, character);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push(`/characters/${characterId}`);
    } catch (err) {
      setError('Failed to save character');
      console.error('Error saving character:', err);
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancel = () => {
    router.push(`/characters/${characterId}`);
  };
  
  const handleDelete = () => {
    useCharacterStore.getState().deleteCharacter(characterId);
    router.push('/characters');
  };
  
  const handleGeneratePortrait = async (customDescription?: string) => {
    if (!character || !world) return;
    
    setGeneratingPortrait(true);
    try {
      const response = await fetch('/api/generate-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: { ...character, id: characterId },
          world: world,
          customDescription: customDescription
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate portrait');
      }

      const { portrait } = await response.json();
      
      setCharacter({ ...character, portrait });
      useCharacterStore.getState().updateCharacter(characterId, { portrait });
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
    <div className="component-character-editor space-y-6">
      <CollapsibleSection title="Character Portrait" initiallyExpanded={false} className="bg-background">
        <PortraitSection
          portrait={character.portrait}
          characterName={character.name}
          generatingPortrait={generatingPortrait}
          onGeneratePortrait={handleGeneratePortrait}
          onRemovePortrait={() => setCharacter({ ...character, portrait: undefined })}
        />
      </CollapsibleSection>
      
      <CollapsibleSection title="Basic Information" initiallyExpanded={true} className="bg-background">
        <BasicInfoForm
          name={character.name}
          level={character.level}
          isPlayer={character.isPlayer}
          onNameChange={(name) => setCharacter({ ...character, name })}
          onLevelChange={(level) => setCharacter({ ...character, level })}
          onPlayerTypeChange={(isPlayer) => setCharacter({ ...character, isPlayer })}
        />
      </CollapsibleSection>
      
      <CollapsibleSection title="Background" initiallyExpanded={false} className="bg-background">
        <BackgroundForm
          background={character.background}
          onBackgroundChange={(background) => setCharacter({ 
            ...character, 
            background: { ...character.background, ...background }
          })}
        />
      </CollapsibleSection>
      
      <CollapsibleSection title="Attributes" initiallyExpanded={false} className="bg-background">
        <AttributesForm
          attributes={character.attributes.map(attr => ({ attributeId: attr.id, value: attr.baseValue }))}
          world={world}
          onAttributesChange={(formAttributes) => {
            const updatedAttributes = character.attributes.map(attr => {
              const formAttr = formAttributes.find(fa => fa.attributeId === attr.id);
              return formAttr ? { ...attr, baseValue: formAttr.value, modifiedValue: formAttr.value } : attr;
            });
            setCharacter({ ...character, attributes: updatedAttributes });
          }}
        />
      </CollapsibleSection>
      
      <CollapsibleSection title="Skills" initiallyExpanded={false} className="bg-background">
        <SkillsForm
          skills={character.skills.map(skill => ({
            skillId: skill.id,
            level: skill.level,
            experience: 0,
            isActive: true
          }))}
          world={world}
          onSkillsChange={(formSkills) => {
            const updatedSkills = character.skills.map(skill => {
              const formSkill = formSkills.find(fs => fs.skillId === skill.id);
              return formSkill ? { ...skill, level: formSkill.level } : skill;
            });
            setCharacter({ ...character, skills: updatedSkills });
          }}
        />
      </CollapsibleSection>
      
      <div className="flex justify-between pt-6 border-t border-border">
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={saving}>
          Delete Character
        </Button>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !isPoolValid}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      
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
