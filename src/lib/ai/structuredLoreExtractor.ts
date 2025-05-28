/**
 * Structured Lore Extractor
 * Uses AI to extract structured lore data from narrative text
 */

import { createDefaultGeminiClient } from './defaultGeminiClient';
import type { StructuredLoreExtraction } from '@/types/lore.types';

/**
 * Extract structured lore from narrative text using AI
 */
export async function extractStructuredLore(
  narrativeText: string,
  existingLoreContext?: string
): Promise<StructuredLoreExtraction> {
  try {
    const geminiClient = createDefaultGeminiClient();
    const prompt = buildLoreExtractionPrompt(narrativeText, existingLoreContext);
    const response = await geminiClient.generateContent(prompt);
    
    if (!response.content) {
      return getEmptyExtraction();
    }

    // Try to parse the JSON response
    const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      // If no JSON block found, try fallback mock extraction for testing
      console.warn('No JSON block found in AI response, using mock extraction for testing');
      return createMockExtraction(narrativeText);
    }

    const extractedLore = JSON.parse(jsonMatch[1]) as StructuredLoreExtraction;
    return validateAndCleanExtraction(extractedLore);
    
  } catch (error) {
    console.warn('Failed to extract structured lore:', error);
    // Fallback to mock extraction for demonstration
    return createMockExtraction(narrativeText);
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
function validateAndCleanExtraction(extraction: unknown): StructuredLoreExtraction {
  const cleaned: StructuredLoreExtraction = {
    characters: [],
    locations: [],
    events: [],
    rules: [],
    relationships: []
  };

  // Type guard and validate characters
  const extractionObj = extraction as Record<string, unknown>;
  if (Array.isArray(extractionObj.characters)) {
    cleaned.characters = (extractionObj.characters as Array<Record<string, unknown>>)
      .filter((char) => char.name && typeof char.name === 'string')
      .map((char) => ({
        name: (char.name as string).trim(),
        description: typeof char.description === 'string' ? char.description.trim() : undefined,
        role: typeof char.role === 'string' ? char.role.trim() : undefined,
        importance: ['low', 'medium', 'high'].includes(char.importance as string) ? char.importance as 'low' | 'medium' | 'high' : 'medium',
        tags: Array.isArray(char.tags) ? (char.tags as unknown[]).filter((t) => typeof t === 'string') as string[] : undefined
      }));
  }

  // Validate locations
  if (Array.isArray(extractionObj.locations)) {
    cleaned.locations = (extractionObj.locations as Array<Record<string, unknown>>)
      .filter((loc) => loc.name && typeof loc.name === 'string')
      .map((loc) => ({
        name: (loc.name as string).trim(),
        type: typeof loc.type === 'string' ? loc.type.trim() : undefined,
        description: typeof loc.description === 'string' ? loc.description.trim() : undefined,
        importance: ['low', 'medium', 'high'].includes(loc.importance as string) ? loc.importance as 'low' | 'medium' | 'high' : 'medium',
        tags: Array.isArray(loc.tags) ? (loc.tags as unknown[]).filter((t) => typeof t === 'string') as string[] : undefined
      }));
  }

  // Validate events
  if (Array.isArray(extractionObj.events)) {
    cleaned.events = (extractionObj.events as Array<Record<string, unknown>>)
      .filter((event) => event.description && typeof event.description === 'string')
      .map((event) => ({
        description: (event.description as string).trim(),
        significance: typeof event.significance === 'string' ? event.significance.trim() : undefined,
        importance: ['low', 'medium', 'high'].includes(event.importance as string) ? event.importance as 'low' | 'medium' | 'high' : 'medium',
        relatedEntities: Array.isArray(event.relatedEntities) ? 
          (event.relatedEntities as unknown[]).filter((e) => typeof e === 'string') as string[] : undefined
      }));
  }

  // Validate rules
  if (Array.isArray(extractionObj.rules)) {
    cleaned.rules = (extractionObj.rules as Array<Record<string, unknown>>)
      .filter((rule) => rule.rule && typeof rule.rule === 'string')
      .map((rule) => ({
        rule: (rule.rule as string).trim(),
        context: typeof rule.context === 'string' ? rule.context.trim() : undefined,
        importance: ['low', 'medium', 'high'].includes(rule.importance as string) ? rule.importance as 'low' | 'medium' | 'high' : 'medium',
        tags: Array.isArray(rule.tags) ? (rule.tags as unknown[]).filter((t) => typeof t === 'string') as string[] : undefined
      }));
  }

  // Validate relationships
  if (Array.isArray(extractionObj.relationships)) {
    cleaned.relationships = (extractionObj.relationships as Array<Record<string, unknown>>)
      .filter((rel) => rel.from && rel.to && rel.type && 
        typeof rel.from === 'string' && typeof rel.to === 'string' && typeof rel.type === 'string')
      .map((rel) => ({
        from: (rel.from as string).trim(),
        to: (rel.to as string).trim(),
        type: (rel.type as string).trim(),
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

/**
 * Create mock extraction for testing when AI is not available
 */
function createMockExtraction(narrativeText: string): StructuredLoreExtraction {
  const extraction: StructuredLoreExtraction = {
    characters: [],
    locations: [],
    events: [],
    rules: [],
    relationships: []
  };

  // Simple pattern matching for characters (titles + names)
  const characterMatches = narrativeText.match(/\b(Sir|Lady|Lord|Captain|Master|Dr\.|Professor|King|Queen|Prince|Princess)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g);
  if (characterMatches) {
    characterMatches.forEach(match => {
      const name = match.trim();
      extraction.characters.push({
        name,
        description: 'Character mentioned in narrative',
        role: match.toLowerCase().includes('sir') ? 'Knight' : 
              match.toLowerCase().includes('lady') ? 'Noble' :
              match.toLowerCase().includes('captain') ? 'Military Officer' : 'Person of importance',
        importance: 'medium'
      });
    });
  }

  // Simple pattern for locations
  const locationMatches = narrativeText.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:of\s+[A-Z][a-z]+|district|quarter|market|bridge|tower|citadel|castle|palace|temple|spire|dome|tavern)\b/gi);
  if (locationMatches) {
    locationMatches.forEach(match => {
      const name = match.trim();
      extraction.locations.push({
        name,
        description: 'Location mentioned in narrative',
        type: match.toLowerCase().includes('temple') ? 'religious site' :
              match.toLowerCase().includes('tavern') ? 'establishment' :
              match.toLowerCase().includes('market') ? 'commercial area' : 'place',
        importance: 'medium'
      });
    });
  }

  // Extract "city of X" patterns
  const cityMatches = narrativeText.match(/\b(?:city|town|village)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/gi);
  if (cityMatches) {
    cityMatches.forEach(match => {
      const nameMatch = match.match(/of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
      if (nameMatch) {
        extraction.locations.push({
          name: nameMatch[1],
          description: 'Settlement mentioned in narrative',
          type: 'city',
          importance: 'high'
        });
      }
    });
  }

  // Simple events extraction
  if (narrativeText.toLowerCase().includes('enter') || narrativeText.toLowerCase().includes('approach')) {
    extraction.events.push({
      description: 'Character arrives at a new location',
      significance: 'Beginning of a new scene or encounter',
      importance: 'medium'
    });
  }

  if (narrativeText.toLowerCase().includes('warn') || narrativeText.toLowerCase().includes('danger')) {
    extraction.events.push({
      description: 'Warning received about potential danger',
      significance: 'Important information for future decisions',
      importance: 'high'
    });
  }

  return extraction;
}