# Utility Functions

A collection of utility functions used throughout the Narraitor application. These handle common tasks like ID generation, text formatting, and date/time display so you don't have to write the same code over and over.

## ID Generation

### generateUniqueId(prefix?: string): EntityID

Generates a unique identifier (UUID v4) with an optional prefix. Useful for creating IDs for worlds, characters, sessions, etc.

```typescript
import { generateUniqueId } from '@/lib/utils';

const id = generateUniqueId(); // "550e8400-e29b-41d4-a716-446655440000"
const prefixedId = generateUniqueId('user'); // "user_550e8400-e29b-41d4-a716-446655440000"
```

## AI Text Formatting

### formatAIResponse(text: string, options?: FormattingOptions): string

Formats AI-generated text for display with proper paragraphs, dialogue, and emphasis. This is especially useful for narrative content since AI often returns raw text that needs formatting.

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

**Options:**
- `preserveLineBreaks?: boolean` - Keep single line breaks as-is (default: false)
- `formatDialogue?: boolean` - Add quotation marks to dialogue (default: false)  
- `enableItalics?: boolean` - Convert *asterisks* to `<em>` tags (default: false)
- `paragraphSpacing?: 'single' | 'double'` - Not currently implemented

**What it does:**
- **Whitespace normalization**: Removes extra spaces, tabs, and trailing whitespace
- **Paragraph formatting**: Normalizes multiple line breaks to double
- **Dialogue formatting**: Adds quotes around speech (said, replied, asked, etc.)
- **Italics support**: Converts `*text*` to `<em>text</em>`
- **Performance optimized**: Handles large texts efficiently (tested up to 12KB)

## Date & Time Formatting

### formatRelativeTime(date: Date | string): string

Formats dates as human-readable relative time. Much more user-friendly than showing raw timestamps.

```typescript
import { formatRelativeTime } from '@/lib/utils';

formatRelativeTime(new Date(Date.now() - 5 * 60 * 1000)); // "5 minutes ago"
formatRelativeTime(new Date(Date.now() - 24 * 60 * 60 * 1000)); // "yesterday"
formatRelativeTime(new Date(Date.now() + 2 * 60 * 60 * 1000)); // "in 2 hours"
formatRelativeTime('2024-01-15T10:00:00Z'); // Works with ISO strings
```

### formatDate(date: Date | string, options?: DateFormatOptions): string

Formats dates with locale-appropriate formatting.

```typescript
import { formatDate } from '@/lib/utils';

formatDate(new Date('2024-01-15')); // "Jan 15, 2024"
formatDate(new Date('2024-01-15'), { month: 'long', weekday: 'long' }); // "Monday, January 15, 2024"
```

### formatTime(date: Date | string, includeSeconds?: boolean): string

Formats just the time portion of a date.

```typescript
import { formatTime } from '@/lib/utils';

formatTime(new Date('2024-01-15T14:30:45')); // "2:30 PM"
formatTime(new Date('2024-01-15T14:30:45'), true); // "2:30:45 PM"
```

### formatDateTime(date: Date | string, options?: DateTimeFormatOptions): string

Formats both date and time together.

```typescript
import { formatDateTime } from '@/lib/utils';

formatDateTime(new Date('2024-01-15T14:30:00')); // "Jan 15, 2024, 2:30 PM"
formatDateTime(new Date('2024-01-15T14:30:00'), { hour12: false }); // "Jan 15, 2024, 14:30"
```

## String Formatting

### truncate(text: string, maxLength: number, suffix?: string): string

Intelligently truncates text at word boundaries when possible. Better than just chopping off at a character limit.

```typescript
import { truncate } from '@/lib/utils';

truncate('Hello world from TypeScript', 11); // "Hello world..."
truncate('Supercalifragilisticexpialidocious', 10); // "Supercalif..."
truncate('Long text here', 8, '…'); // "Long tex…"
```

### capitalize(text: string): string

Capitalizes the first letter of a string.

```typescript
import { capitalize } from '@/lib/utils';

capitalize('hello'); // "Hello"
capitalize('HELLO'); // "Hello"
```

### titleCase(text: string): string

Converts text to title case (capitalizes first letter of each word).

```typescript
import { titleCase } from '@/lib/utils';

titleCase('hello world'); // "Hello World"
titleCase('the quick brown fox'); // "The Quick Brown Fox"
```

### sentenceCase(text: string): string

Converts text to sentence case (capitalizes first letter of each sentence).

```typescript
import { sentenceCase } from '@/lib/utils';

sentenceCase('hello world. this is great.'); // "Hello world. This is great."
sentenceCase('hello! how are you?'); // "Hello! How are you?"
```

### safeTrim(text: string | null | undefined): string

Safely trims whitespace, handling null/undefined values so you don't get runtime errors.

```typescript
import { safeTrim } from '@/lib/utils';

safeTrim('  hello  '); // "hello"
safeTrim(null); // ""
safeTrim(undefined); // ""
```

## Number Formatting

### formatNumber(value: number, decimals?: number): string

Formats numbers with locale-appropriate separators.

```typescript
import { formatNumber } from '@/lib/utils';

formatNumber(1234567.89); // "1,234,567.89" (US) or "1.234.567,89" (EU)
formatNumber(1234567.89, 2); // "1,234,567.89"
formatNumber(1234567.89, 0); // "1,234,568"
```

### formatPercentage(value: number, decimals?: number): string

Formats decimal values as percentages.

```typescript
import { formatPercentage } from '@/lib/utils';

formatPercentage(0.75); // "75%"
formatPercentage(0.1234); // "12.34%"
formatPercentage(0.1234, 1); // "12.3%"
```

### formatCompactNumber(value: number): string

Formats large numbers in compact notation.

```typescript
import { formatCompactNumber } from '@/lib/utils';

formatCompactNumber(1234); // "1.2K"
formatCompactNumber(1234567); // "1.2M"
formatCompactNumber(1234567890); // "1.2B"
```

## Import Patterns

```typescript
// Import specific functions
import { formatDate, formatNumber, truncate } from '@/lib/utils';

// Import with types
import { formatDateTime, type DateTimeFormatOptions } from '@/lib/utils';

// Import all formatters
import {
  formatRelativeTime,
  formatDate,
  formatTime,
  formatDateTime,
  truncate,
  capitalize,
  titleCase,
  sentenceCase,
  safeTrim,
  formatNumber,
  formatPercentage,
  formatCompactNumber
} from '@/lib/utils';
```

## Testing

All utility functions have test coverage. Run tests with:

```bash
npm test src/lib/utils/__tests__
```

## Storybook

The text formatter has visual examples in Storybook for seeing how the formatting works:

```bash
npm run storybook
# Navigate to: Narraitor/Utilities/TextFormatter
```