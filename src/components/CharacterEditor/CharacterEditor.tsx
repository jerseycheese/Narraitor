import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { LoadingState } from '@/components/ui/LoadingState';
import { PageError } from '@/components/ui/ErrorDisplay';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { PortraitSection } from './components/PortraitSection';
import { BasicInfoForm } from './components/BasicInfoForm';
import { BackgroundForm } from './components/BackgroundForm';
import { AttributesForm } from './components/AttributesForm';
import { SkillsForm } from './components/SkillsForm';
import { generatePortrait } from '@/lib/api/generatePortrait';

import Logger from '@/lib/utils/logger';
const logger = new Logger('CharacterEditor');

// Use the Character type from the store since it's different from the main types
type Character = ReturnType<typeof useCharacterStore.getState>['characters'][string];

interface CharacterEditorProps {
  characterId: string;
}

const CharacterEditor: React.FC<CharacterEditorProps> = ({ characterId }) => {
  const router = useRouter();
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [portraitError, setPortraitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Subscribe to character from store (reactive to hydration)
  const storeCharacter = useCharacterStore((state) => state.characters[characterId]);

  // Load character data - subscribes to store updates, so will update after hydration
  useEffect(() => {
    try {
      if (!storeCharacter) {
        // Still loading or character doesn't exist
        // Don't set error immediately - hydration may not be complete
        setLoading(true);
        return;
      }

      const { worlds } = useWorldStore.getState();
      const worldData = worlds[storeCharacter.worldId];

      if (!worldData) {
        setLoadError('World data not found for this character');
        setLoading(false);
        return;
      }

      // Initialize editing copy from store
      setEditingCharacter(storeCharacter);
      setWorld(worldData);
      setLoadError(null); // Clear any previous errors
      setLoading(false);
    } catch (err) {
      setLoadError("Couldn't load this character. Try refreshing the page.");
      setLoading(false);
      logger.error('Error loading character:', err);
    }
  }, [storeCharacter, characterId]);

  // Timeout to detect if character truly doesn't exist after hydration
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!storeCharacter && loading) {
        setLoadError('Character not found');
        setLoading(false);
      }
    }, 2000); // Wait 2 seconds for hydration

    return () => clearTimeout(timeout);
  }, [storeCharacter, loading]);

  const isPoolValid = useMemo(() => {
    if (!editingCharacter || !world) return true;

    const attributePointsSpent = editingCharacter.attributes.reduce((sum, attr) => sum + attr.baseValue, 0);
    const skillPointsSpent = editingCharacter.skills.reduce((sum, skill) => sum + skill.level, 0);

    const isAttributesValid = attributePointsSpent <= world.settings.attributePointPool;
    const isSkillsValid = skillPointsSpent <= world.settings.skillPointPool;

    return isAttributesValid && isSkillsValid;
  }, [editingCharacter, world]);

  // Handle saving all character changes
  const handleSave = async () => {
    if (!editingCharacter || !isPoolValid) return;

    setSaving(true);
    try {
      const { updateCharacter } = useCharacterStore.getState();
      updateCharacter(characterId, editingCharacter);

      router.push(`/characters/${characterId}`);
    } catch (err) {
      setLoadError("Couldn't save your changes. Try again.");
      logger.error('Error saving character:', err);
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancel = () => {
    router.push(`/characters/${characterId}`);
  };
  
  const handleDelete = async () => {
    await useCharacterStore.getState().deleteCharacter(characterId);
    router.push('/characters');
  };
  
  const handleGeneratePortrait = async (customDescription?: string) => {
    if (!editingCharacter || !world) return;

    setGeneratingPortrait(true);
    setPortraitError(null); // Clear previous portrait errors
    try {
      const { portrait } = await generatePortrait({
        character: editingCharacter,
        world: world,
        customDescription: customDescription,
      });

      // Update both local editing state and store
      setEditingCharacter({ ...editingCharacter, portrait });
      useCharacterStore.getState().updateCharacter(characterId, { portrait });
    } catch (error) {
      logger.error('Failed to generate portrait:', error);
      setPortraitError("Couldn't generate a portrait. Try again in a moment.");
    } finally {
      setGeneratingPortrait(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading character data..." />;
  }

  // Only show full-page error for load errors, not portrait errors
  if (loadError || !editingCharacter || !world) {
    return (
      <PageError
        title="Character Not Found"
        message={loadError || 'The requested character could not be found or loaded.'}
        showRetry={true}
        onRetry={() => router.push('/characters')}
      />
    );
  }
  
  return (
    <div className="component-character-editor">
      <CollapsibleSection title="Character Portrait" initialCollapsed={true} >
        <PortraitSection
          portrait={editingCharacter.portrait}
          characterName={editingCharacter.name}
          generatingPortrait={generatingPortrait}
          onGeneratePortrait={handleGeneratePortrait}
          onRemovePortrait={() => {
            setEditingCharacter({ ...editingCharacter, portrait: undefined });
            useCharacterStore.getState().updateCharacter(characterId, { portrait: undefined });
          }}
          error={portraitError}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Basic Information" >
        <BasicInfoForm
          name={editingCharacter.name}
          level={editingCharacter.level}
          isPlayer={editingCharacter.isPlayer}
          onNameChange={(name) => setEditingCharacter({ ...editingCharacter, name })}
          onLevelChange={(level) => setEditingCharacter({ ...editingCharacter, level })}
          onPlayerTypeChange={(isPlayer) => setEditingCharacter({ ...editingCharacter, isPlayer })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Background" initialCollapsed={true} >
        <BackgroundForm
          background={editingCharacter.background}
          onBackgroundChange={(background) => setEditingCharacter({
            ...editingCharacter,
            background: { ...editingCharacter.background, ...background }
          })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Attributes" initialCollapsed={true} >
        <AttributesForm
          attributes={editingCharacter.attributes.map(attr => ({ attributeId: attr.worldAttributeId || attr.id, value: attr.baseValue }))}
          world={world}
          onAttributesChange={(formAttributes) => {
            const updatedAttributes = editingCharacter.attributes.map(attr => {
              const formAttr = formAttributes.find(fa => fa.attributeId === (attr.worldAttributeId || attr.id));
              return formAttr ? { ...attr, baseValue: formAttr.value, modifiedValue: formAttr.value } : attr;
            });
            setEditingCharacter({ ...editingCharacter, attributes: updatedAttributes });
          }}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Skills" initialCollapsed={true} >
        <SkillsForm
          skills={editingCharacter.skills.map(skill => ({
            skillId: skill.worldSkillId || skill.id,
            level: skill.level,
            experience: 0,
            isActive: true
          }))}
          world={world}
          onSkillsChange={(formSkills) => {
            const updatedSkills = editingCharacter.skills.map(skill => {
              const formSkill = formSkills.find(fs => fs.skillId === (skill.worldSkillId || skill.id));
              return formSkill ? { ...skill, level: formSkill.level } : skill;
            });
            setEditingCharacter({ ...editingCharacter, skills: updatedSkills });
          }}
        />
      </CollapsibleSection>
      
      <div className="character-editor-actions">
        <ActionButtonGroup
          layout="horizontal"
          gap="md"
          actions={[
            {
              label: 'Delete Character',
              onClick: () => setShowDeleteDialog(true),
              variant: 'danger',
              disabled: saving,
            },
            {
              label: 'Cancel',
              onClick: handleCancel,
              variant: 'secondary',
              disabled: saving,
            },
            {
              label: saving ? 'Saving...' : 'Save Changes',
              onClick: handleSave,
              variant: 'primary',
              disabled: saving || !isPoolValid,
            },
          ]}
        />
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Character"
        description={`Are you sure you want to delete "${editingCharacter.name}"? This action cannot be undone.`}
        itemName={editingCharacter.name}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </div>
  );
};

export default CharacterEditor;
