---
title: "Portrait Generation System Documentation"
type: feature
category: character
tags: [portrait, generation, ai, character]
created: 2025-05-27
updated: 2025-06-08
---

# Portrait Generation System Documentation

The portrait generation system allows Narraitor to create AI-generated character portraits using Google's Gemini API. This feature enhances the character creation experience by providing visual representations of characters based on their descriptions and attributes.

## Overview

The portrait generation system uses a secure server-side architecture with the following components:

- **`/api/generate-portrait` Endpoint** - Secure Next.js API route that interfaces with Google Gemini
- **Server-side Portrait Generator** - Core logic for constructing prompts and managing generation (server-only)
- **Character Portrait Component** - UI component for displaying portraits with fallbacks
- **Character Detection** - Intelligent detection of known fictional and real characters
- **Client-side API Integration** - Components call secure API endpoints instead of direct AI clients

## Documentation Index

1. **[API Documentation](./api.md)** - Detailed API endpoint reference with OpenAPI specification
2. **[Architecture Overview](./architecture.md)** - System design and component relationships
3. **[Integration Guide](./integration-guide.md)** - How to use portrait generation in your components
4. **[Prompt Engineering](./prompt-engineering.md)** - Deep dive into prompt construction
5. **[Troubleshooting Guide](./troubleshooting.md)** - Common issues and solutions

## Quick Start

### Basic Usage

```typescript
// Generate portrait for a character using secure API endpoint
const generatePortraitForCharacter = async (character: Character, world: World) => {
  try {
    const response = await fetch('/api/generate-portrait', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        character: character,
        world: world
      })
    });

    if (!response.ok) {
      throw new Error('Portrait generation failed');
    }

    const { portrait } = await response.json();
    return portrait;
  } catch (error) {
    console.error('Portrait generation error:', error);
    // Return placeholder portrait
    return {
      type: 'placeholder',
      url: null
    };
  }
};

// Usage in component
const portrait = await generatePortraitForCharacter(character, world);

// Display the portrait
<CharacterPortrait 
  portrait={portrait}
  characterName={character.name}
  size="medium"
/>
```

### Environment Setup

The portrait generation system requires a Google Gemini API key configured server-side only:

```bash
# .env.local (Server-side only - secure)
GEMINI_API_KEY=your-api-key-here
```

**⚠️ Security Note**: Never use `NEXT_PUBLIC_GEMINI_API_KEY` as this exposes your API key to the client-side, creating a security vulnerability. All AI operations are handled through secure server-side API endpoints.

## Security Architecture (Issue #470)

The portrait generation system implements a secure API-only architecture:

- **🔒 Server-side Only**: All AI operations happen on the server through Next.js API routes
- **🚫 No Client Exposure**: API keys never reach the browser or client-side JavaScript  
- **🛡️ Rate Limiting**: Built-in protection against API abuse
- **✅ Input Validation**: All requests are validated and sanitized server-side
- **🔐 Secure Headers**: Proper authentication headers for Google Gemini API

### Migration from Direct Client Usage

If you have existing code that uses direct AI clients, update it to use the secure API pattern:

```typescript
// ❌ Old pattern (security vulnerability - DO NOT USE)
// const aiClient = createAIClient();
// const portraitGenerator = new PortraitGenerator(aiClient);
// const portrait = await portraitGenerator.generatePortrait(character);

// ✅ New secure pattern (ALWAYS USE)
const response = await fetch('/api/generate-portrait', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ character, world })
});
const { portrait } = await response.json();
```

## Key Features

### 1. Known Character Detection
The system automatically detects known fictional characters (from movies, TV, games) and real people (celebrities, historical figures) to generate more accurate portraits.

### 2. Intelligent Prompt Construction
Prompts are built using a structured approach:
- **Subject** - Who/what is being portrayed
- **Context** - Environment and character details
- **Style** - Visual style specifications

### 3. Fallback Handling
When portrait generation fails, the system gracefully falls back to placeholder portraits with character initials.

### 4. Portrait Types
The system supports multiple portrait types:
- `ai-generated` - Successfully generated AI portraits
- `placeholder` - Fallback portraits with initials
- `uploaded` - (Future) User-uploaded images
- `preset` - (Future) Pre-made avatar library

## Performance Considerations

- Portrait generation typically takes 2-5 seconds
- Generated images are base64 encoded and stored in IndexedDB
- Image sizes are optimized for web display (typically 50-200KB)
- Consider implementing caching for frequently generated characters

## Known Limitations

1. **API Rate Limits** - Gemini API has rate limits that may affect bulk generation
2. **Storage Size** - Base64 images in IndexedDB can consume significant space
3. **Generation Consistency** - Same prompt may produce slightly different results
4. **Browser Compatibility** - Requires modern browsers with IndexedDB support

## Related Issues

- [#403](https://github.com/jerseycheese/narraitor/pull/403) - Initial portrait generation implementation
- [#406](https://github.com/jerseycheese/narraitor/issues/406) - API error tracking and fixes
- [#404](https://github.com/jerseycheese/narraitor/issues/404) - Future: Custom image upload
- [#405](https://github.com/jerseycheese/narraitor/issues/405) - Future: Preset avatar library

## Contributing

When contributing to the portrait generation system:
1. Follow the existing patterns for prompt construction
2. Maintain backwards compatibility with stored portraits
3. Add appropriate error handling and fallbacks
4. Update documentation for any API changes
5. Test with various character types (known/unknown, fantasy/realistic)