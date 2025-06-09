import { 
  validateName, 
  validateText, 
  validatePointDistribution, 
  validateSelectionCount 
} from '../validationUtils';

describe('validationUtils', () => {
  describe('validateName', () => {
    it('should validate required names', () => {
      expect(validateName('', { required: true })).toEqual({
        valid: false,
        errors: ['Name is required']
      });
      
      expect(validateName('Valid Name')).toEqual({
        valid: true,
        errors: []
      });
    });

    it('should validate name length', () => {
      expect(validateName('ab', { minLength: 3 })).toEqual({
        valid: false,
        errors: ['Name must be at least 3 characters']
      });
      
      expect(validateName('a'.repeat(60), { maxLength: 50 })).toEqual({
        valid: false,
        errors: ['Name must be less than 50 characters']
      });
    });
  });

  describe('validateText', () => {
    it('should validate text with field name', () => {
      const result = validateText('short', { 
        minLength: 10, 
        fieldName: 'Description' 
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toBe('Description must be at least 10 characters');
    });
  });

  describe('validatePointDistribution', () => {
    it('should validate correct point distribution', () => {
      expect(validatePointDistribution([5, 5, 5], 15)).toEqual({
        valid: true,
        errors: []
      });
      
      expect(validatePointDistribution([5, 5, 3], 15)).toEqual({
        valid: false,
        errors: ['Must spend exactly 15 points (13 spent)']
      });
    });
  });

  describe('validateSelectionCount', () => {
    it('should validate selection counts', () => {
      expect(validateSelectionCount([true, true, false], {
        minSelections: 1,
        maxSelections: 3
      })).toEqual({
        valid: true,
        errors: []
      });
      
      expect(validateSelectionCount([false, false, false], {
        minSelections: 1,
        fieldName: 'skills'
      })).toEqual({
        valid: false,
        errors: ['Select at least 1 skills']
      });
    });
  });
});