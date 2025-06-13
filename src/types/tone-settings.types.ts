/**
 * Content rating levels for narrative content
 */
export type ContentRating = 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';

/**
 * Narrative style options for tone control
 */
export type NarrativeStyle = 
  | 'serious' 
  | 'humorous' 
  | 'dramatic' 
  | 'lighthearted' 
  | 'mysterious' 
  | 'action-packed' 
  | 'contemplative' 
  | 'epic'
  | 'balanced';

/**
 * Language complexity levels
 */
export type LanguageComplexity = 'simple' | 'moderate' | 'advanced' | 'literary';

/**
 * Comprehensive tone settings for narrative generation
 */
export interface ToneSettings {
  /** Content rating that determines mature content filtering */
  contentRating: ContentRating;
  
  /** Overall narrative style and mood */
  narrativeStyle: NarrativeStyle;
  
  /** Language complexity and vocabulary level */
  languageComplexity: LanguageComplexity;
  
  /** Custom instructions for specific tone requirements */
  customInstructions?: string;
}

/**
 * Default tone settings for new worlds
 */
export const DEFAULT_TONE_SETTINGS: ToneSettings = {
  contentRating: 'PG',
  narrativeStyle: 'balanced',
  languageComplexity: 'moderate'
};

/**
 * Content rating descriptions for UI guidance
 */
export const CONTENT_RATING_DESCRIPTIONS: Record<ContentRating, string> = {
  'G': 'General audiences - No mature content',
  'PG': 'Parental guidance - Mild themes and language',
  'PG-13': 'Parents strongly cautioned - Moderate themes, some violence',
  'R': 'Restricted - Strong themes, violence, adult language',
  'NC-17': 'Adults only - Explicit content, graphic themes'
};

/**
 * Narrative style descriptions for UI guidance
 */
export const NARRATIVE_STYLE_DESCRIPTIONS: Record<NarrativeStyle, string> = {
  'serious': 'Mature, thoughtful tone with gravitas',
  'humorous': 'Light-hearted with comedic elements',
  'dramatic': 'Intense, emotional storytelling',
  'lighthearted': 'Cheerful and optimistic approach',
  'mysterious': 'Suspenseful with hidden elements',
  'action-packed': 'Fast-paced with exciting sequences',
  'contemplative': 'Reflective and philosophical',
  'epic': 'Grand scale with heroic themes',
  'balanced': 'Moderate tone adapting to context'
};

/**
 * Language complexity descriptions for UI guidance
 */
export const LANGUAGE_COMPLEXITY_DESCRIPTIONS: Record<LanguageComplexity, string> = {
  'simple': 'Clear, accessible language for all readers',
  'moderate': 'Standard vocabulary with some complexity',
  'advanced': 'Rich vocabulary and complex sentence structures',
  'literary': 'Sophisticated language with artistic expression'
};