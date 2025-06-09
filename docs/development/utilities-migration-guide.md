# Utilities Migration Guide

This guide helps developers migrate from legacy utility patterns to the new unified utilities system, following KISS principles and maintaining backward compatibility.

## Overview

The unified utilities system consolidates scattered patterns into organized, reusable frameworks. This migration guide covers:

- Error handling consolidation
- Validation framework adoption
- Test utilities modernization
- Route validation integration
- Performance and security improvements

## Error Handling Migration

### Problem Statement

Previously, error handling was scattered throughout the codebase with inconsistent patterns:

```typescript
// Before: Inconsistent error handling across different modules
try {
  await storageOperation();
} catch (error) {
  if (error.message.includes('quota')) {
    setError('Storage is full');
  } else {
    setError('Storage error');
  }
}

try {
  await aiOperation();
} catch (error) {
  if (error.status === 429) {
    setError('Too many requests');
  } else if (error.status === 401) {
    setError('Authentication failed');
  } else {
    setError('AI service error');
  }
}
```

### Solution: Unified Error Processing

The new system provides consistent error handling across all domains:

```typescript
// After: Unified error handling
import { processError, withRetry } from '@/lib/utils/errorHandling';

try {
  await storageOperation();
} catch (error) {
  const errorContext = processError(error);
  setError(errorContext.userError);
  
  if (errorContext.userError.retryable) {
    setShowRetryButton(true);
  }
}

try {
  await aiOperation();
} catch (error) {
  const errorContext = processError(error);
  setError(errorContext.userError);
}
```

### Migration Steps

1. **Identify Error Handling Patterns**
   ```bash
   # Find scattered error handling
   grep -r "catch.*error" src/ --include="*.ts" --include="*.tsx"
   ```

2. **Replace with Unified System**
   ```typescript
   // Replace manual error mapping
   - if (error.message.includes('network')) {
   -   return 'Connection problem';
   - }
   + const errorContext = processError(error);
   + return errorContext.userError.message;
   ```

3. **Add Retry Logic**
   ```typescript
   // Add retry for transient errors
   const result = await withRetry(async () => {
     return await unreliableOperation();
   }, {
     maxAttempts: 3,
     backoffFactor: 2
   });
   ```

4. **Domain-specific Setup**
   ```typescript
   // Register custom error mappers if needed
   import { errorMapperRegistry } from '@/lib/utils/errorHandling';
   
   errorMapperRegistry.register(
     (error) => error.message.includes('custom'),
     (error) => createErrorContext(
       { code: 'CUSTOM_ERROR' },
       { title: 'Custom Error', message: 'Handle custom error' }
     )
   );
   ```

### Benefits

- **Consistency**: All errors follow the same structure
- **User Experience**: Better error messages for users
- **Maintainability**: Single place to update error handling logic
- **Retry Logic**: Built-in exponential backoff for transient errors

## Validation Framework Migration

### Problem Statement

Validation was scattered across components with duplicate logic:

```typescript
// Before: Scattered validation logic
function validateUserForm(data) {
  const errors = {};
  
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Name is required';
  }
  
  if (!data.email || !data.email.includes('@')) {
    errors.email = 'Valid email is required';
  }
  
  if (data.age < 18) {
    errors.age = 'Must be 18 or older';
  }
  
  return errors;
}

function validateCharacterForm(data) {
  const errors = {};
  
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Character name is required';
  }
  
  if (data.name && data.name.length < 3) {
    errors.name = 'Character name must be at least 3 characters';
  }
  
  return errors;
}
```

### Solution: Schema-based Validation

The new framework provides reusable validation patterns:

```typescript
// After: Unified validation framework
import { validators, validateWithSchema, createValidationPipeline } from '@/lib/utils/validation';

// Define reusable schemas
const userSchema = {
  fields: {
    name: [{ validator: validators.required('Name') }],
    email: [{ validator: validators.email() }],
    age: [{ validator: validators.min(18, 'Must be 18 or older') }]
  }
};

const characterSchema = {
  fields: {
    name: [
      { validator: validators.required('Character name') },
      { validator: validators.minLength(3, 'Name must be at least 3 characters') }
    ]
  }
};

// Use schemas for validation
const userResult = validateWithSchema(userData, userSchema);
const characterResult = validateWithSchema(characterData, characterSchema);
```

