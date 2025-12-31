/**
 * Attribute Narrative Enhancer
 *
 * Adds contextual flavor text to narratives based on character attributes.
 * Examples: "Your keen intellect notices..." for high Intelligence
 */

import { getAttributeDescriptor, normalizeAttributeArray } from './attributeSkillFormatter';

/**
 * Context for generating attribute-aware flavor text
 */
export interface AttributeContext {
  attributeId: string;
  descriptor: string;
  situation: 'observation' | 'action' | 'challenge' | 'interaction';
}

/**
 * Attribute flavor text templates
 * Maps attribute + descriptor + situation to contextual phrases
 */
const ATTRIBUTE_FLAVOR_TEMPLATES: Record<string, Record<string, string[]>> = {
  intelligence: {
    Exceptional_observation: [
      'Your keen intellect notices',
      'Your sharp mind observes',
      'Your analytical nature reveals',
      'Your exceptional insight shows'
    ],
    Exceptional_challenge: [
      'Your brilliant mind quickly grasps',
      'Your sharp intellect cuts through',
      'Your keen understanding illuminates'
    ],
    High_observation: [
      'Your clever mind notices',
      'Your quick thinking reveals',
      'Your sharp wit observes'
    ],
    High_challenge: [
      'Your intelligence serves you well as',
      'Your sharp mind helps you grasp'
    ],
    Low_challenge: [
      'You struggle to understand',
      'The complexity confounds you',
      'You find it difficult to grasp'
    ]
  },
  dexterity: {
    Exceptional_action: [
      'With exceptional agility, you',
      'Your nimble fingers',
      'Your swift movements',
      'With practiced grace, you'
    ],
    High_action: [
      'Your agile hands',
      'With quick reflexes, you',
      'Your deft movements'
    ],
    Low_action: [
      'Your clumsy attempt',
      'Your fumbling fingers',
      'Your awkward movements'
    ]
  },
  strength: {
    Exceptional_action: [
      'With tremendous strength, you',
      'Your powerful muscles',
      'Your mighty force'
    ],
    Exceptional_challenge: [
      'Your exceptional strength makes',
      'Your raw power allows you to'
    ],
    High_action: [
      'With considerable strength, you',
      'Your strong arms',
      'Your physical power'
    ],
    Low_challenge: [
      'You strain against',
      'Your limited strength struggles with',
      'The weight proves challenging for'
    ],
    Low_action: [
      'With effort, you',
      'Struggling somewhat, you',
      'Despite your weakness, you'
    ]
  },
  charisma: {
    Exceptional_interaction: [
      'Your magnetic presence',
      'Your compelling charm',
      'Your natural charisma',
      'Your persuasive manner'
    ],
    High_interaction: [
      'Your friendly demeanor',
      'Your confident bearing',
      'Your convincing words'
    ],
    Low_interaction: [
      'Your awkward approach',
      'Your clumsy social attempt',
      'Despite your social discomfort,'
    ]
  },
  wisdom: {
    Exceptional_observation: [
      'Your profound wisdom reveals',
      'Your deep understanding shows',
      'Your keen perception notices'
    ],
    High_observation: [
      'Your perceptive nature notes',
      'Your awareness catches',
      'Your insight reveals'
    ]
  },
  constitution: {
    Exceptional_challenge: [
      'Your exceptional endurance sustains you',
      'Your robust health allows',
      'Your hardy constitution enables'
    ],
    Low_challenge: [
      'Your frail constitution struggles',
      'Your limited stamina makes',
      'Your weakened state hinders'
    ]
  },
  // Aliases for common custom attribute names
  cunning: {
    Exceptional_observation: [
      'Your sharp cunning notices',
      'Your crafty mind observes',
      'Your shrewd nature reveals',
      'Your exceptional guile shows'
    ],
    Exceptional_challenge: [
      'Your brilliant cunning quickly grasps',
      'Your sharp wits cut through',
      'Your keen cunning illuminates'
    ],
    High_observation: [
      'Your clever mind notices',
      'Your quick wits reveal',
      'Your cunning observes'
    ],
    High_challenge: [
      'Your cunning serves you well as',
      'Your sharp mind helps you grasp'
    ],
    Low_challenge: [
      'You struggle to understand',
      'The complexity confounds you',
      'You find it difficult to grasp'
    ]
  },
  toughness: {
    Exceptional_challenge: [
      'Your exceptional toughness sustains you',
      'Your rugged resilience allows',
      'Your hardy nature enables'
    ],
    High_challenge: [
      'Your toughness serves you well',
      'Your resilience helps you endure'
    ],
    Low_challenge: [
      'Your limited resilience struggles',
      'Your lack of toughness makes',
      'Your weakened state hinders'
    ]
  },
  brawn: {
    Exceptional_action: [
      'With tremendous brawn, you',
      'Your powerful muscles',
      'Your mighty strength'
    ],
    Exceptional_challenge: [
      'Your exceptional brawn makes',
      'Your raw power allows you to'
    ],
    High_action: [
      'With considerable brawn, you',
      'Your strong arms',
      'Your physical power'
    ],
    Low_challenge: [
      'You strain against',
      'Your limited brawn struggles with',
      'The weight proves challenging for'
    ],
    Low_action: [
      'With effort, you',
      'Struggling somewhat, you',
      'Despite your weakness, you'
    ]
  }
};

