import {
  validateFields,
  alwaysValid,
  createValidationRules,
  getVisibleFieldErrorMessages,
  getVisibleStepError,
} from '../wizardValidation';
import type { WizardValidation } from '@/hooks/useWizardState';

interface TestFormData {
  name: string;
  email: string;
  description?: string;
}

describe('validateFields', () => {
  it('validates required fields', () => {
    const validator = validateFields<TestFormData>({
      name: [createValidationRules.required('Name is required')],
      email: [createValidationRules.required('Email is required')],
    });

    const validData = { name: 'John', email: 'john@example.com' };
    const result = validator(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);

    const invalidData = { name: '', email: 'john@example.com' };
    const invalidResult = validator(invalidData);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain('Name is required');
  });

  it('rejects whitespace-only required fields', () => {
    const validator = validateFields<TestFormData>({
      name: [createValidationRules.required('Name is required')],
    });

    const result = validator({ name: '   ', email: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name is required');
  });

  it('validates string length rules', () => {
    const validator = validateFields<TestFormData>({
      name: [
        createValidationRules.minLength(2, 'Name must be at least 2 characters'),
        createValidationRules.maxLength(50, 'Name must be at most 50 characters'),
      ],
    });

    expect(validator({ name: 'J', email: '' }).errors)
      .toContain('Name must be at least 2 characters');
    expect(validator({ name: 'A'.repeat(51), email: '' }).errors)
      .toContain('Name must be at most 50 characters');
    expect(validator({ name: 'John', email: '' }).valid).toBe(true);
  });

  it('handles custom rules', () => {
    const validator = validateFields<TestFormData>({
      name: [
        createValidationRules.custom(
          (name: string) => !name.includes('admin'),
          'Name cannot contain "admin"'
        ),
      ],
    });

    expect(validator({ name: 'admin-user', email: '' }).errors)
      .toContain('Name cannot contain "admin"');
    expect(validator({ name: 'regular-user', email: '' }).valid).toBe(true);
  });

  it('skips empty non-required fields', () => {
    const validator = validateFields<TestFormData>({
      name: [createValidationRules.minLength(2, 'Name must be at least 2 characters')],
    });

    expect(validator({ name: '', email: '' }).valid).toBe(true);
  });

  it('applies string length rules to optional fields', () => {
    const validator = validateFields<TestFormData>({
      description: [createValidationRules.maxLength(5, 'Description is too long')],
    });

    expect(validator({ name: '', email: '' }).valid).toBe(true);
    expect(validator({ name: '', email: '', description: 'way too long' }).errors)
      .toContain('Description is too long');
  });
});

describe('alwaysValid', () => {
  it('always returns valid', () => {
    expect(alwaysValid({}).valid).toBe(true);
    expect(alwaysValid({ anything: 'goes' }).valid).toBe(true);
  });
});

describe('validateFields fieldErrors', () => {
  it('reports the first error per invalid field, keyed by field name', () => {
    const validator = validateFields<TestFormData>({
      name: [createValidationRules.required('Name is required')],
      email: [createValidationRules.required('Email is required')],
    });

    const result = validator({ name: '', email: '' });
    expect(result.fieldErrors).toEqual({
      name: 'Name is required',
      email: 'Email is required',
    });
  });

  it('omits fields that pass validation', () => {
    const validator = validateFields<TestFormData>({
      name: [createValidationRules.required('Name is required')],
      email: [createValidationRules.required('Email is required')],
    });

    const result = validator({ name: 'John', email: '' });
    expect(result.fieldErrors).toEqual({ email: 'Email is required' });
  });
});

describe('getVisibleFieldErrorMessages / getVisibleStepError (issue #2178)', () => {
  const invalidWithFieldErrors: WizardValidation = {
    valid: false,
    touched: true,
    errors: ['Genre is required', 'Name is too short'],
    fieldErrors: { genre: 'Genre is required', name: 'Name is too short' },
  };

  it('shows nothing when there is no validation, or the step is valid', () => {
    expect(getVisibleFieldErrorMessages(undefined, new Set(), false)).toEqual([]);
    expect(
      getVisibleFieldErrorMessages(
        { valid: true, touched: true, errors: [] },
        new Set(['name']),
        false
      )
    ).toEqual([]);
  });

  it('shows only the touched field\'s error when the step has not been attempted', () => {
    const visible = getVisibleFieldErrorMessages(
      invalidWithFieldErrors,
      new Set(['name']),
      false
    );
    expect(visible).toEqual(['Name is too short']);
  });

  it('shows nothing for fields the player has not touched yet', () => {
    const visible = getVisibleFieldErrorMessages(invalidWithFieldErrors, new Set(), false);
    expect(visible).toEqual([]);
  });

  it('shows every field error once the step has been attempted (Next pressed)', () => {
    const visible = getVisibleFieldErrorMessages(invalidWithFieldErrors, new Set(), true);
    expect(visible).toEqual(['Genre is required', 'Name is too short']);
  });

  it('falls back to the flat errors list, gated by touched, when the validator has no fieldErrors', () => {
    const legacyValidation: WizardValidation = {
      valid: false,
      touched: true,
      errors: ['Something is wrong'],
    };
    expect(getVisibleFieldErrorMessages(legacyValidation, new Set(), false)).toEqual([
      'Something is wrong',
    ]);
    expect(
      getVisibleFieldErrorMessages({ ...legacyValidation, touched: false }, new Set(), false)
    ).toEqual([]);
  });

  it('joins visible messages into one banner string via getVisibleStepError', () => {
    expect(getVisibleStepError(invalidWithFieldErrors, new Set(), true)).toBe(
      'Genre is required, Name is too short'
    );
    expect(getVisibleStepError(invalidWithFieldErrors, new Set(), false)).toBeUndefined();
  });
});
