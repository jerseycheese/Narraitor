import { EntityID } from '@/types/common.types';
import type { CharacterCreationData } from '@/hooks/useCharacterCreationWizard';
import type { WizardValidation } from '@/hooks/useWizardState';

// Draft auto-save (useDraftAutoSave) configuration for character creation.

export function getCharacterDraftStorageKey(worldId: EntityID): string {
  return `character-creation-${worldId}`;
}

export interface CharacterCreationDraft {
  currentStep: number;
  worldId: EntityID;
  characterData: Partial<CharacterCreationData>;
  validation?: Record<number, WizardValidation>;
  lastSaved?: string;
}

export interface CharacterDraftRecoveryPreview {
  name?: string;
  currentStep?: number;
  lastSaved?: string;
  hasAttributes?: boolean;
  hasSkills?: boolean;
  hasBackground?: boolean;
  selectedSkillCount?: number;
  totalAttributePoints?: number;
}

/** Validates that a parsed localStorage value has the shape of a character creation draft. */
export function isValidCharacterDraft(value: unknown): value is CharacterCreationDraft {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CharacterCreationDraft>;
  return typeof candidate.currentStep === 'number' && typeof candidate.worldId === 'string';
}

function hasBackgroundData(background: Partial<CharacterCreationData['background']>): boolean {
  return !!(
    background.history ||
    background.personality ||
    background.motivation ||
    (Array.isArray(background.goals) && background.goals.length > 0)
  );
}

/** Builds a lightweight preview of a restored character draft, for the recovery dialog. */
export function analyzeCharacterDraftRecovery(
  draft: CharacterCreationDraft
): CharacterDraftRecoveryPreview {
  const preview: CharacterDraftRecoveryPreview = {
    currentStep: draft.currentStep,
    lastSaved: draft.lastSaved,
  };

  const characterData = draft.characterData;
  if (!characterData) {
    return preview;
  }

  if (typeof characterData.name === 'string') {
    preview.name = characterData.name;
  }

  if (Array.isArray(characterData.attributes)) {
    preview.hasAttributes = characterData.attributes.length > 0;
    preview.totalAttributePoints = characterData.attributes.reduce(
      (sum, attr) => sum + (Number(attr?.value) || 0),
      0
    );
  }

  if (Array.isArray(characterData.skills)) {
    const selectedSkills = characterData.skills.filter(
      (skill) => skill?.isSelected
    );
    preview.hasSkills = selectedSkills.length > 0;
    preview.selectedSkillCount = selectedSkills.length;
  }

  if (characterData.background && typeof characterData.background === 'object') {
    preview.hasBackground = hasBackgroundData(characterData.background);
  }

  return preview;
}

/** Whether a character draft has meaningful data that recovering would overwrite. */
export function hasCharacterDraftData(draft: CharacterCreationDraft | undefined): boolean {
  if (!draft || !draft.characterData) return false;

  const characterData = draft.characterData;

  const hasAttributePoints =
    Array.isArray(characterData.attributes) &&
    characterData.attributes.some(
      (attr) => Number(attr?.value || 0) > Number(attr?.minValue || 0)
    );

  const hasSelectedSkill =
    Array.isArray(characterData.skills) &&
    characterData.skills.some((skill) => skill?.isSelected);

  const background =
    characterData.background && typeof characterData.background === 'object'
      ? characterData.background
      : null;

  return !!(
    characterData.name ||
    hasAttributePoints ||
    hasSelectedSkill ||
    (background && hasBackgroundData(background))
  );
}