### Migration Steps

1. **Identify Validation Patterns**
   ```bash
   # Find manual validation code
   grep -r "errors\[" src/ --include="*.ts" --include="*.tsx"
   grep -r "errors\." src/ --include="*.ts" --include="*.tsx"
   ```

2. **Create Validation Schemas**
   ```typescript
   // Convert manual validation to schemas
   const schema = {
     fields: {
       // Map each field to appropriate validators
       fieldName: [{ validator: validators.required('Field Name') }]
     }
   };
   ```

3. **Replace Validation Functions**
   ```typescript
   // Replace manual validation
   - function validateForm(data) {
   -   const errors = {};
   -   if (!data.name) errors.name = 'Required';
   -   return errors;
   - }
   + const result = validateWithSchema(data, schema);
   + return result.metadata?.fieldErrors || {};
   ```

4. **Add Complex Validation Pipelines**
   ```typescript
   // For complex scenarios, use pipelines
   const pipeline = createValidationPipeline<FormData>()
     .addFieldValidation('name', [validators.required('Name')])
     .addFieldValidation('email', [validators.email()])
     .addStep((data) => validateBusinessRules(data));
   
   const result = pipeline.validate(formData);
   ```

### Benefits

- **Reusability**: Validators can be shared across components
- **Consistency**: Same validation logic produces same results
- **Type Safety**: Full TypeScript support with type inference
- **Extensibility**: Easy to add new validators and rules

## Test Utilities Migration

### Problem Statement

Test data creation was verbose and inconsistent:

```typescript
// Before: Manual test data creation
const createTestWorld = () => {
  return {
    id: 'world-1',
    name: 'Test World',
    description: 'A test world',
    theme: 'Fantasy',
    attributes: [
      {
        id: 'str',
        worldId: 'world-1',
        name: 'Strength',
        description: 'Physical strength',
        baseValue: 10,
        minValue: 1,
        maxValue: 20,
        category: 'Physical'
      },
      // ... many more properties
    ],
    skills: [
      // ... more manual creation
    ],
    settings: {
      maxAttributes: 10,
      maxSkills: 20,
      attributePointPool: 30,
      skillPointPool: 40
    },
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  };
};
```

### Solution: Factory Pattern

The new factories provide fluent interfaces for test data:

```typescript
// After: Factory-based test data creation
import { WorldFactory, CharacterFactory } from '@/lib/test-utils/factories';

// Simple creation with sensible defaults
const world = WorldFactory.create()
  .fantasy()
  .withStandardAttributes()
  .build();

// Complex scenarios with custom configuration
const character = CharacterFactory.create()
  .worldId(world.id)
  .name('Test Character')
  .withAttributes([
    { attributeId: 'str', value: 15 },
    { attributeId: 'int', value: 12 }
  ])
  .background('Fighter')
  .build();
```

### Migration Steps

1. **Identify Test Data Creation**
   ```bash
   # Find manual test data creation
   grep -r "id.*:" src/__tests__ --include="*.ts" --include="*.tsx"
   grep -r "const.*World" src/__tests__ --include="*.ts" --include="*.tsx"
   ```

2. **Replace with Factories**
   ```typescript
   // Replace manual creation
   - const testWorld = {
   -   id: 'world-1',
   -   name: 'Test World',
   -   // ... many properties
   - };
   + const testWorld = WorldFactory.create().build();
   ```

3. **Use Custom Assertions**
   ```typescript
   // Replace manual assertions
   - expect(world.theme).toBe('Fantasy');
   - expect(world.attributes).toHaveLength(6);
   + expect(world).toHaveTheme('Fantasy');
   + expect(world).toHaveAttributeCount(6);
   ```

