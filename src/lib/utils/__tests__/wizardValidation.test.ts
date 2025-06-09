import { 
  WizardStepValidator, 
  createValidationRules, 
  createWizardValidator
} from '../wizardValidation';

interface TestFormData {
  name: string;
  email: string;
  age: number;
  skills: string[];
  isOptional?: boolean;
}

describe('WizardStepValidator', () => {
  it('should validate required fields correctly', () => {
    const validator = new WizardStepValidator<TestFormData>({
      rules: {
        name: [createValidationRules.required('Name is required')],
        email: [createValidationRules.required('Email is required')],
      },
    });

    const validData = { name: 'John', email: 'john@example.com', age: 30, skills: [] };
    const result = validator.validate(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);

    const invalidData = { name: '', email: 'john@example.com', age: 30, skills: [] };
    const invalidResult = validator.validate(invalidData);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain('Name is required');
  });

  it('should validate string length rules', () => {
    const validator = new WizardStepValidator<TestFormData>({
      rules: {
        name: [
          createValidationRules.minLength(2, 'Name must be at least 2 characters'),
          createValidationRules.maxLength(50, 'Name must be at most 50 characters'),
        ],
      },
    });

    const shortNameData = { name: 'J', email: '', age: 0, skills: [] };
    const shortNameResult = validator.validate(shortNameData);
    expect(shortNameResult.valid).toBe(false);
    expect(shortNameResult.errors).toContain('Name must be at least 2 characters');

    const longName = 'A'.repeat(51);
    const longNameData = { name: longName, email: '', age: 0, skills: [] };
    const longNameResult = validator.validate(longNameData);
    expect(longNameResult.valid).toBe(false);
    expect(longNameResult.errors).toContain('Name must be at most 50 characters');

    const validData = { name: 'John', email: '', age: 0, skills: [] };
    const validResult = validator.validate(validData);
    expect(validResult.valid).toBe(true);
  });

  it('should validate numeric range rules', () => {
    const validator = new WizardStepValidator<TestFormData>({
      rules: {
        age: [
          createValidationRules.minValue(18, 'Must be at least 18'),
          createValidationRules.maxValue(100, 'Must be at most 100'),
        ],
      },
    });

    const tooYoungData = { name: '', email: '', age: 16, skills: [] };
    const tooYoungResult = validator.validate(tooYoungData);
    expect(tooYoungResult.valid).toBe(false);
    expect(tooYoungResult.errors).toContain('Must be at least 18');

    const tooOldData = { name: '', email: '', age: 101, skills: [] };
    const tooOldResult = validator.validate(tooOldData);
    expect(tooOldResult.valid).toBe(false);
    expect(tooOldResult.errors).toContain('Must be at most 100');

    const validData = { name: '', email: '', age: 25, skills: [] };
    const validResult = validator.validate(validData);
    expect(validResult.valid).toBe(true);
  });

  it('should validate pattern rules', () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validator = new WizardStepValidator<TestFormData>({
      rules: {
        email: [createValidationRules.pattern(emailPattern, 'Invalid email format')],
      },
    });

    const invalidEmailData = { name: '', email: 'notanemail', age: 0, skills: [] };
    const invalidResult = validator.validate(invalidEmailData);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain('Invalid email format');

    const validEmailData = { name: '', email: 'test@example.com', age: 0, skills: [] };
    const validResult = validator.validate(validEmailData);
    expect(validResult.valid).toBe(true);
  });

  it('should validate array length rules', () => {
    const validator = new WizardStepValidator<TestFormData>({
      rules: {
        skills: [
          createValidationRules.arrayMinLength(1, 'At least one skill required'),
          createValidationRules.arrayMaxLength(5, 'Maximum 5 skills allowed'),
        ],
      },
    });

    const noSkillsData = { name: '', email: '', age: 0, skills: [] };
    const noSkillsResult = validator.validate(noSkillsData);
    expect(noSkillsResult.valid).toBe(false);
    expect(noSkillsResult.errors).toContain('At least one skill required');

    const tooManySkillsData = { 
      name: '', 
      email: '', 
      age: 0, 
      skills: ['skill1', 'skill2', 'skill3', 'skill4', 'skill5', 'skill6'] 
    };
    const tooManySkillsResult = validator.validate(tooManySkillsData);
    expect(tooManySkillsResult.valid).toBe(false);
    expect(tooManySkillsResult.errors).toContain('Maximum 5 skills allowed');

    const validSkillsData = { name: '', email: '', age: 0, skills: ['skill1', 'skill2'] };
    const validResult = validator.validate(validSkillsData);
    expect(validResult.valid).toBe(true);
  });

  it('should handle custom validation rules', () => {
    const validator = new WizardStepValidator<TestFormData>({
      rules: {
        name: [
          createValidationRules.custom(
            (name: string) => !name.includes('admin'),
            'Name cannot contain "admin"'
          ),
        ],
      },
    });

    const invalidData = { name: 'admin-user', email: '', age: 0, skills: [] };
    const invalidResult = validator.validate(invalidData);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain('Name cannot contain "admin"');

    const validData = { name: 'regular-user', email: '', age: 0, skills: [] };
    const validResult = validator.validate(validData);
    expect(validResult.valid).toBe(true);
  });

  it('should handle custom validator functions', () => {
    const validator = new WizardStepValidator<TestFormData>({
      rules: {},
      customValidator: (data) => {
        if (data.age < 18 && data.skills.length > 0) {
          return {
            valid: false,
            errors: ['Minors cannot have skills'],
            touched: true,
          };
        }
        return { valid: true, errors: [], touched: true };
      },
    });

    const invalidData = { name: '', email: '', age: 16, skills: ['programming'] };
    const invalidResult = validator.validate(invalidData);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain('Minors cannot have skills');

    const validData = { name: '', email: '', age: 20, skills: ['programming'] };
    const validResult = validator.validate(validData);
    expect(validResult.valid).toBe(true);
  });

  it('should validate individual fields', () => {
    const validator = new WizardStepValidator<TestFormData>({
      rules: {
        name: [createValidationRules.required('Name is required')],
        age: [createValidationRules.minValue(18, 'Must be at least 18')],
      },
    });

    const nameResult = validator.validateField('name', '');
    expect(nameResult.valid).toBe(false);
    expect(nameResult.errors).toContain('Name is required');

    const ageResult = validator.validateField('age', 16);
    expect(ageResult.valid).toBe(false);
    expect(ageResult.errors).toContain('Must be at least 18');

    const validNameResult = validator.validateField('name', 'John');
    expect(validNameResult.valid).toBe(true);
  });

  it('should skip validation for empty non-required fields', () => {
    const validator = new WizardStepValidator<TestFormData>({
      rules: {
        name: [createValidationRules.minLength(2, 'Name must be at least 2 characters')],
      },
    });

    // Empty non-required field should pass
    const emptyData = { name: '', email: '', age: 0, skills: [] };
    const result = validator.validate(emptyData);
    expect(result.valid).toBe(true);
  });
});

