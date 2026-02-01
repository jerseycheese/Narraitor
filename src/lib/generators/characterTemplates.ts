import { World } from '@/types/world.types';
import { calculateCharacterLevel } from '@/lib/utils/characterLevel';

// Character level range for generated characters
export const CHARACTER_LEVEL_RANGE = { min: 1, max: 5 };

export interface GeneratedCharacterData {
  name: string;
  background: {
    description: string;
    personality: string;
    motivation: string;
    fears: string[];
    physicalDescription?: string;
  };
  attributes: Array<{
    id: string;
    value: number;
  }>;
  skills: Array<{
    id: string;
    level: number;
  }>;
  level: number;
  isKnownFigure?: boolean;
  characterType?: 'protagonist' | 'antagonist' | 'supporting' | 'original';
}

export type CharacterGenerationMethod = 'template' | 'ai';
export type CharacterGenerationType = 'known' | 'original' | 'specific';

export interface CharacterGenerationOptions {
  method: CharacterGenerationMethod;
  world: World;
  existingNames?: string[];
  suggestedName?: string;
  generationType?: CharacterGenerationType;
}

/**
 * Generate character from predefined templates
 * Pure deterministic function, safe for client-side use.
 */
export function generateFromTemplate(options: CharacterGenerationOptions): GeneratedCharacterData {
  const { world } = options;
  
  // Simple template-based character generation
  const characterNames = [
    'Aelwyn', 'Bjorn', 'Cassandra', 'Dorian', 'Elena', 'Finn',
    'Gwendolyn', 'Henrik', 'Isla', 'Jaxon', 'Kira', 'Lysander',
    'Mira', 'Nolan', 'Ophelia', 'Phoenix', 'Quinn', 'Raven',
    'Sage', 'Thorne', 'Una', 'Vex', 'Wren', 'Xara', 'Yuki', 'Zara'
  ];
  
  const personalities = [
    'Brave and determined, always ready to face danger head-on',
    'Cunning and strategic, preferring to outthink opponents',
    'Compassionate and healing, dedicated to helping others',
    'Mysterious and aloof, harboring deep secrets',
    'Cheerful and optimistic, finding hope in dark times',
    'Stern and disciplined, following a strict code of honor'
  ];
  
  const motivations = [
    'Seeking revenge for a great wrong',
    'Protecting loved ones from harm',
    'Uncovering ancient mysteries',
    'Proving their worth to others',
    'Finding their true purpose in life',
    'Restoring balance to the world'
  ];
  
  const fears = [
    ['Failure', 'Being alone', 'Loss of control'],
    ['Betrayal', 'The dark', 'Being forgotten'],
    ['Heights', 'Enclosed spaces', 'Public speaking'],
    ['Death', 'Abandonment', 'Making the wrong choice'],
    ['The unknown', 'Being judged', 'Losing their identity']
  ];
  
  // Pick random elements
  const baseName = options.suggestedName || characterNames[Math.floor(Math.random() * characterNames.length)];
  let finalName = baseName;
  
  // Ensure unique name
  if (options.existingNames?.includes(finalName)) {
    let suffix = 1;
    while (options.existingNames.includes(`${baseName} ${suffix}`)) {
      suffix++;
    }
    finalName = `${baseName} ${suffix}`;
  }
  
  // Generate varied attribute values
  const attributes = world.attributes.map(attr => ({
    id: attr.id,
    value: Math.floor(Math.random() * (attr.maxValue - attr.minValue + 1)) + attr.minValue
  }));
  
  // Generate varied skill levels (some selected, some not)
  const selectedSkills = world.skills
    .sort(() => Math.random() - 0.5) // Shuffle
    .slice(0, Math.floor(world.skills.length * 0.7)) // Select 70%
    .map(skill => ({
      id: skill.id,
      level: Math.floor(Math.random() * 5) + 1 // 1-5
    }));
  
  const level = calculateCharacterLevel(world, attributes);

  return {
    name: finalName,
    level,
    background: {
      description: `A mysterious figure with an interesting past${world.reference ? ` from the ${world.reference} universe` : ''}.`,
      personality: personalities[Math.floor(Math.random() * personalities.length)],
      motivation: motivations[Math.floor(Math.random() * motivations.length)],
      fears: fears[Math.floor(Math.random() * fears.length)],
      physicalDescription: `${Math.floor(Math.random() * 40) + 20}-year-old human of average height and build with distinctive features befitting the ${world.genre} setting.`
    },
    attributes,
    skills: selectedSkills,
    isKnownFigure: false,
    characterType: 'original'
  };
}
