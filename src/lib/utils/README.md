# Utility Functions

A collection of utility functions used throughout the Narraitor application.

## Functions

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

// Combined options
const combined = formatAIResponse(
  'He said, Look at *that*!\n\nAmazing!', 
  { formatDialogue: true, enableItalics: true }
);
// Output: 'He said, "Look at <em>that</em>!"\n\nAmazing!'
```

#### Options

- `preserveLineBreaks?: boolean` - Keep single line breaks as-is (default: false)
- `formatDialogue?: boolean` - Add quotation marks to dialogue (default: false)  
- `enableItalics?: boolean` - Convert *asterisks* to `<em>` tags (default: false)
- `paragraphSpacing?: 'single' | 'double'` - Not currently implemented

#### Features

- **Whitespace normalization**: Removes extra spaces, tabs, and trailing whitespace
- **Paragraph formatting**: Normalizes multiple line breaks to double
- **Dialogue formatting**: Adds quotes around speech (said, replied, asked, etc.)
- **Italics support**: Converts `*text*` to `<em>text</em>`
- **Performance optimized**: Handles large texts efficiently (tested up to 12KB)

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
