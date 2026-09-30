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
  /** Assigned when the review step first sees the suggestion; shared with the saved attribute. */
  id?: string;
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
  /** Assigned when the review step first sees the suggestion; shared with the saved skill. */
  id?: string;
  /** Linked attribute ids, resolved from linkedAttributeNames when the suggestion is first reviewed. */
  attributeIds?: string[];
}

/**
 * Per-world selection limits the wizard seeds into `settings`. The settings
 * values are the source of truth once seeded: worldStore and the world
 * editor enforce them, and the review steps read them back.
 */
export const WIZARD_MAX_ATTRIBUTES = 6;
export const WIZARD_MAX_SKILLS = 12;

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

/**
 * Drops the attributes and skills that came from reviewed AI suggestions,
 * keeping the player's custom ones. Used when suggestions are cleared or
 * regenerated, since those entries no longer have a suggestion behind them.
 */
export function withoutSuggestedEntries(
  data: WorldCreationData
): Pick<WorldCreationData, 'attributes' | 'skills'> {
  // Suggestions without an id come from a draft saved before ids existed;
  // their saved entries can only be recognized by name.
  const isSuggested = (suggestions: { id?: string; name: string }[] = []) => {
    const ids = new Set(suggestions.filter((s) => s.id).map((s) => s.id));
    const legacyNames = new Set(suggestions.filter((s) => !s.id).map((s) => s.name));
    return (entry: { id: string; name: string }) =>
      ids.has(entry.id) || legacyNames.has(entry.name);
  };
  const attributeSuggested = isSuggested(data.aiSuggestions?.attributes);
  const skillSuggested = isSuggested(data.aiSuggestions?.skills);
  return {
    attributes: data.attributes?.filter((a) => !attributeSuggested(a)),
    skills: data.skills?.filter((s) => !skillSuggested(s)),
  };
}

/**
 * Pairs id-less suggestions (from a draft saved before suggestions carried
 * ids) with the saved entries they produced, matched by name the way the
 * old review steps identified them. `remaining` is what's left: the
 * genuinely custom entries.
 */
export function adoptLegacyEntries<
  S extends { id?: string; name: string },
  E extends { id: string; name: string },
>(suggestions: S[], entries: E[]): { adopted: Map<S, E>; remaining: E[] } {
  const adopted = new Map<S, E>();
  let remaining = entries;
  for (const suggestion of suggestions) {
    if (suggestion.id) continue;
    const match = remaining.find((e) => e.name === suggestion.name);
    if (!match) continue;
    adopted.set(suggestion, match);
    remaining = remaining.filter((e) => e !== match);
  }
  return { adopted, remaining };
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
