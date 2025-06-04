/**
 * Common interfaces for wizard step components
 */

/**
 * Base props that all wizard steps should implement
 */
export interface BaseWizardStepProps<T = Record<string, unknown>> {
  /**
   * The current data state for the wizard
   */
  data: T;
  
  /**
   * Field-specific errors to display
   */
  errors: Record<string, string>;
  
  /**
   * Update function to modify wizard data
   */
  onUpdate: (updates: Partial<T>) => void;
  
  /**
   * Whether the step is currently processing (e.g., making API calls)
   */
  isProcessing?: boolean;
  
  /**
   * Optional callback when the step is completed
   */
  onComplete?: () => void;
}

/**
 * Extended props for steps that have validation
 */
export interface ValidatedWizardStepProps<T = Record<string, unknown>> extends BaseWizardStepProps<T> {
  /**
   * Validates the current step data
   * @returns true if valid, false otherwise
   */
  onValidate: () => boolean;
  
  /**
   * Sets an error for a specific field
   */
  setError: (field: string, message: string) => void;
  
  /**
   * Clears an error for a specific field
   */
  clearError: (field: string) => void;
}

/**
 * Props for steps that support auto-save
 */
export interface AutoSaveWizardStepProps<T = Record<string, unknown>> extends BaseWizardStepProps<T> {
  /**
   * Called when a field loses focus to trigger auto-save
   */
  onFieldBlur?: () => void;
}

/**
 * Props for steps with AI integration
 */
export interface AIWizardStepProps<T = Record<string, unknown>> extends BaseWizardStepProps<T> {
  /**
   * AI-generated suggestions
   */
  suggestions?: unknown[];
  
  /**
   * Callback to update AI suggestions
   */
  setSuggestions?: (suggestions: unknown[]) => void;
  
  /**
   * Whether AI processing is in progress
   */
  isAIProcessing?: boolean;
  
  /**
   * Callback to set AI processing state
   */
  setAIProcessing?: (processing: boolean) => void;
}

/**
 * Common step metadata
 */
export interface WizardStepMeta {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType;
}

/**
 * Step validation result
 */
export interface StepValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

/**
 * Helper type for step components
 */
export type WizardStepComponent<T = Record<string, unknown>> = React.ComponentType<BaseWizardStepProps<T>>;

/**
 * Helper type for validated step components
 */
export type ValidatedWizardStepComponent<T = Record<string, unknown>> = React.ComponentType<ValidatedWizardStepProps<T>>;
