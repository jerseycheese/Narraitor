# Mock Presets Quick Reference

## Usage Pattern

```typescript
jest.mock('@/hooks', () => {
  const { createHookMockModule, mockHookPresets } = require('@/lib/test-utils/mockHooks');
  return createHookMockModule({
    formState: mockHookPresets.formState.static(),
    asyncState: mockHookPresets.asyncState.idle(),
    modal: mockHookPresets.modal.closed(),
    errorState: mockHookPresets.errorState.clean()
  });
});
```

## FormState Presets

### `static(initialData?)`
**Use for**: Components that display form data but don't change it
```typescript
formState: mockHookPresets.formState.static()
formState: mockHookPresets.formState.static({ name: 'Initial Name' })
```

### `stateful(initialData?)`
**Use for**: Components that need working form interactions (inputs, toggles)
```typescript
formState: mockHookPresets.formState.stateful()
formState: mockHookPresets.formState.stateful({ isExpanded: true })
```

### `withValidation()`
**Use for**: Components that validate form inputs
```typescript
formState: mockHookPresets.formState.withValidation()
```

## AsyncState Presets

### `idle()`
**Use for**: Components not performing async operations
```typescript
asyncState: mockHookPresets.asyncState.idle()
```

### `loading()`
**Use for**: Testing loading states
```typescript
asyncState: mockHookPresets.asyncState.loading()
```

### `success(data?)`
**Use for**: Testing successful data loading
```typescript
asyncState: mockHookPresets.asyncState.success()
asyncState: mockHookPresets.asyncState.success({ worlds: mockWorlds })
```

### `error(message?)`
**Use for**: Testing error states
```typescript
asyncState: mockHookPresets.asyncState.error()
asyncState: mockHookPresets.asyncState.error('Failed to load data')
```

### `withExecution()`
**Use for**: Components that call execute() function
```typescript
asyncState: mockHookPresets.asyncState.withExecution()
```

## Modal Presets

### `closed()`
**Use for**: Components where modal starts closed
```typescript
modal: mockHookPresets.modal.closed()
```

### `open()`
**Use for**: Components where modal starts open
```typescript
modal: mockHookPresets.modal.open()
```

### `withProps()`
**Use for**: Components that need custom modal properties
```typescript
modal: mockHookPresets.modal.withProps()
```

## ErrorState Presets

### `clean()`
**Use for**: Components with no errors
```typescript
errorState: mockHookPresets.errorState.clean()
```

### `withError(message?)`
**Use for**: Components displaying errors
```typescript
errorState: mockHookPresets.errorState.withError()
errorState: mockHookPresets.errorState.withError('Validation failed')
```

## Common Combinations

### Simple Display Component
```typescript
return createHookMockModule({
  formState: mockHookPresets.formState.static(),
  asyncState: mockHookPresets.asyncState.success(mockData)
});
```

### Interactive Form Component
```typescript
return createHookMockModule({
  formState: mockHookPresets.formState.stateful(),
  errorState: mockHookPresets.errorState.clean()
});
```

### Component with Modal
```typescript
return createHookMockModule({
  formState: mockHookPresets.formState.static(),
  modal: mockHookPresets.modal.closed(),
  errorState: mockHookPresets.errorState.clean()
});
```

### Data Loading Component
```typescript
return createHookMockModule({
  asyncState: mockHookPresets.asyncState.withExecution(),
  errorState: mockHookPresets.errorState.clean()
});
```

### Complex Wizard Step
```typescript
return createHookMockModule({
  formState: mockHookPresets.formState.withValidation(),
  asyncState: mockHookPresets.asyncState.idle(),
  modal: mockHookPresets.modal.withProps(),
  errorState: mockHookPresets.errorState.clean()
});
```

## Store Mocking (Separate from Hook Mocking)

### Simple Store
```typescript
jest.mock('@/state/worldStore', () => ({
  useWorldStore: jest.fn(() => ({
    worlds: {},
    loading: false,
    error: null,
    createWorld: jest.fn(),
  })),
}));
```

### Store with getState
```typescript
const mockSetCurrentWorld = jest.fn();

jest.mock('@/state/worldStore', () => ({
  useWorldStore: Object.assign(jest.fn(), {
    getState: () => ({
      setCurrentWorld: mockSetCurrentWorld,
    }),
  }),
}));
```

## Migration from Manual Mocks

### Before (Manual)
```typescript
jest.mock('@/hooks', () => ({
  useFormState: jest.fn(() => ({
    data: { name: '', description: '' },
    updateField: jest.fn(),
    updateData: jest.fn(),
    setData: jest.fn(),
    reset: jest.fn(),
    errors: [],
    hasErrors: false,
    isDirty: false,
    setErrors: jest.fn(),
    clearErrors: jest.fn(),
    validate: jest.fn(() => []),
    isValid: jest.fn(() => true)
  })),
  useAsyncState: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    status: 'idle',
    execute: jest.fn(),
    reset: jest.fn(),
    setData: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn()
  }))
}));
```

### After (Mock Abstraction)
```typescript
jest.mock('@/hooks', () => {
  const { createHookMockModule, mockHookPresets } = require('@/lib/test-utils/mockHooks');
  return createHookMockModule({
    formState: mockHookPresets.formState.static(),
    asyncState: mockHookPresets.asyncState.idle()
  });
});
```

## Troubleshooting

### Test expects different behavior?
- Check if you need `stateful()` instead of `static()`
- Verify the preset matches your component's usage

### Complex interactive component not working?
- Some components may need manual mocking for complex behaviors
- Consider creating custom presets for common patterns

### Store methods not working?
- Store mocks are separate from hook mocks
- Use the store mocking patterns above