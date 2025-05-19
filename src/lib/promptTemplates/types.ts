/**
 * Enum for different prompt template types
 */
export enum PromptType {
  CHARACTER = 'CHARACTER',
  WORLD = 'WORLD',
  NARRATIVE = 'NARRATIVE',
  DIALOGUE = 'DIALOGUE',
  QUEST = 'QUEST',
  NarrativeGeneration = 'NARRATIVE_GENERATION'
}

/**
 * Interface for template variables
 */
export interface PromptVariable {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

/**
 * Interface for prompt templates
 */
export interface PromptTemplate {
  id: string;
  name?: string;
  type: PromptType;
  content: string;
  variables: PromptVariable[];
  generate?: (context: any) => string;
}

/**
 * Type for variable substitution values
 */
export type VariableValues = Record<string, string>;
