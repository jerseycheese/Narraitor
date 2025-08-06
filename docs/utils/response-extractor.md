# ResponseExtractor Utility

A utility for extracting structured information from AI-generated responses with error handling and fallback strategies.

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

- **JSON Block Extraction**: Parses `\`\`\`json` code blocks from AI responses
- **Key-Value Parsing**: Extracts "key: value" formatted data
- **List Parsing**: Handles bulleted (`- item`) and numbered (`1. item`) lists
- **Error Resilience**: Graceful error handling with clear error messages
- **Performance Tracking**: Built-in timing and confidence metrics

## Error Handling

All extraction methods return an `ExtractionResult` with:
- `data`: The extracted data or null if extraction failed
- `errors`: Array of error messages explaining failures
- `confidence`: Confidence score (0-1) of the extraction quality
- `metadata`: Processing information including timing and pattern used

## Integration with Existing Code

The ResponseExtractor is designed to work alongside existing extraction utilities like `goalExtractor` and `structuredLoreExtractor`, providing a standardized foundation for response parsing throughout the application.