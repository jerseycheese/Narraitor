# Unified Utilities System

This directory contains the consolidated utilities system for Narraitor, following the KISS (Keep It Simple, Stupid) principle. The utilities have been organized into unified frameworks that reduce code duplication and provide consistent patterns across the application.

## Overview

The unified utilities system consolidates patterns that were previously scattered across the codebase:

- **Error Handling**: Unified error processing with domain-specific mappers
- **Validation**: Schema-based validation with built-in validators and pipelines
- **Route Validation**: AST-based validation for Next.js App Router routes
- **Test Utilities**: Modular factories and custom assertions for domain testing

## Directory Structure

```
src/lib/utils/
├── errorHandling/          # Unified error handling system
│   ├── core.ts            # Error processing engine
│   ├── mappers.ts         # Domain-specific error mappers
│   ├── retry.ts           # Retry logic with exponential backoff
│   ├── types.ts           # Error handling type definitions
│   └── index.ts           # Main exports and convenience functions
├── validation/             # Unified validation framework
│   ├── core.ts            # Validation engine and pipelines
│   ├── validators.ts      # Built-in validator functions
│   ├── sanitizers.ts      # Data sanitization utilities
│   ├── types.ts           # Validation type definitions
│   └── index.ts           # Main exports and backward compatibility
├── routeValidation.ts      # Route validation for Link components
├── attributeValidation.ts  # Simplified attribute validation (legacy)
├── classNames.ts          # CSS class name utilities
├── cn.ts                  # Tailwind class merging utility
├── generateId.ts          # Unique ID generation
├── logger.ts              # Logging utilities
├── textFormatter.ts       # Text formatting utilities
└── README.md              # This file
```

## Error Handling System

The error handling system provides unified error processing across all application domains.

### Key Features

- **Unified Error Context**: Consistent error structure with technical and user-friendly information
- **Domain-specific Mappers**: Automatic error mapping based on error patterns
- **Retry Logic**: Built-in exponential backoff retry functionality
- **Recovery Strategies**: Configurable error recovery mechanisms

### Basic Usage

```typescript
import { processError, withRetry } from '@/lib/utils/errorHandling';

// Process any error through the unified system
try {
  await riskyOperation();
} catch (error) {
  const errorContext = processError(error);
  console.log(errorContext.userError.message); // User-friendly message
  
  if (errorContext.userError.retryable) {
    // Show retry option to user
  }
}

// Use retry logic for operations
const result = await withRetry(async () => {
  return await apiCall();
}, {
  maxAttempts: 3,
  backoffFactor: 2
});
```

### Domain-specific Error Handling

The system includes pre-configured mappers for common domains:

- **Storage Errors**: IndexedDB, localStorage, quota issues
- **AI Errors**: API failures, rate limiting, model errors
- **Network Errors**: Connection issues, timeouts, server errors
- **Validation Errors**: Form validation, data integrity issues

### Backward Compatibility

Legacy functions are maintained for compatibility:

```typescript
// Legacy usage still works
import { getUserFriendlyError, userFriendlyError } from '@/lib/utils/errorHandling';

const friendlyError = getUserFriendlyError(error);
const message = userFriendlyError(error);
```

## Validation Framework

The validation framework provides unified validation across all data inputs.

### Key Features

- **Schema-based Validation**: Define validation rules in declarative schemas
- **Built-in Validators**: Common validation patterns (email, required, min/max)
- **Validation Pipelines**: Chain multiple validation steps for complex scenarios
- **Async Support**: Built-in support for asynchronous validation
- **Data Sanitization**: Integrated data cleaning and normalization

### Basic Usage

```typescript
import { validators, validateWithSchema, createValidationPipeline } from '@/lib/utils/validation';

// Simple field validation
const nameValidator = validators.required('Name');
const error = nameValidator(''); // Returns error message or null

// Schema-based validation
const schema = {
  fields: {
    name: [{ validator: validators.required('Name') }],
    email: [{ validator: validators.email() }],
    age: [{ validator: validators.min(18, 'Must be 18 or older') }]
  }
};

const result = validateWithSchema(userData, schema);
if (!result.valid) {
  console.log(result.errors); // Array of error messages
}

// Validation pipeline for complex scenarios
const pipeline = createValidationPipeline<UserData>()
  .addFieldValidation('name', [validators.required('Name')])
  .addFieldValidation('email', [validators.email()])
  .addStep((data) => validateBusinessRules(data));

const result = pipeline.validate(userData);
```

### Built-in Validators

The framework includes validators for common patterns:

- `validators.required(fieldName)` - Required field validation
- `validators.email()` - Email format validation
- `validators.min(value, message?)` - Minimum value validation
- `validators.max(value, message?)` - Maximum value validation
- `validators.minLength(length, message?)` - Minimum string length
- `validators.maxLength(length, message?)` - Maximum string length
- `validators.pattern(regex, message?)` - Regex pattern matching

### Domain Validators

Specialized validators for application domains:

