import { AIClient } from './types';
import { ContentRating, NarrativeStyle, LanguageComplexity } from '@/types/tone-settings.types';
import { World } from '@/types/world.types';
import { logger } from '@/lib/utils/logger';
import { extractJsonObject } from './parseJSON';

export interface WorldAnalysisData {
  name: string;
  description: string;
  genre: string;
  reference?: string;
  relationship?: 'set_within' | 'inspired_by';
}

export interface ToneAnalysisResult {
  contentRating: ContentRating;
  narrativeStyle: NarrativeStyle;
  languageComplexity: LanguageComplexity;
  reasoning: string;
}

const VALID_CONTENT_RATINGS: ContentRating[] = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
const VALID_NARRATIVE_STYLES: NarrativeStyle[] = [
  'serious', 'humorous', 'dramatic', 'lighthearted', 'mysterious',
  'action-packed', 'contemplative', 'epic', 'balanced'
];
const VALID_LANGUAGE_COMPLEXITIES: LanguageComplexity[] = ['simple', 'moderate', 'advanced', 'literary'];

function buildAnalysisPrompt(worldData: WorldAnalysisData): string {
  return `Analyze this fictional world and recommend appropriate tone settings for AI-generated narrative content.

WORLD INFORMATION:
Name: ${worldData.name}
Genre: ${worldData.genre}
Description: ${worldData.description}
${worldData.reference ? `Reference Material: ${worldData.reference}` : ''}
${worldData.relationship ? `Relationship to Reference: ${worldData.relationship}` : ''}

ANALYSIS TASK:
Based on the world's genre, themes, content, and overall atmosphere, recommend the most appropriate settings for:

1. CONTENT RATING (choose one):
   - G: General audiences - No mature content
   - PG: Parental guidance - Mild themes and language
   - PG-13: Parents strongly cautioned - Moderate themes, some violence
   - R: Restricted - Strong themes, violence, adult language
   - NC-17: Adults only - Explicit content, graphic themes

2. NARRATIVE STYLE (choose one):
   - serious: Mature, thoughtful tone with gravitas
   - humorous: Light-hearted with comedic elements
   - dramatic: Intense, emotional storytelling
   - lighthearted: Cheerful and optimistic approach
   - mysterious: Suspenseful with hidden elements
   - action-packed: Fast-paced with exciting sequences
   - contemplative: Reflective and philosophical
   - epic: Grand scale with heroic themes
   - balanced: Moderate tone adapting to context

3. LANGUAGE COMPLEXITY (choose one):
   - simple: Clear, accessible language for all readers
   - moderate: Standard vocabulary with some complexity
   - advanced: Rich vocabulary and complex sentence structures
   - literary: Sophisticated language with artistic expression

REQUIRED OUTPUT FORMAT:
Return your analysis in this exact JSON format:

{
  "contentRating": "chosen_rating",
  "narrativeStyle": "chosen_style",
  "languageComplexity": "chosen_complexity",
  "reasoning": "Brief explanation of your choices based on the world's genre, themes, and intended audience"
}

Consider the world's genre conventions, target audience, thematic content, and the type of narrative experience that would best serve this setting. Your reasoning should be 2-3 sentences explaining why these specific settings match the world.`;
}

function validateParsedResponse(parsed: unknown): void {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Response must be an object');
  }

  const response = parsed as Record<string, unknown>;

  if (!VALID_CONTENT_RATINGS.includes(response.contentRating as ContentRating)) {
    throw new Error(`Invalid content rating: ${response.contentRating}`);
  }

  if (!VALID_NARRATIVE_STYLES.includes(response.narrativeStyle as NarrativeStyle)) {
    throw new Error(`Invalid narrative style: ${response.narrativeStyle}`);
  }

  if (!VALID_LANGUAGE_COMPLEXITIES.includes(response.languageComplexity as LanguageComplexity)) {
    throw new Error(`Invalid language complexity: ${response.languageComplexity}`);
  }

  if (!response.reasoning || typeof response.reasoning !== 'string') {
    throw new Error('Missing or invalid reasoning in response');
  }
}

function parseResponse(content: string): ToneAnalysisResult {
  try {
    if (!content || content.trim() === '') {
      throw new Error('The model provider returned an empty response');
    }

    const jsonStr = extractJsonObject(content);
    if (jsonStr === null) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonStr);
    validateParsedResponse(parsed);

    return {
      contentRating: parsed.contentRating as ContentRating,
      narrativeStyle: parsed.narrativeStyle as NarrativeStyle,
      languageComplexity: parsed.languageComplexity as LanguageComplexity,
      reasoning: parsed.reasoning
    };
  } catch (error) {
    if (error instanceof Error && (
      error.message.startsWith('Invalid ') ||
      error.message.startsWith('Missing ') ||
      error.message.includes('empty response')
    )) {
      throw error;
    }

    logger.error('Failed to parse AI tone settings response:', error);
    throw new Error("That response came back unreadable. Try again.");
  }
}

export async function generateToneSettings(
  client: AIClient,
  worldData: WorldAnalysisData
): Promise<ToneAnalysisResult> {
  try {
    const response = await client.generateContent(buildAnalysisPrompt(worldData));

    if (!response.content) {
      throw new Error('The model provider returned an empty response');
    }

    return parseResponse(response.content);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to generate AI tone settings:', {
        message: error.message,
        worldData: { name: worldData.name, genre: worldData.genre }
      });

      if (error.message.includes('rate limit') || error.message.includes('429')) {
        throw new Error('The model provider is busy. Try again in a moment.');
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        throw new Error("Couldn't reach the model provider. Check your connection, then try again.");
        // Matches what parseResponse() throws above — keep the two in step.
      } else if (error.message.includes('No JSON found') || error.message.includes('came back unreadable')) {
        throw new Error("That response came back unreadable. Try again.");
      } else if (error.message.startsWith('Invalid ') || error.message.startsWith('Missing ') || error.message.includes('empty response')) {
        throw error;
      } else {
        throw new Error("Couldn't generate tone settings. Try again, or set them manually.");
      }
    } else {
      logger.error('Unknown error generating AI tone settings:', error);
      throw new Error("Couldn't generate tone settings. Try again in a moment.");
    }
  }
}

export function extractWorldAnalysisData(world: Partial<World>): WorldAnalysisData {
  if (!world.name || !world.description || !world.genre) {
    throw new Error('World must have name, description, and genre for tone analysis');
  }

  return {
    name: world.name,
    description: world.description,
    genre: world.genre,
    reference: world.reference,
    relationship: world.relationship
  };
}
