import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { getAIConfig, resolveEffectiveGeminiKey } from '@/lib/ai/config';
import { STANDARD_CATEGORIES } from '@/lib/inventory/categories';
import { truncate } from '@/lib/utils';
import { extractFencedJson, extractJsonObject } from '@/lib/ai/parseJSON';
import { logger } from '@/lib/utils/logger';
import type { StandardInventoryCategory } from '@/types/inventory.types';
import type { ProviderCredential } from './providers/types';

type CategorizationSource = 'ai' | 'fallback';

export interface InventoryCategorizationResult {
  categoryId: StandardInventoryCategory;
  confidence: number;
  rationale?: string;
  model?: string;
  source: CategorizationSource;
}

interface CategorizeInventoryItemInput {
  name: string;
  description?: string;
  context?: Record<string, unknown>;
}

interface AIResponseShape {
  category: StandardInventoryCategory;
  confidence?: number;
  rationale?: string;
}

interface AIBatchEntryShape extends AIResponseShape {
  index: number;
}

const fallbacks: Array<{ keywords: RegExp; category: StandardInventoryCategory }> = [
  { keywords: /(sword|blade|shield|armor|bow|staff|weapon|gear)/i, category: 'equipment' },
  { keywords: /(potion|elixir|herb|salve|scroll|kit|tonic)/i, category: 'consumables' },
  { keywords: /(coin|gem|jewel|treasure|gold|ruby|emerald)/i, category: 'valuables' },
  { keywords: /(map|tome|scroll|letter|parchment|document|notes)/i, category: 'documents' },
  { keywords: /(cloak|ring|amulet|clothing|personal|locket)/i, category: 'personal' },
  { keywords: /(artifact|relic|quest|sigil|key|crystal)/i, category: 'quest-items' },
];

function determineFallbackCategory(name: string, description?: string): InventoryCategorizationResult {
  const text = `${name} ${description ?? ''}`;
  for (const { keywords, category } of fallbacks) {
    if (keywords.test(text)) {
      return {
        categoryId: category,
        confidence: 0.55,
        rationale: 'Keyword-based fallback categorization',
        source: 'fallback',
      };
    }
  }

  return {
    categoryId: 'miscellaneous',
    confidence: 0.4,
    rationale: 'Default fallback categorization',
    source: 'fallback',
  };
}

function parseAIResponse(raw: string): AIResponseShape | null {
  try {
    return JSON.parse(raw) as AIResponseShape;
  } catch (error) {
    logger.debug('InventoryCategorizer', 'Initial AI JSON parse failed', {
      error,
      preview: truncate(raw, 150),
    });

    const fenced = extractFencedJson(raw);
    if (fenced) {
      try {
        return JSON.parse(fenced) as AIResponseShape;
      } catch (blockError) {
        logger.debug('InventoryCategorizer', 'Failed to parse AI code block', {
          error: blockError,
          preview: truncate(fenced, 150),
        });
        return null;
      }
    }

    const jsonLike = extractJsonObject(raw);
    if (jsonLike) {
      try {
        return JSON.parse(jsonLike) as AIResponseShape;
      } catch (fallbackError) {
        logger.debug('InventoryCategorizer', 'Failed to parse AI JSON fallback', {
          error: fallbackError,
          preview: truncate(jsonLike, 150),
        });
        return null;
      }
    }

    return null;
  }
}

async function categorizeInventoryItem(
  input: CategorizeInventoryItemInput,
  credential?: ProviderCredential | null,
  model?: string | null
): Promise<InventoryCategorizationResult> {
  const config = getAIConfig();
  const effectiveKey =
    credential && typeof credential === 'object'
      ? credential.apiKey
      : resolveEffectiveGeminiKey(credential);
  const effectiveModel =
    credential && typeof credential === 'object' ? credential.model : model ?? config.modelName;
  const baseLogContext = {
    name: input.name,
    description: truncate(input.description ?? '', 100),
  };

  if (!effectiveKey) {
    logger.warn('InventoryCategorizer', 'No GEMINI_API_KEY configured, using fallback categorization', baseLogContext);
    return determineFallbackCategory(input.name, input.description);
  }

  try {
    const client = createDefaultGeminiClient(credential, model);

    const prompt = `You are an expert inventory categorizer for a narrative RPG.
Choose exactly one category from the following list and respond with JSON only.
Categories: ${STANDARD_CATEGORIES.join(', ')}.

Return JSON in the shape: {"category":"equipment","confidence":0.9,"rationale":"Reason"}
- confidence must be between 0 and 1.
- Pick the category that best fits based on the item name and description.
- Do not include any additional explanation outside JSON.

Item Name: ${input.name}
Item Description: ${input.description ?? 'n/a'}
Additional Context: ${input.context ? JSON.stringify(input.context) : 'none'}
`;

    const response = await client.generateContent(prompt);
    const parsed = parseAIResponse(response.content);

    if (!parsed || !STANDARD_CATEGORIES.includes(parsed.category)) {
      logger.warn('InventoryCategorizer', 'AI response invalid, using fallback', {
        ...baseLogContext,
        raw: truncate(response.content, 200),
      });
      return determineFallbackCategory(input.name, input.description);
    }

    return {
      categoryId: parsed.category,
      confidence: Math.min(Math.max(parsed.confidence ?? 0.8, 0), 1),
      rationale: parsed.rationale,
      model: effectiveModel,
      source: 'ai',
    };
  } catch (error) {
    logger.error('InventoryCategorizer', 'AI categorization failed', error);
    return determineFallbackCategory(input.name, input.description);
  }
}

