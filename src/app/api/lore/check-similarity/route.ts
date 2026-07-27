import { NextRequest } from 'next/server';
import Logger from '@/lib/utils/logger';
import { handleSimilarityCheck } from '@/app/api/_shared/similarityCheck';

const logger = new Logger('CheckLoreSimilarityAPI');

/**
 * Check if two lore entity names refer to the same entity
 * Uses AI to handle complex semantic similarity
 */
export async function POST(request: NextRequest) {
  return handleSimilarityCheck(request, {
    logger,
    errorLogMessage: 'Error checking lore similarity:',
    failureMessage: 'Failed to check lore similarity',
    buildPrompt: ({ name1, name2, category }) => {
      const categoryContext = category === 'characters'
      ? 'character names'
      : category === 'locations'
      ? 'location names'
      : 'entity names';

      return `Are these two ${categoryContext} referring to the same entity? You must respond with ONLY a JSON object in this exact format:
{
  "similar": true or false,
  "confidence": 0.0 to 1.0,
  "rationale": "brief explanation"
}

Name 1: "${name1}"
Name 2: "${name2}"

Consider:
- Spelling variations (Gandalf/Gandolf, Seraphina/Serafina)
- Title differences (Lady Seraphina vs Seraphina, Sir John vs John)
- Word order (John the Smith vs Smith, John)
- Nicknames and shortened forms (Elizabeth vs Liz, Jonathan vs Jon)
- Special characters and punctuation ("Sir John's Tavern" vs "Sir Johns Tavern")
- Common fantasy name variations
- Role or descriptor references (e.g. "Maya the counselor" and "Maya Chandra" — one names a role/occupation, the other a full name, sharing a given name)

If they clearly refer to the same entity, return similar: true with high confidence.
When one name is a role, title, or descriptor attached to a shared given name (e.g. "<Name> the <role>"), treat it as the SAME entity as a known character with that given name, unless the context clearly indicates two different people.
If they're definitely different entities, return similar: false.
For uncertain cases, adjust confidence accordingly.

Response (JSON only):`;
    },
  });
}