4. **Setup Test Environment**
   ```typescript
   // In test files
   import { setupTestEnvironment } from '@/lib/test-utils/setup';
   
   beforeEach(() => {
     setupTestEnvironment();
   });
   ```

### Benefits

- **Readability**: Tests focus on behavior, not data setup
- **Maintainability**: Single place to update test data structure
- **Flexibility**: Easy to create variations for different scenarios
- **Type Safety**: Full TypeScript support for test data

## Route Validation Migration

### Problem Statement

Link components could reference invalid routes without detection:

```typescript
// Before: No validation of routes
<Link href="/worlds/creat">Create World</Link> {/* Typo not caught */}
<Link href="/characters/edit/123">Edit Character</Link> {/* May not exist */}
```

### Solution: AST-based Route Validation

The new system validates routes at build time:

```typescript
// After: Validated routes
import { validateRoute } from '@/lib/utils/routeValidation';

// Validate routes programmatically
const isValid = await validateRoute('/worlds/create');

// Pre-commit hook validation
// .git/hooks/pre-commit
npx tsx scripts/validate-routes.ts
```

### Migration Steps

1. **Add Route Validation Script**
   ```typescript
   // scripts/validate-routes.ts
   import { validateLinkComponents } from '@/lib/utils/routeValidation';
   
   const components = [
     './src/components/Navigation.tsx',
     './src/components/**/*.tsx'
   ];
   
   for (const pattern of components) {
     const report = await validateLinkComponents(pattern);
     if (report.errors.length > 0) {
       console.error('Invalid routes found:', report.errors);
       process.exit(1);
     }
   }
   ```

2. **Setup Pre-commit Hook**
   ```bash
   #!/bin/bash
   # .git/hooks/pre-commit
   echo "Validating routes..."
   npx tsx scripts/validate-routes.ts
   ```

3. **Add to CI Pipeline**
   ```yaml
   # .github/workflows/test.yml
   - name: Validate Routes
     run: npx tsx scripts/validate-routes.ts
   ```

### Benefits

- **Early Detection**: Catch invalid routes before deployment
- **Confidence**: Know that all links work as expected
- **Automation**: Validate routes as part of development workflow

## Performance Optimizations

### Lazy Loading

The unified utilities support lazy loading for better performance:

```typescript
// Heavy validators loaded only when needed
const complexValidator = await import('@/lib/utils/validation/complex');
```

### Memoization

Validation schemas and error mappers are cached:

```typescript
// Schemas are memoized automatically
const result1 = validateWithSchema(data, schema); // Compiles schema
const result2 = validateWithSchema(data, schema); // Uses cached version
```

### Tree Shaking

Modular exports support dead code elimination:

```typescript
// Only import what you need
import { validators } from '@/lib/utils/validation';
import { processError } from '@/lib/utils/errorHandling';
```

## Security Improvements

### Input Sanitization

The validation framework includes built-in sanitization:

```typescript
import { sanitizers, validateAndSanitize } from '@/lib/utils/validation';

// Sanitize user input automatically
const result = validateAndSanitize(userInput, schema, sanitizationPipeline);
```

### XSS Prevention

Text formatting utilities escape HTML by default:

```typescript
import { formatAIResponse } from '@/lib/utils';

// Safe by default
const formatted = formatAIResponse(userText); // HTML escaped automatically
```

## Common Migration Patterns

### Pattern 1: Error Boundary Integration

```typescript
// Before: Manual error boundary logic
class ErrorBoundary extends Component {
  componentDidCatch(error) {
    if (error.message.includes('chunk')) {
      this.setState({ error: 'Loading error' });
    } else {
      this.setState({ error: 'Something went wrong' });
    }
  }
}

// After: Use unified error processing
class ErrorBoundary extends Component {
  componentDidCatch(error) {
    const errorContext = processError(error);
    this.setState({ error: errorContext.userError });
  }
}
```

### Pattern 2: Form Validation Integration

