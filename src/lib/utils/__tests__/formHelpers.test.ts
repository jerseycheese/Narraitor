import { 
  createFormUpdater
} from '../formHelpers';

describe('formHelpers', () => {
  describe('createFormUpdater', () => {
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

});