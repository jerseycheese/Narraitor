import { 
  descriptionsToSelectOptions, 
  createEnumChecker, 
  getEnumValues, 
  isValidEnumValue 
} from '../enumHelpers';

describe('enumHelpers', () => {
  const testDescriptions = {
    'option-one': 'Description for option one',
    'option-two': 'Description for option two',
    'option_three': 'Description for option three'
  };

  describe('descriptionsToSelectOptions', () => {
    test('converts description object to select options', () => {
      const result = descriptionsToSelectOptions(testDescriptions);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        value: 'option-one',
        label: 'Option One',
        description: 'Description for option one'
      });
      expect(result[1]).toEqual({
        value: 'option-two',
        label: 'Option Two',
        description: 'Description for option two'
      });
      expect(result[2]).toEqual({
        value: 'option_three',
        label: 'Option_three',
        description: 'Description for option three'
      });
    });

    test('uses custom label formatter when provided', () => {
      const customFormatter = (key: string) => key.toUpperCase();
      const result = descriptionsToSelectOptions(testDescriptions, customFormatter);
      
      expect(result[0].label).toBe('OPTION-ONE');
      expect(result[1].label).toBe('OPTION-TWO');
    });

    test('handles empty descriptions object', () => {
      const result = descriptionsToSelectOptions({});
      expect(result).toEqual([]);
    });
  });

  describe('createEnumChecker', () => {
    const TestEnum = {
      VALUE_ONE: 'value1',
      VALUE_TWO: 'value2',
      VALUE_THREE: 'value3'
    } as const;

    test('creates function that validates enum values', () => {
      const isValidValue = createEnumChecker(TestEnum);
      
      expect(isValidValue('value1')).toBe(true);
      expect(isValidValue('value2')).toBe(true);
      expect(isValidValue('value3')).toBe(true);
      expect(isValidValue('invalid')).toBe(false);
      expect(isValidValue(null)).toBe(false);
      expect(isValidValue(undefined)).toBe(false);
    });
  });

  describe('getEnumValues', () => {
    test('extracts all values from enum object', () => {
      const TestEnum = {
        FIRST: 'first',
        SECOND: 'second',
        THIRD: 'third'
      } as const;

      const values = getEnumValues(TestEnum);
      expect(values).toEqual(['first', 'second', 'third']);
    });

    test('handles empty enum object', () => {
      const values = getEnumValues({});
      expect(values).toEqual([]);
    });
  });

  describe('isValidEnumValue', () => {
    const validValues = ['red', 'green', 'blue'] as const;

    test('validates string literal types', () => {
      expect(isValidEnumValue('red', validValues)).toBe(true);
      expect(isValidEnumValue('green', validValues)).toBe(true);
      expect(isValidEnumValue('blue', validValues)).toBe(true);
      expect(isValidEnumValue('yellow', validValues)).toBe(false);
      expect(isValidEnumValue(123, validValues)).toBe(false);
      expect(isValidEnumValue(null, validValues)).toBe(false);
    });
  });
});