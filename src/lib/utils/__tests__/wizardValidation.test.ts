import {
  validateFields,
  alwaysValid,
  createValidationRules,
} from '../wizardValidation';

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