describe('createWizardValidator', () => {
  it('should create validators using builder pattern', () => {
    const validator = createWizardValidator<TestFormData>()
      .field('name')
        .required('Name is required')
        .minLength(2, 'Name too short')
      .field('email')
        .required('Email is required')
        .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email')
      .field('age')
        .minValue(18, 'Must be 18 or older')
      .customValidation((data) => ({
        valid: data.skills.length > 0,
        errors: data.skills.length === 0 ? ['At least one skill required'] : [],
        touched: true,
      }))
      .build();

    const invalidData = { 
      name: '', 
      email: 'invalid', 
      age: 16, 
      skills: [] 
    };
    
    const result = validator.validate(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name is required');
    expect(result.errors).toContain('Invalid email');
    expect(result.errors).toContain('Must be 18 or older');
    expect(result.errors).toContain('At least one skill required');

    const validData = { 
      name: 'John', 
      email: 'john@example.com', 
      age: 25, 
      skills: ['programming'] 
    };
    
    const validResult = validator.validate(validData);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toEqual([]);
  });

  it('should allow chaining field validations', () => {
    const validator = createWizardValidator<TestFormData>()
      .field('name')
        .required()
        .minLength(2)
        .maxLength(50)
        .custom((name) => !name.includes('test'), 'Name cannot contain "test"')
      .build();

    const invalidData = { name: 'testuser', email: '', age: 0, skills: [] };
    const result = validator.validate(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name cannot contain "test"');
  });
});