function parseAIBatchResponse(raw: string): AIBatchEntryShape[] | null {
  const match = raw.match(/\[[\s\S]*\]/);
  const candidate = match ? match[0] : raw;

  try {
    const parsed = JSON.parse(candidate);
    return Array.isArray(parsed) ? (parsed as AIBatchEntryShape[]) : null;
  } catch (error) {
    logger.debug('InventoryCategorizer', 'Batch AI JSON parse failed', {
      error,
      preview: truncate(raw, 200),
    });
    return null;
  }
}

/**
 * Categorizes multiple items in a single AI call. Items that cannot be matched
 * back to a valid AI result fall back to keyword-based categorization, so a
 * partial or malformed batch response never blocks item acquisition.
 */
export async function categorizeInventoryItems(
  inputs: CategorizeInventoryItemInput[],
  credential?: ProviderCredential | null,
  model?: string | null
): Promise<InventoryCategorizationResult[]> {
  if (inputs.length === 0) {
    return [];
  }

  if (inputs.length === 1) {
    return [await categorizeInventoryItem(inputs[0], credential, model)];
  }

  const config = getAIConfig();
  const effectiveKey =
    credential && typeof credential === 'object'
      ? credential.apiKey
      : resolveEffectiveGeminiKey(credential);
  const effectiveModel =
    credential && typeof credential === 'object' ? credential.model : model ?? config.modelName;

  if (!effectiveKey) {
    logger.warn(
      'InventoryCategorizer',
      'No GEMINI_API_KEY configured, using fallback categorization for batch',
      { count: inputs.length }
    );
    return inputs.map((input) => determineFallbackCategory(input.name, input.description));
  }

  try {
    const client = createDefaultGeminiClient(credential, model);

    const itemList = inputs
      .map(
        (input, index) =>
          `${index}. Name: ${input.name} | Description: ${input.description ?? 'n/a'}`
      )
      .join('\n');

    const prompt = `You are an expert inventory categorizer for a narrative RPG.
For each numbered item below, choose exactly one category from this list: ${STANDARD_CATEGORIES.join(', ')}.

Respond with JSON only - an array with one entry per item in this shape:
[{"index":0,"category":"equipment","confidence":0.9,"rationale":"Reason"}]
- index must match the item number below.
- confidence must be between 0 and 1.
- Do not include any text outside the JSON array.

Items:
${itemList}
`;

    const response = await client.generateContent(prompt);
    const parsed = parseAIBatchResponse(response.content);

    if (!parsed) {
      logger.warn('InventoryCategorizer', 'Batch AI response invalid, using fallback', {
        count: inputs.length,
        raw: truncate(response.content, 200),
      });
      return inputs.map((input) => determineFallbackCategory(input.name, input.description));
    }

    const byIndex = new Map<number, AIBatchEntryShape>();
    for (const entry of parsed) {
      if (entry && typeof entry.index === 'number') {
        byIndex.set(entry.index, entry);
      }
    }

    return inputs.map((input, index) => {
      const entry = byIndex.get(index);
      if (entry && STANDARD_CATEGORIES.includes(entry.category)) {
        return {
          categoryId: entry.category,
          confidence: Math.min(Math.max(entry.confidence ?? 0.8, 0), 1),
          rationale: entry.rationale,
          model: effectiveModel,
          source: 'ai',
        };
      }
      return determineFallbackCategory(input.name, input.description);
    });
  } catch (error) {
    logger.error('InventoryCategorizer', 'Batch AI categorization failed', error);
    return inputs.map((input) => determineFallbackCategory(input.name, input.description));
  }
}
