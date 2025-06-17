import { 
  createFormUpdater, 
  createFieldProps 
} from '../formHelpers';

describe('formHelpers', () => {
  describe('createFormUpdater', () => {
    test('creates form updater with field update functionality', () => {
      const initialState = { name: 'John', age: 30, email: 'john@test.com' };
      const mockOnChange = jest.fn();
      
      const updater = createFormUpdater(initialState, mockOnChange);
      
      updater.updateField('name', 'Jane');
      expect(mockOnChange).toHaveBeenCalledWith({
        name: 'Jane',
        age: 30,
        email: 'john@test.com'
      });
    });

    test('updates multiple fields at once', () => {
      const initialState = { name: 'John', age: 30, email: 'john@test.com' };
      const mockOnChange = jest.fn();
      
      const updater = createFormUpdater(initialState, mockOnChange);
      
      updater.updateFields({ name: 'Jane', age: 25 });
      expect(mockOnChange).toHaveBeenCalledWith({
        name: 'Jane',
        age: 25,
        email: 'john@test.com'
      });
    });

    test('updates nested fields', () => {
      const initialState = { 
        user: { name: 'John', settings: { theme: 'dark' } },
        count: 0 
      };
      const mockOnChange = jest.fn();
      
      const updater = createFormUpdater(initialState, mockOnChange);
      
      updater.updateNestedField('user', 'name', 'Jane');
      expect(mockOnChange).toHaveBeenCalledWith({
        user: { name: 'Jane', settings: { theme: 'dark' } },
        count: 0
      });
    });

    test('resets form to initial state', () => {
      const initialState = { name: 'John', age: 30 };
      const resetState = { name: '', age: 0 };
      const mockOnChange = jest.fn();
      
      const updater = createFormUpdater(initialState, mockOnChange);
      
      updater.reset(resetState);
      expect(mockOnChange).toHaveBeenCalledWith(resetState);
    });
  });

  describe('createFieldProps', () => {
    test('creates type-safe field props', () => {
      const state = { name: 'John', age: 30 };
      const mockUpdateField = jest.fn();
      
      const nameProps = createFieldProps(state, mockUpdateField, 'name');
      
      expect(nameProps.value).toBe('John');
      
      nameProps.onChange('Jane');
      expect(mockUpdateField).toHaveBeenCalledWith('name', 'Jane');
    });

    test('works with different field types', () => {
      const state = { name: 'John', age: 30, active: true };
      const mockUpdateField = jest.fn();
      
      const ageProps = createFieldProps(state, mockUpdateField, 'age');
      const activeProps = createFieldProps(state, mockUpdateField, 'active');
      
      expect(ageProps.value).toBe(30);
      expect(activeProps.value).toBe(true);
      
      ageProps.onChange(25);
      activeProps.onChange(false);
      
      expect(mockUpdateField).toHaveBeenCalledWith('age', 25);
      expect(mockUpdateField).toHaveBeenCalledWith('active', false);
    });
  });
});