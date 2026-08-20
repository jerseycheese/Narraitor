/**
 * Debug Information Builder for Narrative Generation
 *
 * Captures all the context and factors that contributed to generating narrative text.
 * This is used for development/debugging purposes only.
 */

import { PromptDebugInfo } from '@/types/narrative.types';
import { EntityID } from '@/types/common.types';
import { World } from '@/types/world.types';
import { ToneSettings } from '@/types/tone-settings.types';

import Logger from '@/lib/utils/logger';
const logger = new Logger('DebugInfoBuilder');

export interface DebugInfoContext {
  fullPrompt: string;
  templateName: string;
  world: World;
  toneSettings?: ToneSettings;
  loreContext?: string;
  characterIds?: EntityID[];
  recentDecisions?: Array<{
    decisionText: string;
    selectedOption: string;
    timestamp: Date;
  }>;
  previousSegmentContent?: string;
  previousSegmentType?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  modelUsed: string;
}

/**
 * Builds PromptDebugInfo from the context used during narrative generation
 */
export function buildPromptDebugInfo(context: DebugInfoContext): PromptDebugInfo {
  // Extract lore context entries
  const loreEntries = extractLoreEntries(context.loreContext || '');

  // Extract active goals from the full prompt
  const activeGoals = extractActiveGoalsFromPrompt(context.fullPrompt);

  // Build character context
  const characterContext = buildCharacterContext(context.characterIds || []);

  // Extract inventory items from the full prompt
  const inventoryItems = extractInventoryItemsFromPrompt(context.fullPrompt);

  // Build tone settings object
  const toneSettingsInfo = context.toneSettings
    ? {
        mood: context.world.toneSettings?.narrativeStyle || undefined,
        complexity: context.toneSettings.languageComplexity,
        customTone: context.toneSettings.customInstructions || undefined,
      }
    : undefined;

  // Build previous segment context
  const previousSegmentContext =
    context.previousSegmentContent && context.previousSegmentType
      ? {
          type: context.previousSegmentType,
          excerpt: truncateText(context.previousSegmentContent, 200),
        }
      : undefined;

  return {
    fullPrompt: context.fullPrompt,
    templateName: context.templateName,
    loreContext: loreEntries.length > 0 ? loreEntries : undefined,
    activeGoals: activeGoals.length > 0 ? activeGoals : undefined,
    characterContext: characterContext.length > 0 ? characterContext : undefined,
    inventoryContext: inventoryItems.length > 0 ? inventoryItems : undefined,
    toneSettings: toneSettingsInfo,
    recentDecisions: context.recentDecisions && context.recentDecisions.length > 0 ? context.recentDecisions : undefined,
    previousSegmentContext,
    tokenUsage: context.tokenUsage,
    modelUsed: context.modelUsed,
    generatedAt: new Date(),
  };
}

function extractLoreEntries(loreContext: string): Array<{
  loreId: EntityID;
  title: string;
  excerpt: string;
}> {
  const entries: Array<{
    loreId: EntityID;
    title: string;
    excerpt: string;
  }> = [];

  // Parse lore context - it typically contains formatted lore entries
  // Format: "LORE CONTEXT:\n\nTitle: <title>\n<content>\n\n..."
  const loreMatches = loreContext.matchAll(/(?:Title|###)\s*:\s*([^\n]+)\n([^\n]+(?:\n[^\n]+)*?)(?=\n\n|$)/gi);

  let index = 0;
  for (const match of loreMatches) {
    const title = match[1].trim();
    const content = match[2].trim();

    entries.push({
      loreId: `lore-${index}` as EntityID,
      title,
      excerpt: truncateText(content, 150),
    });
    index++;
  }

  return entries;
}

function extractActiveGoalsFromPrompt(fullPrompt: string): string[] {
  const goals: string[] = [];

  // Find the goals section in the prompt
  const goalsMatch = fullPrompt.match(/CURRENT NARRATIVE GOALS:([\s\S]*?)(?=\n\n[A-Z]|$)/);
  if (!goalsMatch) {
    return goals;
  }

  const goalSection = goalsMatch[1];
  const goalLines = goalSection.split('\n').filter((line) => line.trim());

  for (const line of goalLines) {
    const cleaned = line.trim().replace(/^[-*•\d.]+\s*/, ''); // Remove bullet points or numbers
    if (cleaned && cleaned !== 'Please consider these goals when generating the narrative content.') {
      goals.push(cleaned);
    }
  }

  return goals;
}

/**
 * Build character context from character IDs
 * @todo Add world parameter when implementing full character context lookup
 */
function buildCharacterContext(
  characterIds: EntityID[]
): Array<{
  characterId: EntityID;
  name: string;
  relevantTraits?: string[];
}> {
  // For now, just return basic character info
  // In a full implementation, this would query the character store and use world data
  return characterIds.map((id) => ({
    characterId: id,
    name: `Character ${id}`,
    relevantTraits: [],
  }));
}

function extractInventoryItemsFromPrompt(fullPrompt: string): Array<{
  itemName: string;
  isEquipped?: boolean;
}> {
  const items: Array<{
    itemName: string;
    isEquipped?: boolean;
  }> = [];

  // Find the inventory section in the prompt
  // Match until we hit a double newline followed by a major section header (all caps + CONTEXT/GOALS), or end of string
  const inventoryMatch = fullPrompt.match(/INVENTORY CONTEXT:([\s\S]*?)(?=\n\n[A-Z\s]+(CONTEXT|GOALS):|$)/);
  if (!inventoryMatch) {
    return items;
  }

  const inventorySection = inventoryMatch[1];
  const lines = inventorySection.split('\n');
  let isEquippedSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.toUpperCase().includes('EQUIPPED')) {
      isEquippedSection = true;
      continue;
    } else if (trimmed.toUpperCase().includes('INVENTORY')) {
      isEquippedSection = false;
      continue;
    }

    const itemMatch = trimmed.match(/^[-*•]\s*(.+)/);
    if (itemMatch) {
      items.push({
        itemName: itemMatch[1].trim(),
        isEquipped: isEquippedSection,
      });
    }
  }

  return items;
}

/**
 * Truncate text to a maximum length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

export function isDebugInfoEnabled(): boolean {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Check DevTools settings from localStorage
    try {
      const stored = localStorage.getItem('narraitor-devtools-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        // If user has explicitly enabled debug info, return true regardless of NODE_ENV
        if (settings.showPromptDebugInfo === true) {
          return true;
        }
      }
    } catch (error) {
      logger.warn('Failed to check DevTools settings:', error);
    }
  }

  // Fallback: only enable in development mode
  if (typeof process !== 'undefined') {
    return process.env.NODE_ENV === 'development';
  }
  return false;
}