```typescript
// Before: Manual form validation
const [errors, setErrors] = useState({});

const handleSubmit = (data) => {
  const validationErrors = {};
  if (!data.name) validationErrors.name = 'Required';
  setErrors(validationErrors);
};

// After: Schema-based validation
const schema = {
  fields: {
    name: [{ validator: validators.required('Name') }]
  }
};

const handleSubmit = (data) => {
  const result = validateWithSchema(data, schema);
  setErrors(result.metadata?.fieldErrors || {});
};
```

### Pattern 3: API Error Handling

```typescript
// Before: Manual API error handling
const fetchData = async () => {
  try {
    const response = await api.getData();
    return response;
  } catch (error) {
    if (error.status === 429) {
      throw new Error('Rate limited');
    } else if (error.status >= 500) {
      throw new Error('Server error');
    } else {
      throw new Error('Request failed');
    }
  }
};

// After: Unified error processing with retry
const fetchData = async () => {
  return withRetry(async () => {
    return await api.getData();
  }, {
    maxAttempts: 3,
    retryableErrors: ['network', 'timeout', '5']
  });
};
```

## Testing Migration

### Before: Manual Test Setup

```typescript
describe('Component', () => {
  let mockData;
  
  beforeEach(() => {
    mockData = {
      world: {
        id: 'world-1',
        name: 'Test World',
        // ... 50 lines of setup
      },
      character: {
        id: 'char-1',
        worldId: 'world-1',
        // ... 30 lines of setup
      }
    };
  });
  
  it('should render', () => {
    render(<Component world={mockData.world} character={mockData.character} />);
    expect(screen.getByText('Test World')).toBeInTheDocument();
  });
});
```

### After: Factory-based Test Setup

```typescript
import { WorldFactory, CharacterFactory, setupTestEnvironment } from '@/lib/test-utils';

describe('Component', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  
  it('should render', () => {
    const world = WorldFactory.create().build();
    const character = CharacterFactory.create().worldId(world.id).build();
    
    render(<Component world={world} character={character} />);
    expect(world).toBeValidWorld();
    expect(character).toBelongToWorld(world.id);
  });
});
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors After Migration**
   ```typescript
   // Make sure to import types
   import type { ValidationResult } from '@/lib/utils/validation';
   ```

2. **Test Failures Due to Mocking**
   ```typescript
   // Update mocks to use new utilities
   jest.mock('@/lib/utils/errorHandling', () => ({
     processError: jest.fn(() => ({ userError: { message: 'Test error' } }))
   }));
   ```

3. **Performance Issues**
   ```typescript
   // Use lazy loading for heavy operations
   const heavyValidator = await import('@/lib/utils/validation/heavy');
   ```

### Migration Checklist

- [ ] Replace manual error handling with `processError()`
- [ ] Convert validation functions to schema-based validation
- [ ] Update test data creation to use factories
- [ ] Add custom assertions for domain testing
- [ ] Setup route validation in pre-commit hooks
- [ ] Update TypeScript imports and types
- [ ] Test all migrated components thoroughly
- [ ] Update documentation and examples

## Best Practices

### Do's

- **Start Small**: Migrate one pattern at a time
- **Test Thoroughly**: Ensure migrated code works correctly
- **Update Documentation**: Keep docs current with changes
- **Use Type Safety**: Leverage TypeScript for validation
- **Follow KISS**: Keep implementations simple

### Don'ts

- **Don't Break Compatibility**: Maintain backward compatibility
- **Don't Over-engineer**: Use simple solutions when possible
- **Don't Skip Tests**: Always test migrated code
- **Don't Ignore Errors**: Handle migration errors properly

## Conclusion

The unified utilities system provides significant benefits:

- **Consistency**: Unified patterns across the application
- **Maintainability**: Single place to update common logic
- **Type Safety**: Full TypeScript support throughout
- **Performance**: Optimized for production use
- **Security**: Built-in protections against common vulnerabilities

Migration should be done incrementally, testing each change thoroughly. The backward compatibility layer ensures existing code continues to work while you migrate to the new patterns.

For questions or issues during migration, refer to the main documentation or create an issue in the GitHub repository.