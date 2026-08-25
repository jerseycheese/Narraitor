import type { World } from './world.types';
import type { Character } from './character.types';
import type { NarrativeContext } from './session.types';

// AI Testing Configuration
export interface AITestConfig {
  worldOverride?: Partial<World>;
  characterOverride?: Partial<Character>;
  narrativeContext?: Partial<NarrativeContext>;
  templateId?: string;
  customVariables?: Record<string, string>;
  expectedOutput?: string;
}

// AI Response format
export interface AIResponse {
  text: string;
  choices?: string[];
  metadata?: Record<string, unknown>;
}
