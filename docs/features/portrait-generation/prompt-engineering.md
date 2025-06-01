# Portrait Generation Prompt Engineering

This document details how the portrait generation system constructs prompts for optimal results with Google Gemini's image generation capabilities.

## Prompt Structure

All prompts follow a three-part structure optimized for Gemini:

```
[SUBJECT] + [CONTEXT] + [STYLE]
```

- **SUBJECT**: Who or what is being portrayed
- **CONTEXT**: Environmental details and character attributes  
- **STYLE**: Visual specifications and rendering approach

## Character Detection System

Before generating a prompt, the system detects if a character is a known figure:

### Detection Process

```typescript
// Detection prompt example
const detectionPrompt = `Is "Harry Potter" a known real person or fictional character from movies, TV, video games, books, or other media? 
Mark ALL recognizable characters and real people as known figures...

Answer with JSON: {
  "isKnownFigure": true/false, 
  "figureType": "historical/fictional/celebrity/comedian/musician/athlete/politician/videogame/anime/other",
  "actorName": "actor name if applicable",
  "figureName": "game/movie/show title if applicable"
}`;
```

### Detection Categories

1. **Fictional Characters**
   - Movie/TV characters (with actor associations)
   - Video game protagonists
   - Book characters
   - Animated characters

2. **Real People**
   - Celebrities and public figures
   - Historical figures
   - Comedians and entertainers
   - Athletes and politicians

3. **Special Cases**
   - Characters with unusual appearances (e.g., "Sloth" from The Goonies)
   - Non-human characters (e.g., "Gizmo" from Gremlins)
   - Masked/costumed characters

## Prompt Construction Examples

### Known Fictional Character (Live Action)

**Character**: Bob Wiley (from What About Bob?)
```
SUBJECT: Cinematic portrait of Bob Wiley character, wearing casual vacation clothes
CONTEXT: Bill Murray as Bob Wiley, authentic character portrayal, accurate costume and appearance from the source material, vacation resort setting
STYLE: medium portrait shot with some shoulder and chest visible, sharp focus throughout entire image, high-resolution photorealistic quality, natural skin tones and textures
```

### Known Video Game Character

**Character**: Arthur Morgan (from Red Dead Redemption 2)
```
SUBJECT: Character portrait of Arthur Morgan from Red Dead Redemption 2
CONTEXT: rugged outlaw with weathered features, authentic game character appearance, recognizable character design, official character look, expressing tough stoic character
STYLE: medium portrait shot with some shoulder and chest visible, digital painting masterpiece, concept art quality, highly detailed brushwork, rich color palette
```

### Unknown Fantasy Character

**Character**: Custom wizard character
```
SUBJECT: Fantasy character portrait of Aldric the Wise, an elderly wizard with long white beard
CONTEXT: Fantasy world setting, dramatic atmospheric lighting, mystical environment, heroic pose, detailed costume and equipment
STYLE: medium portrait shot with some shoulder and chest visible, digital painting masterpiece, concept art quality, fantasy illustration, volumetric lighting effects
```

### Real Person

**Character**: Historical figure or celebrity
```
SUBJECT: Photorealistic portrait of Abraham Lincoln the historical figure
CONTEXT: 19th century setting, appropriate environment for character, ambient lighting, contextual background
STYLE: medium portrait shot with some shoulder and chest visible, sharp focus throughout entire image, high-resolution photorealistic quality, natural skin tones and textures
```

## Prompt Optimization Techniques

### 1. Physical Description Enhancement

The system enhances basic descriptions with AI knowledge:

```typescript
// User input: "tall warrior"
// Enhanced: "Tall muscular warrior with shoulder-length dark hair, weathered face, wearing leather armor"
```

### 2. Contextual Details

For known characters, the system adds authentic details:

```typescript
// Video game character
if (detection.figureType === 'videogame' && detection.figureName) {
  subject.push(`from ${detection.figureName}`);
  context.push(`authentic game character appearance`);
  context.push(`recognizable character design`);
}
```

### 3. Distinctive Feature Emphasis

The system extracts and emphasizes unique features:

