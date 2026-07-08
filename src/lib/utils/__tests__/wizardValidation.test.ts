import {
  validateFields,
  alwaysValid,
  createValidationRules,
} from '../wizardValidation';

interface TestFormData {
  name: string;
  email: string;
  age: number;
  skills: string[];
  isOptional?: boolean;
}

describe('validateFields', () => {
  it('validates required fields', () => {
    const validator = validateFields<TestFormData>({
      name: [createValidationRules.required('Name is required')],
      email: [createValidationRules.required('Email is required')],
    });

    const validData = { name: 'John', email: 'john@example.com', age: 30, skills: [] };
    const result = validator(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);

    const invalidData = { name: '', email: 'john@example.com', age: 30, skills: [] };
    const invalidResult = validator(invalidData);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain('Name is required');
  });

  it('validates string length rules', () => {
    const validator = validateFields<TestFormData>({
      name: [
        createValidationRules.minLength(2, 'Name must be at least 2 characters'),
        createValidationRules.maxLength(50, 'Name must be at most 50 characters'),
      ],
    });

    expect(validator({ name: 'J', email: '', age: 0, skills: [] }).errors)
      .toContain('Name must be at least 2 characters');
    expect(validator({ name: 'A'.repeat(51), email: '', age: 0, skills: [] }).errors)
      .toContain('Name must be at most 50 characters');
    expect(validator({ name: 'John', email: '', age: 0, skills: [] }).valid).toBe(true);
  });

  it('validates numeric range rules', () => {
    const validator = validateFields<TestFormData>({
      age: [
        createValidationRules.minValue(18, 'Must be at least 18'),
        createValidationRules.maxValue(100, 'Must be at most 100'),
      ],
    });

    expect(validator({ name: '', email: '', age: 16, skills: [] }).errors)
      .toContain('Must be at least 18');
    expect(validator({ name: '', email: '', age: 101, skills: [] }).errors)
      .toContain('Must be at most 100');
    expect(validator({ name: '', email: '', age: 25, skills: [] }).valid).toBe(true);
  });

  it('validates pattern rules', () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validator = validateFields<TestFormData>({
      email: [createValidationRules.pattern(emailPattern, 'Invalid email format')],
    });

    expect(validator({ name: '', email: 'notanemail', age: 0, skills: [] }).errors)
      .toContain('Invalid email format');
    expect(validator({ name: '', email: 'test@example.com', age: 0, skills: [] }).valid).toBe(true);
  });

  it('validates array length rules', () => {
    const validator = validateFields<TestFormData>({
      skills: [
        createValidationRules.arrayMinLength(1, 'At least one skill required'),
        createValidationRules.arrayMaxLength(5, 'Maximum 5 skills allowed'),
      ],
    });

    expect(validator({ name: '', email: '', age: 0, skills: [] }).errors)
      .toContain('At least one skill required');
    expect(validator({
      name: '', email: '', age: 0,
      skills: ['s1', 's2', 's3', 's4', 's5', 's6'],
    }).errors).toContain('Maximum 5 skills allowed');
    expect(validator({ name: '', email: '', age: 0, skills: ['s1', 's2'] }).valid).toBe(true);
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

    expect(validator({ name: 'admin-user', email: '', age: 0, skills: [] }).errors)
      .toContain('Name cannot contain "admin"');
    expect(validator({ name: 'regular-user', email: '', age: 0, skills: [] }).valid).toBe(true);
  });

  it('skips empty non-required fields', () => {
    const validator = validateFields<TestFormData>({
      name: [createValidationRules.minLength(2, 'Name must be at least 2 characters')],
    });

    expect(validator({ name: '', email: '', age: 0, skills: [] }).valid).toBe(true);
  });
});

describe('alwaysValid', () => {
  it('always returns valid', () => {
    expect(alwaysValid({}).valid).toBe(true);
    expect(alwaysValid({ anything: 'goes' }).valid).toBe(true);
  });
});
