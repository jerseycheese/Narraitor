/**
 * Tests for validator functions
 */

import { validators, domainValidators, createValidator } from '../validators';

describe('Validation Validators', () => {
  describe('basic validators', () => {
    describe('required', () => {
      const validator = validators.required('Test Field');

      it('should pass for valid values', () => {
        expect(validator('test')).toBeNull();
        expect(validator('0')).toBeNull();
        expect(validator(0)).toBeNull();
        expect(validator(false)).toBeNull();
        expect(validator(['item'])).toBeNull();
      });

      it('should fail for empty values', () => {
        expect(validator('')).toBe('Test Field is required');
        expect(validator('   ')).toBe('Test Field is required');
        expect(validator(null)).toBe('Test Field is required');
        expect(validator(undefined)).toBe('Test Field is required');
        expect(validator([])).toBe('Test Field is required');
      });
    });

    describe('minLength', () => {
      const validator = validators.minLength(3, 'Name');

      it('should pass for strings meeting minimum length', () => {
        expect(validator('abc')).toBeNull();
        expect(validator('abcd')).toBeNull();
      });

      it('should fail for strings below minimum length', () => {
        expect(validator('ab')).toBe('Name must be at least 3 characters');
        expect(validator('')).toBe('Name must be at least 3 characters');
      });

      it('should pass for non-string values', () => {
        expect(validator(123 as unknown as string)).toBeNull();
      });
    });

    describe('maxLength', () => {
      const validator = validators.maxLength(5, 'Name');

      it('should pass for strings within maximum length', () => {
        expect(validator('abc')).toBeNull();
        expect(validator('abcde')).toBeNull();
      });

      it('should fail for strings exceeding maximum length', () => {
        expect(validator('abcdef')).toBe('Name must be no more than 5 characters');
      });
    });

    describe('pattern', () => {
      const validator = validators.pattern(/^[a-z]+$/, 'Must be lowercase letters only');

      it('should pass for matching patterns', () => {
        expect(validator('abc')).toBeNull();
        expect(validator('test')).toBeNull();
      });

      it('should fail for non-matching patterns', () => {
        expect(validator('ABC')).toBe('Must be lowercase letters only');
        expect(validator('123')).toBe('Must be lowercase letters only');
        expect(validator('test123')).toBe('Must be lowercase letters only');
      });
    });

    describe('unique', () => {
      const existingValues = ['apple', 'banana', 'cherry'];
      const validator = validators.unique(existingValues, 'Fruit');

      it('should pass for unique values', () => {
        expect(validator('orange')).toBeNull();
        expect(validator('grape')).toBeNull();
      });

      it('should fail for duplicate values', () => {
        expect(validator('apple')).toBe('Fruit already exists');
        expect(validator('banana')).toBe('Fruit already exists');
      });

      it('should pass for current value in update scenarios', () => {
        const updateValidator = validators.unique(existingValues, 'Fruit', 'apple');
        expect(updateValidator('apple')).toBeNull();
        expect(updateValidator('banana')).toBe('Fruit already exists');
      });
    });

    describe('range', () => {
      const validator = validators.range(1, 10, 'Score');

      it('should pass for values within range', () => {
        expect(validator(1)).toBeNull();
        expect(validator(5)).toBeNull();
        expect(validator(10)).toBeNull();
      });

      it('should fail for values outside range', () => {
        expect(validator(0)).toBe('Score must be between 1 and 10');
        expect(validator(11)).toBe('Score must be between 1 and 10');
      });
    });

    describe('email', () => {
      const validator = validators.email('Email Address');

      it('should pass for valid email addresses', () => {
        expect(validator('test@example.com')).toBeNull();
        expect(validator('user.name@domain.co.uk')).toBeNull();
      });

      it('should fail for invalid email addresses', () => {
        expect(validator('invalid')).toBe('Email Address must be a valid email address');
        expect(validator('test@')).toBe('Email Address must be a valid email address');
        expect(validator('@example.com')).toBe('Email Address must be a valid email address');
      });
    });
  });

  describe('domain validators', () => {
    describe('characterName', () => {
      const existingNames = ['Aragorn', 'Legolas'];
      const validator = domainValidators.characterName(existingNames);

      it('should pass for valid character names', () => {
        expect(validator('Gimli')).toBeNull();
        expect(validator('Gandalf')).toBeNull();
      });

      it('should fail for invalid character names', () => {
        expect(validator('')).toContain('required');
        expect(validator('Ab')).toContain('at least 3 characters');
        expect(validator('A'.repeat(51))).toContain('no more than 50 characters');
        expect(validator('Aragorn')).toContain('already exists');
      });
    });

    describe('attributeName', () => {
      const existingNames = ['Strength', 'Dexterity'];
      const validator = domainValidators.attributeName(existingNames);

      it('should pass for valid attribute names', () => {
        expect(validator('Intelligence')).toBeNull();
        expect(validator('Wisdom')).toBeNull();
      });

      it('should fail for invalid attribute names', () => {
        expect(validator('')).toContain('required');
        expect(validator('Strength')).toContain('already exists');
      });
    });

    describe('attributeRange', () => {
      const validator = domainValidators.attributeRange(-999, 999);

      it('should pass for valid ranges', () => {
        expect(validator({ minValue: 1, maxValue: 10 })).toBeNull();
        expect(validator({ minValue: -100, maxValue: 100 })).toBeNull();
      });

      it('should fail for invalid ranges', () => {
        expect(validator({ minValue: 10, maxValue: 5 }))
          .toBe('Maximum value must be greater than minimum value');
        expect(validator({ minValue: -1000, maxValue: 10 }))
          .toBe('Minimum value cannot be less than -999');
        expect(validator({ minValue: 1, maxValue: 1000 }))
          .toBe('Maximum value cannot be greater than 999');
      });
    });

    describe('pointPool', () => {
      const validator = domainValidators.pointPool(27, 'Attribute Points');

      it('should pass when points are spent correctly', () => {
        const attributes = [
          { value: 10 },
          { value: 8 },
          { value: 9 }
        ];
        expect(validator(attributes)).toBeNull();
      });

      it('should fail when points are not spent correctly', () => {
        const attributes = [
          { value: 10 },
          { value: 8 },
          { value: 8 }
        ];
        expect(validator(attributes))
          .toBe('Must spend exactly 27 attribute points (26 spent)');
      });
    });
  });

  describe('createValidator', () => {
    it('should create required validator', () => {
      const validator = createValidator({
        type: 'required',
        options: { fieldName: 'Test Field' }
      });

      expect(validator('')).toBe('Test Field is required');
      expect(validator('test')).toBeNull();
    });

    it('should create minLength validator', () => {
      const validator = createValidator({
        type: 'minLength',
        options: { min: 5, fieldName: 'Password' }
      });

      expect(validator('abc')).toBe('Password must be at least 5 characters');
      expect(validator('abcdef')).toBeNull();
    });

    it('should create email validator', () => {
      const validator = createValidator({ type: 'email' });

      expect(validator('invalid')).toBe('Field must be a valid email address');
      expect(validator('test@example.com')).toBeNull();
    });

    it('should throw for unknown validator type', () => {
      expect(() => {
        createValidator({ type: 'unknown' as never });
      }).toThrow('Unknown validator type: unknown');
    });
  });

  describe('complex validators', () => {
    describe('conditional', () => {
      const conditionalValidator = validators.conditional(
        (value: string) => value.startsWith('test'),
        validators.minLength(10, 'Test Field')
      );

      it('should apply validator when condition is met', () => {
        expect(conditionalValidator('test123')).toBe('Test Field must be at least 10 characters');
        expect(conditionalValidator('test1234567')).toBeNull();
      });

      it('should skip validator when condition is not met', () => {
        expect(conditionalValidator('abc')).toBeNull();
        expect(conditionalValidator('other')).toBeNull();
      });
    });

    describe('arrayItems', () => {
      const arrayValidator = validators.arrayItems(
        validators.minLength(2, 'Item'),
        'Items'
      );

      it('should validate all items in array', () => {
        expect(arrayValidator(['abc', 'def'])).toBeNull();
      });

      it('should fail if any item is invalid', () => {
        expect(arrayValidator(['abc', 'a'])).toBe('Items[1]: Item must be at least 2 characters');
      });

      it('should pass for non-array values', () => {
        expect(arrayValidator('not-an-array' as unknown as string[])).toBeNull();
      });
    });

    describe('arrayLength', () => {
      const validator = validators.arrayLength(2, 5, 'Skills');

      it('should pass for arrays within length bounds', () => {
        expect(validator(['a', 'b'])).toBeNull();
        expect(validator(['a', 'b', 'c'])).toBeNull();
        expect(validator(['a', 'b', 'c', 'd', 'e'])).toBeNull();
      });

      it('should fail for arrays outside length bounds', () => {
        expect(validator(['a'])).toBe('Skills must have at least 2 items');
        expect(validator(['a', 'b', 'c', 'd', 'e', 'f'])).toBe('Skills must have at most 5 items');
      });
    });
  });
});