/**
 * Get contextual flavor text for an attribute
 *
 * @param context - Attribute context including ID, descriptor, and situation
 * @returns Flavor text or empty string if not applicable
 */
export function getAttributeFlavorText(context: AttributeContext): string {
  const { attributeId, descriptor, situation } = context;

  // Skip moderate attributes (already filtered in formatter, but double-check)
  if (descriptor === 'Moderate' || descriptor === 'Very Low') {
    return '';
  }

  // Normalize attribute ID (remove prefixes like "attr-")
  const normalizedAttrId = attributeId.replace(/^attr-/i, '').toLowerCase();

  // Get templates for this attribute
  const attributeTemplates = ATTRIBUTE_FLAVOR_TEMPLATES[normalizedAttrId];
  if (!attributeTemplates) {
    return ''; // Unknown attribute
  }

  // Build template key: descriptor_situation
  const templateKey = `${descriptor}_${situation}`;
  const templates = attributeTemplates[templateKey];

  if (!templates || templates.length === 0) {
    return ''; // No templates for this combination
  }

  // Randomly select a template for variety
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

/**
 * Enhance narrative text with attribute-aware flavor
 *
 * Adds contextual phrases based on character's notable attributes.
 * Only enhances narratives that are long enough and in appropriate contexts.
 *
 * @param narrative - Original narrative text
 * @param attributes - Character attributes (Record or Array format)
 * @returns Enhanced narrative with attribute flavor text
 */
export function enhanceNarrativeWithAttributes(
  narrative: string,
  attributes: Record<string, number> | Array<{ attributeId: string; value: number }>
): string {
  // Don't enhance very short narratives (< 20 chars)
  if (narrative.length < 20) {
    return narrative;
  }

  // Normalize attributes to array format
  const normalizedAttrs = normalizeAttributeArray(attributes);

  // Get notable attributes (filter out moderate)
  const notableAttrs = normalizedAttrs
    .map(attr => ({
      attributeId: attr.attributeId,
      descriptor: getAttributeDescriptor(attr.value),
      value: attr.value
    }))
    .filter(attr => attr.descriptor !== 'Moderate');

  if (notableAttrs.length === 0) {
    return narrative; // No notable attributes to enhance with
  }

  // Detect narrative situation from keywords
  const situation = detectSituation(narrative);

  // Try each notable attribute until we find one with applicable flavor
  // Randomize order for variety
  const shuffledAttrs = [...notableAttrs].sort(() => Math.random() - 0.5);

  for (const attr of shuffledAttrs) {
    const flavor = getAttributeFlavorText({
      attributeId: attr.attributeId,
      descriptor: attr.descriptor,
      situation
    });

    if (flavor) {
      // Insert flavor text at an appropriate point
      return injectFlavorText(narrative, flavor);
    }
  }

  return narrative; // No applicable flavor found
}

/**
 * Detect the narrative situation from content keywords
 */
function detectSituation(narrative: string): AttributeContext['situation'] {
  const lower = narrative.toLowerCase();

  // Check for keywords that indicate situation type
  if (/examine|notice|observe|see|spot|find|detect|perceive/.test(lower)) {
    return 'observation';
  }

  if (/reach|grab|move|climb|jump|dodge|catch|throw|manipulate/.test(lower)) {
    return 'action';
  }

  if (/struggle|difficult|challenge|overcome|resist|endure|withstand/.test(lower)) {
    return 'challenge';
  }

  if (/speak|talk|persuade|convince|charm|negotiate|greet|address/.test(lower)) {
    return 'interaction';
  }

  // Default to observation for general narration
  return 'observation';
}

/**
 * Inject flavor text into narrative at an appropriate point
 */
function injectFlavorText(narrative: string, flavor: string): string {
  // Find the first sentence (ends with . ! ?)
  const firstSentenceMatch = narrative.match(/^([^.!?]+[.!?])/);

  if (!firstSentenceMatch) {
    // No clear sentence structure, prepend flavor
    return `${flavor} ${narrative.charAt(0).toLowerCase()}${narrative.slice(1)}`;
  }

  const firstSentence = firstSentenceMatch[1];
  const rest = narrative.slice(firstSentence.length).trim();

  // Check if flavor text is a complete sentence or fragment
  const isCompleteSentence = flavor.match(/[.!?]$/);

  if (isCompleteSentence) {
    // Flavor is complete sentence, add before first sentence
    return `${flavor} ${narrative}`;
  } else {
    // Flavor is fragment, integrate into first sentence
    // Replace "You" at start with the flavor text
    if (firstSentence.match(/^You\s+/i)) {
      const modifiedSentence = firstSentence.replace(/^You\s+/i, `${flavor} `);
      return rest ? `${modifiedSentence} ${rest}` : modifiedSentence;
    } else {
      // Prepend as separate sentence
      return `${flavor}. ${narrative}`;
    }
  }
}
