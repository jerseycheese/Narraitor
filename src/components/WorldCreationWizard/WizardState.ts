// WizardState.ts
import { World } from '@/types/world.types';
import { SkillDifficulty } from '@/lib/constants/skillDifficultyLevels';
import { AIGuidanceSource } from '@/lib/constants/worldGuidance';

export interface AttributeSuggestion {
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  baseValue: number;
  category?: string;
  accepted: boolean;
}

export interface SkillSuggestion {
  name: string;
  description: string;
  difficulty: SkillDifficulty;
  category?: string;
  linkedAttributeNames?: string[]; // Support for multiple attributes
  accepted: boolean;
  baseValue: number;
  minValue: number;
  maxValue: number;
}

export const WIZARD_STEPS = [
  { id: 'basic-info', label: 'Basic Information' },
  { id: 'description', label: 'World Description' },
  { id: 'attributes', label: 'Review Attributes' },
  { id: 'skills', label: 'Review Skills' },
  { id: 'finalize', label: 'Finalize' },
];

// Draft auto-save (useDraftAutoSave) configuration for world creation.

export const WORLD_DRAFT_STORAGE_KEY = 'world-creation-draft';

export interface WorldCreationData extends Partial<World> {
  aiSuggestions?: {
    attributes: AttributeSuggestion[];
    skills: SkillSuggestion[];
  };
  aiSuggestionsGenerated?: boolean;
  worldType?: 'original' | 'inspired_by' | 'set_within';
  createdWorldId?: string;
  aiSuggestionMeta?: {
    source: AIGuidanceSource;
    generatedAt?: string;
    descriptionSnapshot?: string;
  };
}

export interface WorldCreationDraft {
  currentStep: number;
  worldData: WorldCreationData;
  lastSaved?: string;
}

export interface WorldDraftRecoveryPreview {
  name?: string;
  genre?: string;
  description?: string;
  currentStep?: number;
  lastSaved?: string;
  hasAttributes?: boolean;
  hasSkills?: boolean;
  attributeCount?: number;
  skillCount?: number;
}

/** Validates that a parsed localStorage value has the shape of a world creation draft. */
export function isValidWorldDraft(value: unknown): value is WorldCreationDraft {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<WorldCreationDraft>;
  return (
    typeof candidate.currentStep === 'number' &&
    !!candidate.worldData &&
    typeof candidate.worldData === 'object'
  );
}

/** Builds a lightweight preview of a restored world draft, for the recovery dialog. */
export function analyzeWorldDraftRecovery(draft: WorldCreationDraft): WorldDraftRecoveryPreview {
  const preview: WorldDraftRecoveryPreview = {
    currentStep: draft.currentStep,
    lastSaved: draft.lastSaved,
  };

  const worldData = draft.worldData;
  if (!worldData) {
    return preview;
  }

  if (typeof worldData.name === 'string' && worldData.name.trim()) {
    preview.name = worldData.name;
  }

  if (typeof worldData.genre === 'string' && worldData.genre.trim()) {
    preview.genre = worldData.genre;
  }

  if (typeof worldData.description === 'string' && worldData.description.trim()) {
    preview.description = worldData.description;
  }

  if (Array.isArray(worldData.attributes) && worldData.attributes.length > 0) {
    preview.hasAttributes = true;
    preview.attributeCount = worldData.attributes.length;
  }

  if (Array.isArray(worldData.skills) && worldData.skills.length > 0) {
    preview.hasSkills = true;
    preview.skillCount = worldData.skills.length;
  }

  return preview;
}

/** Whether a world draft has meaningful data that recovering would overwrite. */
export function hasWorldDraftData(draft: WorldCreationDraft | undefined): boolean {
  if (!draft || !draft.worldData) return false;

  const worldData = draft.worldData;

  return !!(
    worldData.name ||
    worldData.genre ||
    worldData.description ||
    (Array.isArray(worldData.attributes) && worldData.attributes.length > 0) ||
    (Array.isArray(worldData.skills) && worldData.skills.length > 0)
  );
}
