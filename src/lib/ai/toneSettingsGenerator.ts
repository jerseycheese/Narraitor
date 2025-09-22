import { AIClient } from './types';
import { ContentRating, NarrativeStyle, LanguageComplexity } from '@/types/tone-settings.types';
import { World } from '@/types/world.types';
import { logger } from '@/lib/utils/logger';

/**
 * World data subset used for tone analysis
 */
export interface WorldAnalysisData {
  name: string;
  description: string;
  genre: string;
  reference?: string;
  relationship?: 'set_within' | 'inspired_by';
}

/**
 * Result of AI tone settings analysis
 */
export interface ToneAnalysisResult {
  contentRating: ContentRating;
  narrativeStyle: NarrativeStyle;
  languageComplexity: LanguageComplexity;
  reasoning: string;
}

/**
 * Service for AI-generated tone settings based on world analysis
 */
export class ToneSettingsGenerator {
  constructor(private client: AIClient) {}

  /**
   * Analyze world data and generate appropriate tone settings
   */
  async generateToneSettings(worldData: WorldAnalysisData): Promise<ToneAnalysisResult> {
    const prompt = this.buildAnalysisPrompt(worldData);

    try {
      const response = await this.client.generateContent(prompt);

      if (!response.content) {
        throw new Error('AI service returned empty response');
      }

      return this.parseResponse(response.content);
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to generate AI tone settings:', {
          message: error.message,
          worldData: { name: worldData.name, genre: worldData.genre }
        });

        // Provide more specific error messages based on error type
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          throw new Error('AI service is currently busy. Please try again in a moment.');
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          throw new Error('Network error occurred. Please check your connection and try again.');
        } else if (error.message.includes('No JSON found') || error.message.includes('Unable to parse')) {
          throw new Error('AI response was invalid. Please try generating again.');
        } else if (error.message.startsWith('Invalid ') || error.message.startsWith('Missing ') || error.message.includes('empty response')) {
          // Re-throw validation errors and empty response errors as-is
          throw error;
        } else {
          throw new Error('Unable to generate tone settings. Please try again or set them manually.');
        }
      } else {
        logger.error('Unknown error generating AI tone settings:', error);
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  }

  /**
   * Build the prompt for tone analysis
   */
  private buildAnalysisPrompt(worldData: WorldAnalysisData): string {
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

  /**
   * Parse AI response into structured tone settings
   */
  private parseResponse(content: string): ToneAnalysisResult {
    try {
      // Handle empty response
      if (!content || content.trim() === '') {
        throw new Error('AI service returned empty response');
      }

      // Extract JSON from response (handle cases where AI adds extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate the response structure
      this.validateParsedResponse(parsed);

      return {
        contentRating: parsed.contentRating as ContentRating,
        narrativeStyle: parsed.narrativeStyle as NarrativeStyle,
        languageComplexity: parsed.languageComplexity as LanguageComplexity,
        reasoning: parsed.reasoning
      };
    } catch (error) {
      // Re-throw validation errors and empty response errors as-is
      if (error instanceof Error && (
        error.message.startsWith('Invalid ') ||
        error.message.startsWith('Missing ') ||
        error.message.includes('empty response')
      )) {
        throw error;
      }

      logger.error('Failed to parse AI tone settings response:', error);
      throw new Error('Unable to parse AI response. Please try again.');
    }
  }

  /**
   * Validate that parsed response contains valid values
   */
  private validateParsedResponse(parsed: unknown): void {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Response must be an object');
    }

    const response = parsed as Record<string, unknown>;

    const validContentRatings: ContentRating[] = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
    const validNarrativeStyles: NarrativeStyle[] = [
      'serious', 'humorous', 'dramatic', 'lighthearted', 'mysterious',
      'action-packed', 'contemplative', 'epic', 'balanced'
    ];
    const validLanguageComplexities: LanguageComplexity[] = ['simple', 'moderate', 'advanced', 'literary'];

    if (!validContentRatings.includes(response.contentRating as ContentRating)) {
      throw new Error(`Invalid content rating: ${response.contentRating}`);
    }

    if (!validNarrativeStyles.includes(response.narrativeStyle as NarrativeStyle)) {
      throw new Error(`Invalid narrative style: ${response.narrativeStyle}`);
    }

    if (!validLanguageComplexities.includes(response.languageComplexity as LanguageComplexity)) {
      throw new Error(`Invalid language complexity: ${response.languageComplexity}`);
    }

    if (!response.reasoning || typeof response.reasoning !== 'string') {
      throw new Error('Missing or invalid reasoning in response');
    }
  }
}

/**
 * Extract world analysis data from a full World object
 */
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