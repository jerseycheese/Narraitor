/**
 * Structured Lore Extractor
 * Uses AI to extract structured lore data from narrative text
 */

import { geminiClient } from './geminiClient';
import type { StructuredLoreExtraction } from '@/types';

/**
 * Extract structured lore from narrative text using AI
 */
export async function extractStructuredLore(
  narrativeText: string,
  existingLoreContext?: string
): Promise<StructuredLoreExtraction> {
  try {
    const prompt = buildLoreExtractionPrompt(narrativeText, existingLoreContext);
    const response = await geminiClient.generateContent(prompt);
    
    if (!response.content) {
      return getEmptyExtraction();
    }

    // Try to parse the JSON response
    const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      throw new Error('No JSON block found in AI response');
    }

    const extractedLore = JSON.parse(jsonMatch[1]) as StructuredLoreExtraction;
    return validateAndCleanExtraction(extractedLore);
    
  } catch (error) {
    console.warn('Failed to extract structured lore:', error);
    return getEmptyExtraction();
  }
}

/**
 * Build the prompt for lore extraction
 */
function buildLoreExtractionPrompt(narrativeText: string, existingLoreContext?: string): string {
  const existingContext = existingLoreContext ? `\n\nExisting Lore Context:\n${existingLoreContext}` : '';
  
  return `You are a lore extraction system. Analyze the following narrative text and extract important facts as structured JSON.

Extract only NEW or SIGNIFICANT information that would be important for maintaining story consistency. Avoid extracting generic or obvious information.

Categories to extract:
- **Characters**: Named individuals with their roles/descriptions
- **Locations**: Named places with types and descriptions  
- **Events**: Significant happenings that should be remembered
- **Rules**: Game mechanics, magic systems, or world rules mentioned
- **Relationships**: Important connections between entities (optional)

Rate importance as 'low', 'medium', or 'high' based on narrative significance.

Narrative Text:
${narrativeText}${existingContext}

Respond with ONLY a JSON block in this exact format:

\`\`\`json
{
  "characters": [
    {
      "name": "Character Name",
      "description": "Brief description",
      "role": "their role/title",
      "importance": "low|medium|high",
      "tags": ["tag1", "tag2"]
    }
  ],
  "locations": [
    {
      "name": "Location Name", 
      "type": "city|tavern|forest|etc",
      "description": "Brief description",
      "importance": "low|medium|high",
      "tags": ["tag1", "tag2"]
    }
  ],
  "events": [
    {
      "description": "What happened",
      "significance": "Why it matters",
      "importance": "low|medium|high", 
      "relatedEntities": ["entity1", "entity2"]
    }
  ],
  "rules": [
    {
      "rule": "The rule or mechanic",
      "context": "When/how it applies",
      "importance": "low|medium|high",
      "tags": ["tag1", "tag2"]
    }
  ],
  "relationships": [
    {
      "from": "Entity 1",
      "to": "Entity 2", 
      "type": "ally|enemy|mentor|etc",
      "description": "Nature of relationship"
    }
  ]
}
\`\`\``;
}

/**
 * Validate and clean the extracted lore
 */
function validateAndCleanExtraction(extraction: any): StructuredLoreExtraction {
  const cleaned: StructuredLoreExtraction = {
    characters: [],
    locations: [],
    events: [],
    rules: [],
    relationships: []
  };

  // Validate characters
  if (Array.isArray(extraction.characters)) {
    cleaned.characters = extraction.characters
      .filter((char: any) => char.name && typeof char.name === 'string')
      .map((char: any) => ({
        name: char.name.trim(),
        description: typeof char.description === 'string' ? char.description.trim() : undefined,
        role: typeof char.role === 'string' ? char.role.trim() : undefined,
        importance: ['low', 'medium', 'high'].includes(char.importance) ? char.importance : 'medium',
        tags: Array.isArray(char.tags) ? char.tags.filter((t: any) => typeof t === 'string') : undefined
      }));
  }

  // Validate locations
  if (Array.isArray(extraction.locations)) {
    cleaned.locations = extraction.locations
      .filter((loc: any) => loc.name && typeof loc.name === 'string')
      .map((loc: any) => ({
        name: loc.name.trim(),
        type: typeof loc.type === 'string' ? loc.type.trim() : undefined,
        description: typeof loc.description === 'string' ? loc.description.trim() : undefined,
        importance: ['low', 'medium', 'high'].includes(loc.importance) ? loc.importance : 'medium',
        tags: Array.isArray(loc.tags) ? loc.tags.filter((t: any) => typeof t === 'string') : undefined
      }));
  }

  // Validate events
  if (Array.isArray(extraction.events)) {
    cleaned.events = extraction.events
      .filter((event: any) => event.description && typeof event.description === 'string')
      .map((event: any) => ({
        description: event.description.trim(),
        significance: typeof event.significance === 'string' ? event.significance.trim() : undefined,
        importance: ['low', 'medium', 'high'].includes(event.importance) ? event.importance : 'medium',
        relatedEntities: Array.isArray(event.relatedEntities) ? 
          event.relatedEntities.filter((e: any) => typeof e === 'string') : undefined
      }));
  }

  // Validate rules
  if (Array.isArray(extraction.rules)) {
    cleaned.rules = extraction.rules
      .filter((rule: any) => rule.rule && typeof rule.rule === 'string')
      .map((rule: any) => ({
        rule: rule.rule.trim(),
        context: typeof rule.context === 'string' ? rule.context.trim() : undefined,
        importance: ['low', 'medium', 'high'].includes(rule.importance) ? rule.importance : 'medium',
        tags: Array.isArray(rule.tags) ? rule.tags.filter((t: any) => typeof t === 'string') : undefined
      }));
  }

  // Validate relationships
  if (Array.isArray(extraction.relationships)) {
    cleaned.relationships = extraction.relationships
      .filter((rel: any) => rel.from && rel.to && rel.type && 
        typeof rel.from === 'string' && typeof rel.to === 'string' && typeof rel.type === 'string')
      .map((rel: any) => ({
        from: rel.from.trim(),
        to: rel.to.trim(),
        type: rel.type.trim(),
        description: typeof rel.description === 'string' ? rel.description.trim() : undefined
      }));
  }

  return cleaned;
}

/**
 * Return empty extraction structure
 */
function getEmptyExtraction(): StructuredLoreExtraction {
  return {
    characters: [],
    locations: [],
    events: [],
    rules: [],
    relationships: []
  };
}