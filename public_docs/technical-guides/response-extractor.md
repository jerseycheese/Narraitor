# ResponseExtractor Utility

AI responses can be messy and unpredictable. The ResponseExtractor utility helps you pull structured data out of free-form AI text with graceful error handling when things go wrong.

## Basic Usage

```typescript
import { ResponseExtractor } from '@/lib/utils';

const extractor = new ResponseExtractor();

// Extract JSON from AI responses
const jsonResult = extractor.extractJSON(response);
if (jsonResult.data) {
  console.log('Extracted data:', jsonResult.data);
}

// Extract key-value pairs
const kvResult = extractor.extractKeyValuePairs(response);
console.log('Key-value pairs:', kvResult.data);

// Extract list items
const listResult = extractor.extractList(response);
console.log('List items:', listResult.data);
```

## Key Features

- **JSON Block Extraction**: Finds and parses `\`\`\`json` code blocks from AI responses
- **Key-Value Parsing**: Extracts "key: value" formatted data from text
- **List Parsing**: Handles both bulleted (`- item`) and numbered (`1. item`) lists
- **Error Resilience**: When extraction fails, you get clear error messages
- **Performance Tracking**: Built-in timing and confidence scoring

## Error Handling

Every extraction method returns an `ExtractionResult` so you always know what happened:

- `data`: The extracted data, or null if extraction failed
- `errors`: Array of error messages explaining what went wrong
- `confidence`: Confidence score (0-1) indicating extraction quality
- `metadata`: Processing information including timing and which pattern worked

## Integration with Existing Code

ResponseExtractor works alongside existing extraction utilities like `goalExtractor` and `structuredLoreExtractor`. Think of it as the shared foundation that handles the common patterns of AI response parsing.