/**
 * Enum for different prompt template types
 */
export enum PromptType {
  CHARACTER = 'CHARACTER',
  WORLD = 'WORLD',
  NARRATIVE = 'NARRATIVE',
  DIALOGUE = 'DIALOGUE',
  QUEST = 'QUEST',
}

/**
 * Interface for template variables
 */
export interface PromptVariable {
  name: string;
  description: string;
}

/**
 * Interface for prompt templates
 */
export interface PromptTemplate {
  id: string;
  type: PromptType;
  content: string;
  variables: PromptVariable[];
}

/**
 * Type for variable substitution values
 */
export type VariableValues = Record<string, string>;