```typescript
// Extract distinctive features
const distinctiveFeatures = [];
if (physicalDesc.match(/missing teeth/i)) distinctiveFeatures.push('missing teeth');
if (physicalDesc.match(/scar/i)) distinctiveFeatures.push('visible scars');
if (physicalDesc.match(/bald/i)) distinctiveFeatures.push('bald head');

// Add to context with emphasis
if (distinctiveFeatures.length > 0) {
  context.push(`MUST show: ${distinctiveFeatures.join(', ')}`);
}
```

## World Theme Integration

The system adapts prompts based on the world's theme:

### Fantasy Worlds
```typescript
// Detected fantasy keywords: fantasy, medieval, magic, mystical, epic
if (isFantasy) {
  style.push(`digital painting masterpiece`);
  style.push(`concept art quality`);
  style.push(`fantasy illustration`);
  style.push(`artstation trending quality`);
}
```

### Modern/Realistic Worlds
```typescript
// Non-fantasy worlds
else {
  style.push(`photorealistic quality`);
  style.push(`natural colors`);
  style.push(`high resolution`);
}
```

## Personality Integration

Character personality traits influence the portrait:

```typescript
// Extract key traits from personality
const traits = extractKeyTraits(character.background.personality);
// Example: "brave and loyal" → "brave loyal character"

// Add to context
context.push(`expressing ${traits}`);
```

## Token Optimization

Prompts are optimized to stay within Gemini's token limits:

1. **Maximum Length**: ~1900 characters (approximately 480 tokens)
2. **Truncation**: Intelligent truncation preserves key information
3. **Priority Order**: Subject > Context > Style

```typescript
// Truncation function
private truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}
```

## Common Patterns and Best Practices

### 1. Framing for Circular Portraits
All prompts specify "medium portrait shot with some shoulder and chest visible" to ensure good framing when displayed in circular containers.

### 2. Specific Clothing Items
```typescript
// Extract specific clothing
const clothingMatch = physicalDesc.match(/wearing\s+([^,\.]+)/i);
if (clothingMatch) {
  context.push(`MUST be wearing ${clothingMatch[1]}`);
}
```

### 3. Actor Portrayal Accuracy
For fictional characters played by specific actors:
```typescript
context.push(`${actorName} as ${characterName}`);
context.push(`authentic character portrayal`);
```

### 4. Game/Media Title Inclusion
Always include the source material for better accuracy:
```typescript
// Patterns to extract game/media titles
const patterns = [
  /from\s+([^.]+)/i,           // "from [Game Name]"
  /in\s+([^.]+)/i,             // "in [Game Name]"
  /of\s+([^.]+)/i,             // "of [Game Name]"
];
```

## Debugging and Testing

### Enable Debug Logging
```bash
# In .env.local
NEXT_PUBLIC_DEBUG_LOGGING=true
```

This will log:
- Detection results
- Generated prompts
- Enhancement operations

### Test Detection
```typescript
// The system stores detection results for debugging
if (typeof window !== 'undefined') {
  console.log(window.lastDetectionResult);
}
```

## Prompt Examples by Category

### Comedians/Entertainers
```
SUBJECT: Photorealistic portrait of Nathan Fielder the comedian
CONTEXT: casual modern clothing, comedy club or casual setting, ambient lighting, contextual background
STYLE: medium portrait shot, photorealistic quality, natural skin tones
```

### Animated Characters
```
SUBJECT: Character portrait of Mario from Super Mario
CONTEXT: red cap with M logo, blue overalls, authentic game character appearance, recognizable character design
STYLE: medium portrait shot, vibrant colors, game art style
```

### Characters with Specific Appearances
```
SUBJECT: Cinematic portrait of Sloth character, gentle giant with facial deformity
CONTEXT: John Matuszak as Sloth, MUST show: facial deformity, authentic character portrayal
STYLE: medium portrait shot, photorealistic quality, empathetic portrayal
```

## Future Enhancements

1. **Style Presets**: Allow users to choose artistic styles
2. **Pose Variations**: Add action poses for dynamic characters
3. **Expression Control**: Specify emotions or expressions
4. **Background Scenes**: More detailed environment generation
5. **Multi-Character**: Support for group portraits