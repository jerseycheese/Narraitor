/**
 * Type definitions for the World domain
 */

/**
 * World configuration that defines the setting, rules, and parameters
 */
export interface World {
  id: string;
  name: string;
  description: string;
  theme: WorldTheme;
  attributes: AttributeDefinition[];
  skills: SkillDefinition[];
  toneSettings: ToneSettings;
  createdAt: string;
  updatedAt: string;
}

/**
 * Visual theme for a world
 */
export interface WorldTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  imageryStyle: string;
}

/**
 * Definition of an attribute in a world
 */
export interface AttributeDefinition {
  id: string;
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  defaultValue: number;
}

/**
 * Definition of a skill in a world
 */
export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  relatedAttributes: string[]; // IDs of attributes
  minValue: number;
  maxValue: number;
  defaultValue: number;
}

/**
 * Settings for controlling narrative tone and style
 */
export interface ToneSettings {
  narrativeStyle: 'descriptive' | 'concise' | 'dramatic' | 'humorous';
  pacePreference: 'slow' | 'moderate' | 'fast';
  contentRating: 'family' | 'teen' | 'mature';
  thematicElements: string[];
  languageStyle: 'formal' | 'casual' | 'period-appropriate';
}

/**
 * World template for quick creation
 */
export interface WorldTemplate {
  id: string;
  name: string;
  description: string;
  preset: Partial<World>;
}
