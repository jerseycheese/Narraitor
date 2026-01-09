// src/lib/config/aiConfig.ts

function getEnvVarAsNumber(key: string, defaultValue: number): number {
  // Use a very defensive check for process.env
  try {
    if (typeof process !== 'undefined' && process.env) {
      const value = process.env[key];
      if (value !== undefined && value !== null && value !== '') {
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    }
  } catch (e) {
    // Fall back to default on any error
  }
  return defaultValue;
}

export const aiConfig = {
  /**
   * The maximum number of recent decisions to consider for context.
   * @default 10
   */
  decisionContextLimit: getEnvVarAsNumber('NARRATIVE_DECISION_CONTEXT_LIMIT', 10),

  /**
   * The Jaccard similarity threshold for filtering out similar choices.
   * Choices with similarity > threshold are discarded.
   * @default 0.7
   */
  choiceSimilarityThreshold: getEnvVarAsNumber('CHOICE_SIMILARITY_THRESHOLD', 0.7),

  /**
   * The number of choices to generate in a single batch for deduplication filtering.
   * @default 5
   */
  choiceGenerationCount: getEnvVarAsNumber('CHOICE_GENERATION_COUNT', 5),
};

// Ensure the object is not mutable after initialization
Object.freeze(aiConfig);