/**
 * Enum for different prompt template types
 */
export enum PromptType {
  NARRATIVE = 'NARRATIVE',
  NarrativeGeneration = 'NARRATIVE_GENERATION'
}

/**
 * Interface for template variables
 */
interface PromptVariable {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

/**
 * Interface for prompt templates.
 *
 * `generate` takes a context bag whose shape varies per template. We use
 * `any` here so individually-typed contexts (e.g. PlayerChoiceTemplateContext)
 * remain assignable. Each template documents the shape it expects.
 */
export interface PromptTemplate {
  id: string;
  name?: string;
  type: PromptType;
  content: string;
  variables: PromptVariable[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- context shape varies per template; see template files for expected fields
  generate?: (context: any) => string;
}
