/**
 * Unified Form Components
 * 
 * Re-exports form components from the wizard system for use across the application.
 * These components provide consistent styling and behavior for all forms.
 */

// Re-export wizard form components with generic names
export {
  WizardTextField as TextField,
  WizardTextArea as TextArea,
  WizardSelect as Select,
  WizardFormGroup as FormGroup,
  WizardFormSection as FormSection,
  WizardFieldError as FormError,
} from '../wizard/components/FormComponents';

// Export original names for backward compatibility
export * from '../wizard/components/FormComponents';

// Additional form utilities
export interface FormFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helpText?: string;
}

/**
 * Hook for common form field logic
 */
export function useFormField(
  initialValue: string | number = '',
  validator?: (value: string | number) => string | undefined
) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  const handleChange = (newValue: string | number) => {
    setValue(newValue);
    if (touched && validator) {
      setError(validator(newValue));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (validator) {
      setError(validator(value));
    }
  };

  const reset = () => {
    setValue(initialValue);
    setError(undefined);
    setTouched(false);
  };

  return {
    value,
    error: touched ? error : undefined,
    onChange: handleChange,
    onBlur: handleBlur,
    reset,
    isValid: !error,
    isTouched: touched,
  };
}

// Import React for the hook
import { useState } from 'react';

/**
 * Common validators for form fields
 */
export const validators = {
  required: (message = 'This field is required') => 
    (value: string | number) => {
      const strValue = String(value).trim();
      return strValue ? undefined : message;
    },

  minLength: (min: number, message?: string) => 
    (value: string | number) => {
      const strValue = String(value);
      return strValue.length >= min 
        ? undefined 
        : message || `Must be at least ${min} characters`;
    },

  maxLength: (max: number, message?: string) => 
    (value: string | number) => {
      const strValue = String(value);
      return strValue.length <= max 
        ? undefined 
        : message || `Must be no more than ${max} characters`;
    },

  pattern: (regex: RegExp, message = 'Invalid format') => 
    (value: string | number) => {
      const strValue = String(value);
      return regex.test(strValue) ? undefined : message;
    },

  range: (min: number, max: number, message?: string) => 
    (value: string | number) => {
      const numValue = Number(value);
      return numValue >= min && numValue <= max 
        ? undefined 
        : message || `Must be between ${min} and ${max}`;
    },

  compose: (...validators: Array<(value: string | number) => string | undefined>) => 
    (value: string | number) => {
      for (const validator of validators) {
        const error = validator(value);
        if (error) return error;
      }
      return undefined;
    },
};