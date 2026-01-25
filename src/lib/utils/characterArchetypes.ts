// src/lib/utils/characterArchetypes.ts

import { World, CharacterArchetype } from '@/types/world.types';
import { GenreValue } from '@/lib/constants/genres';
import { generateUniqueId } from './generateId';
import { calculateCharacterLevel } from './characterLevel';
import {
  ARCHETYPE_TEMPLATES,
  PHYSICAL_DESCRIPTION_TEMPLATES,
  ArchetypeTemplate as ImportedArchetypeTemplate
} from '@/lib/constants/characterArchetypeTemplates';

export type { CharacterArchetype };
export type ArchetypeTemplate = ImportedArchetypeTemplate;

/**
 * Get archetype templates based on world genre
 */
export function getArchetypeTemplatesForGenre(genre: GenreValue): ArchetypeTemplate[] {
  return ARCHETYPE_TEMPLATES[genre] || ARCHETYPE_TEMPLATES.fantasy;
}
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    // FNV-1a like mixing
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0);
}

export async function generateCharacterArchetypes(
  world: World, 
  existingNames: string[] = []
): Promise<CharacterArchetype[]> {
  // Validate world data
  if (!world) {
    throw new Error('World data is required');
  }
  
  if (!world.genre) {
    throw new Error('World genre is required');
  }
  
  if (!Array.isArray(world.attributes) || world.attributes.length === 0) {
    throw new Error('World must have attributes array with at least one attribute');
  }
  
  if (!Array.isArray(world.skills) || world.skills.length === 0) {
    throw new Error('World must have skills array with at least one skill');
  }
  
  const templates = getArchetypeTemplatesForGenre(world.genre);
  const archetypes: CharacterArchetype[] = [];
  
  // Seed random deterministically based on world identity so quickstart UI is stable
  const seed = hashString(`${world.id}|${world.name}|${world.genre}`);
  setRandomFunction(createSeededRandom(seed));

  for (const template of templates) {
    try {
      const name = generateCharacterName(template, [...existingNames, ...archetypes.map(a => a.name)]);
      const personality = template.personalities[Math.floor(globalRandom() * template.personalities.length)];
      const motivation = template.motivations[Math.floor(globalRandom() * template.motivations.length)];
      const fears = template.fears[Math.floor(globalRandom() * template.fears.length)];
      
      const attributes = distributeAttributes(world.attributes, template, world.settings.attributePointPool);
      const skills = distributeSkills(world.skills, template, world.settings.skillPointPool);
      const level = calculateCharacterLevel(world, attributes);

      const archetype: CharacterArchetype = {
        id: generateUniqueId('archetype'),
        name,
        description: template.description,
        level,
        attributes,
        skills,
        background: {
          description: `${template.description} who has found their way to ${world.name}. ${personality}`,
          personality,
          motivation,
          fears,
          physicalDescription: generatePhysicalDescription(template, world.genre, world.name)
        }
      };
      
      archetypes.push(archetype);
    } catch (error) {
      console.error(`Failed to generate archetype for template ${template.name}:`, error);
      throw new Error(`Failed to generate archetype for ${template.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Reset random function if it was overridden elsewhere
  resetRandomFunction();
  
  return archetypes;
}

/**
 * Generate physical description based on archetype and genre
 */
function generatePhysicalDescription(template: ArchetypeTemplate, genre: GenreValue, worldName?: string): string {
  const ageRange = Math.floor(globalRandom() * 20) + 20; // 20-40 years old
  
  const builds = PHYSICAL_DESCRIPTION_TEMPLATES;// Using imported templates
  
  const build = builds[template.name as keyof typeof builds] || builds['Balanced'];
  const selectedBuild = build[Math.floor(globalRandom() * build.length)];
  
  const features = genre === 'fantasy' 
    ? ['piercing eyes', 'weathered hands', 'distinctive scars', 'noble bearing']
    : genre === 'sci-fi'
    ? ['cybernetic implants', 'radiation-resistant skin', 'zero-g adapted build', 'tech-enhanced features']
    : genre === 'western'
    ? ['sun-weathered skin', 'calloused hands', 'steely gaze', 'worn leather boots']
    : genre === 'historical'
    ? ['period-appropriate clothing', 'calloused hands', 'weathered features', 'traditional bearing']
    : genre === 'horror'
    ? ['haunted eyes', 'nervous demeanor', 'pale complexion', 'scarred features']
    : genre === 'mystery'
    ? ['sharp eyes', 'observant demeanor', 'professional appearance', 'analytical gaze']
    : genre === 'cyberpunk'
    ? ['neural interfaces', 'chrome augmentations', 'neon-lit tattoos', 'corporate modifications']
    : ['expressive eyes', 'confident posture', 'street-smart appearance', 'modern style'];
  
  const selectedFeature = features[Math.floor(globalRandom() * features.length)];
  
  return `${ageRange}-year-old human with a ${selectedBuild} build and ${selectedFeature}, perfectly suited for the ${genre} setting of ${worldName || 'this world'}.`;
}

/**
 * Generate a random archetype from the available options
 */
export async function generateRandomArchetype(world: World, existingNames: string[] = []): Promise<CharacterArchetype> {
  
  const archetypes = await generateCharacterArchetypes(world, existingNames);
  const randomIndex = Math.floor(globalRandom() * archetypes.length);
  
  // Modify the selected archetype to be more randomized
  const selectedArchetype = archetypes[randomIndex];
  
  // Randomize the name further
  const templates = getArchetypeTemplatesForGenre(world.genre);
  const allNameTemplates = templates.flatMap(t => t.nameTemplates);
  const randomBaseName = allNameTemplates[Math.floor(globalRandom() * allNameTemplates.length)];
  
  selectedArchetype.name = generateCharacterName(
    { ...templates[0], nameTemplates: [randomBaseName] }, 
    existingNames
  );
  
  // Add some random variation to attributes (±1)
  selectedArchetype.attributes = selectedArchetype.attributes.map(attr => ({
    ...attr,
    value: Math.max(
      world.attributes.find(wa => wa.id === attr.id)?.minValue || 1,
      Math.min(
        world.attributes.find(wa => wa.id === attr.id)?.maxValue || 10,
        attr.value + (globalRandom() > 0.5 ? 1 : -1)
      )
    )
  }));
  
  // Reset random function if it was overridden elsewhere
  resetRandomFunction();
  
  return selectedArchetype;
}
function generateCharacterName(template: ArchetypeTemplate, existingNames: string[] = []): string {
  const baseName = template.nameTemplates[Math.floor(globalRandom() * template.nameTemplates.length)];
  
  // Add descriptive suffix based on archetype
  const suffixes = [
    `the ${template.name}`,
    `${baseName}son`,
    `${baseName}daughter`,
    'the Bold',
    'the Wise',
    'the Swift',
    'the Brave'
  ];
  
  let finalName = baseName;
  
  // If base name exists, try with suffix
  if (existingNames.includes(finalName)) {
    const suffix = suffixes[Math.floor(globalRandom() * suffixes.length)];
    finalName = `${baseName} ${suffix}`;
  }
  
  // If still exists, add number
  if (existingNames.includes(finalName)) {
    let counter = 1;
    while (existingNames.includes(`${baseName} ${counter}`)) {
      counter++;
    }
    finalName = `${baseName} ${counter}`;
  }
  
  return finalName;
}

/**
 * Distribute attribute points based on archetype preferences
 */
function distributeAttributes(
  worldAttributes: World['attributes'],
  template: ArchetypeTemplate,
  pointPool: number
): CharacterArchetype['attributes'] {
  // First, calculate ideal values based on template priorities
  const idealAttributes = worldAttributes.map(attr => {
    const isPrimary = template.primaryAttributes.some(primary =>
      attr.name.toLowerCase().includes(primary.toLowerCase()) ||
      primary.toLowerCase().includes(attr.name.toLowerCase())
    );

    const isSecondary = template.secondaryAttributes.some(secondary =>
      attr.name.toLowerCase().includes(secondary.toLowerCase()) ||
      secondary.toLowerCase().includes(attr.name.toLowerCase())
    );

    let value: number;
    const range = attr.maxValue - attr.minValue;

    if (isPrimary) {
      // Primary attributes: 70-100% of range
      value = Math.floor(attr.minValue + range * 0.7 + globalRandom() * range * 0.3);
    } else if (isSecondary) {
      // Secondary attributes: 50-80% of range
      value = Math.floor(attr.minValue + range * 0.5 + globalRandom() * range * 0.3);
    } else {
      // Other attributes: 20-60% of range
      value = Math.floor(attr.minValue + range * 0.2 + globalRandom() * range * 0.4);
    }

    // Ensure within bounds
    value = Math.max(attr.minValue, Math.min(attr.maxValue, value));

    return {
      id: attr.id,
      name: attr.name,
      value,
      minValue: attr.minValue,
      maxValue: attr.maxValue
    };
  });

  // Calculate total and scale down if it exceeds the pool
  const idealTotal = idealAttributes.reduce((sum, attr) => sum + attr.value, 0);

  if (idealTotal <= pointPool) {
    // Under budget, use ideal values
    return idealAttributes.map(({ id, name, value }) => ({ id, name, value }));
  }

  // Over budget, scale down proportionally while maintaining minimums
  const minimumTotal = idealAttributes.reduce((sum, attr) => sum + attr.minValue, 0);
  const availablePoints = pointPool - minimumTotal;
  const idealPointsAboveMin = idealTotal - minimumTotal;

  if (availablePoints <= 0 || idealPointsAboveMin <= 0) {
    // Pool is too small or at minimum, return minimum values
    return idealAttributes.map(attr => ({
      id: attr.id,
      name: attr.name,
      value: attr.minValue
    }));
  }

  // Scale down proportionally
  const scaleFactor = availablePoints / idealPointsAboveMin;

  return idealAttributes.map(attr => {
    const pointsAboveMin = attr.value - attr.minValue;
    const scaledPointsAboveMin = Math.floor(pointsAboveMin * scaleFactor);
    const finalValue = attr.minValue + scaledPointsAboveMin;

    return {
      id: attr.id,
      name: attr.name,
      value: Math.max(attr.minValue, Math.min(attr.maxValue, finalValue))
    };
  });
}

/**
 * Distribute skill levels based on archetype preferences
 */
function distributeSkills(
  worldSkills: World['skills'],
  template: ArchetypeTemplate,
  pointPool: number
): CharacterArchetype['skills'] {
  // First, calculate ideal levels based on template preferences
  const idealSkills = worldSkills.map(skill => {
    const isPreferred = template.preferredSkills.some(preferred =>
      skill.name.toLowerCase().includes(preferred.toLowerCase()) ||
      preferred.toLowerCase().includes(skill.name.toLowerCase())
    );

    let level: number;

    if (isPreferred) {
      // Preferred skills: 6-9 (competent to expert)
      level = Math.floor(globalRandom() * 4) + 6;
    } else {
      // Other skills: 1-6 (beginner to competent)
      level = Math.floor(globalRandom() * 6) + 1;
    }

    // Ensure within bounds (1-10 default, but respect world skill bounds if provided)
    const minLevel = skill.minValue ?? 1;
    const maxLevel = skill.maxValue ?? 10;
    level = Math.max(minLevel, Math.min(maxLevel, level));

    return {
      id: skill.id,
      name: skill.name,
      level,
      minLevel,
      maxLevel
    };
  });

  // Calculate total and scale down if it exceeds the pool
  const idealTotal = idealSkills.reduce((sum, skill) => sum + skill.level, 0);

  if (idealTotal <= pointPool) {
    // Under budget, use ideal levels
    return idealSkills.map(({ id, name, level }) => ({ id, name, level }));
  }

  // Over budget, scale down proportionally while maintaining minimums
  const minimumTotal = idealSkills.reduce((sum, skill) => sum + skill.minLevel, 0);
  const availablePoints = pointPool - minimumTotal;
  const idealPointsAboveMin = idealTotal - minimumTotal;

  if (availablePoints <= 0 || idealPointsAboveMin <= 0) {
    // Pool is too small or at minimum, return minimum levels
    return idealSkills.map(skill => ({
      id: skill.id,
      name: skill.name,
      level: skill.minLevel
    }));
  }

  // Scale down proportionally
  const scaleFactor = availablePoints / idealPointsAboveMin;

  return idealSkills.map(skill => {
    const pointsAboveMin = skill.level - skill.minLevel;
    const scaledPointsAboveMin = Math.floor(pointsAboveMin * scaleFactor);
    const finalLevel = skill.minLevel + scaledPointsAboveMin;

    return {
      id: skill.id,
      name: skill.name,
      level: Math.max(skill.minLevel, Math.min(skill.maxLevel, finalLevel))
    };
  });
}

/**
 * Generate character archetypes for quick start
 */
/**
 * Simple seeded random number generator for consistent test results
 */
function createSeededRandom(seed: number = 12345) {
  let state = seed;
  return function() {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * Global random function that can be overridden for testing
 */
let globalRandom = Math.random;

/**
 * Set random function for testing
 */
function setRandomFunction(randomFn: () => number) {
  globalRandom = randomFn;
}

/**
 * Reset random function to default Math.random
 */
function resetRandomFunction() {
  globalRandom = Math.random;
}