- `domainValidators.characterName()` - Character name validation
- `domainValidators.worldName()` - World name validation
- `domainValidators.attributeRange()` - Attribute value range validation

### Backward Compatibility

Legacy validation functions are maintained:

```typescript
// Legacy usage still works
import { validateCharacterName, validateAttributeData } from '@/lib/utils/validation';

const result = validateCharacterName('Character Name', existingNames);
const attributeResult = validateAttributeData(attribute, existingNames);
```

## Route Validation

Route validation ensures Link components reference valid routes in the Next.js App Router.

### Usage

```typescript
import { validateRoute, validateLinkComponents } from '@/lib/utils/routeValidation';

// Validate a single route
const isValid = await validateRoute('/worlds/create');

// Validate all Link components in a file
const report = await validateLinkComponents('./src/components/Navigation.tsx');
```

### Pre-commit Hook Integration

Add route validation to your pre-commit hooks:

```bash
#!/bin/bash
# .git/hooks/pre-commit
npx tsx scripts/validate-routes.ts
```

## Legacy Utilities

### generateUniqueId(prefix?: string): EntityID

Generates a unique identifier (UUID v4) with an optional prefix.

```typescript
import { generateUniqueId } from '@/lib/utils';

const id = generateUniqueId(); // "550e8400-e29b-41d4-a716-446655440000"
const prefixedId = generateUniqueId('user'); // "user_550e8400-e29b-41d4-a716-446655440000"
```

### formatAIResponse(text: string, options?: FormattingOptions): string

Formats AI-generated text for display with proper paragraphs, dialogue, and emphasis.

```typescript
import { formatAIResponse } from '@/lib/utils';

// Basic formatting
const formatted = formatAIResponse('Hello world');

// With dialogue formatting
const withDialogue = formatAIResponse('She said, Hello!', { formatDialogue: true });
// Output: 'She said, "Hello!"'

// With italics
const withItalics = formatAIResponse('This is *important*!', { enableItalics: true });
// Output: 'This is <em>important</em>!'
```

#### Features

- **Whitespace normalization**: Removes extra spaces, tabs, and trailing whitespace
- **Paragraph formatting**: Normalizes multiple line breaks to double
- **Dialogue formatting**: Adds quotes around speech (said, replied, asked, etc.)
- **Italics support**: Converts `*text*` to `<em>text</em>`
- **Performance optimized**: Handles large texts efficiently (tested up to 12KB)

## Design Principles

### KISS (Keep It Simple, Stupid)

The unified utilities follow the KISS principle:

- **Simple APIs**: Easy-to-understand function signatures
- **Minimal Configuration**: Sensible defaults for most use cases
- **Clear Documentation**: Comprehensive examples and usage patterns
- **Backward Compatibility**: Legacy functions maintained to avoid breaking changes

### Domain-Driven Design

Utilities are organized by domain concerns:

- **Error Handling**: Cross-cutting concern with domain-specific mappers
- **Validation**: Data integrity with domain-specific validators
- **Testing**: Domain-specific factories and assertions

### Type Safety

All utilities are fully typed with TypeScript:

- **Strict Types**: No `any` types in the codebase
- **Generic Support**: Type-safe factories and validation pipelines
- **Inference**: TypeScript can infer types in most usage scenarios

## Migration Guide

### Error Handling Migration

**Before:**
```typescript
// Scattered error handling
try {
  await operation();
} catch (error) {
  if (error.message.includes('network')) {
    showError('Connection problem');
  } else if (error.message.includes('timeout')) {
    showError('Request timed out');
  } else {
    showError('Something went wrong');
  }
}
```

**After:**
```typescript
// Unified error handling
try {
  await operation();
} catch (error) {
  const errorContext = processError(error);
  showError(errorContext.userError);
}
```

### Validation Migration

**Before:**
```typescript
// Manual validation
function validateUser(user) {
  const errors = [];
  if (!user.name) errors.push('Name is required');
  if (!user.email || !user.email.includes('@')) errors.push('Valid email required');
  if (user.age < 18) errors.push('Must be 18 or older');
  return errors;
}
```

**After:**
```typescript
// Schema-based validation
const userSchema = {
  fields: {
    name: [{ validator: validators.required('Name') }],
    email: [{ validator: validators.email() }],
    age: [{ validator: validators.min(18, 'Must be 18 or older') }]
  }
};

const result = validateWithSchema(user, userSchema);
```

## Testing

All utility functions have comprehensive test coverage. Run tests with:

```bash
npm test src/lib/utils/__tests__
```

## Storybook

The text formatter has visual examples in Storybook:

```bash
npm run storybook
# Navigate to: Narraitor/Utilities/TextFormatter
```

## Contributing

When adding new utilities:

1. **Follow KISS**: Keep implementations simple and focused
2. **Add Documentation**: Include JSDoc comments with examples
3. **Maintain Backward Compatibility**: Don't break existing usage patterns
4. **Write Tests**: Include comprehensive test coverage
5. **Update Documentation**: Keep this README up to date

---

For questions or contributions, please refer to the main project documentation or create an issue in the GitHub repository.
