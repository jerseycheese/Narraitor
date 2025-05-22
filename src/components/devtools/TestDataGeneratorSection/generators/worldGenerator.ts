import { generateUniqueId } from '@/lib/utils/generateId';

const themes = [
  { 
    genre: 'fantasy', 
    name: 'The Realm of Eldoria', 
    description: 'A high fantasy world of magic and dragons where ancient powers stir and heroes rise to meet their destiny'
  },
  { 
    genre: 'sci-fi', 
    name: 'Neo Terra 2185', 
    description: 'A cyberpunk dystopia in the far future where mega-corporations rule and technology blurs the line between human and machine'
  },
  { 
    genre: 'western', 
    name: 'Dustwood County', 
    description: 'A lawless frontier town in the old west where justice comes from the barrel of a gun and honor is everything'
  },
  { 
    genre: 'modern', 
    name: 'Metropolis Heights', 
    description: 'A contemporary urban setting full of intrigue, where secrets hide behind every corner and power plays shape the city'
  },
  {
    genre: 'horror',
    name: 'Ravenshollow',
    description: 'A mist-shrouded town where ancient evils lurk and the line between nightmare and reality grows thin'
  },
];

const fantasyAttributes = [
  { name: 'Strength', category: 'Physical' },
  { name: 'Dexterity', category: 'Physical' },
  { name: 'Constitution', category: 'Physical' },
  { name: 'Intelligence', category: 'Mental' },
  { name: 'Wisdom', category: 'Mental' },
  { name: 'Charisma', category: 'Social' },
];

const scifiAttributes = [
  { name: 'Body', category: 'Physical' },
  { name: 'Reflexes', category: 'Physical' },
  { name: 'Tech', category: 'Technical' },
  { name: 'Intel', category: 'Mental' },
  { name: 'Cool', category: 'Social' },
  { name: 'Empathy', category: 'Social' },
];

const westernAttributes = [
  { name: 'Grit', category: 'Physical' },
  { name: 'Quick Draw', category: 'Physical' },
  { name: 'Riding', category: 'Skills' },
  { name: 'Sharpshooting', category: 'Skills' },
  { name: 'Charm', category: 'Social' },
  { name: 'Intimidation', category: 'Social' },
];

const modernAttributes = [
  { name: 'Fitness', category: 'Physical' },
  { name: 'Awareness', category: 'Mental' },
  { name: 'Education', category: 'Mental' },
  { name: 'Influence', category: 'Social' },
  { name: 'Resources', category: 'Social' },
  { name: 'Composure', category: 'Mental' },
];

const fantasySkills = [
  { name: 'Swordsmanship', category: 'Combat', difficulty: 'medium' },
  { name: 'Archery', category: 'Combat', difficulty: 'medium' },
  { name: 'Magic', category: 'Arcane', difficulty: 'hard' },
  { name: 'Stealth', category: 'Subterfuge', difficulty: 'medium' },
  { name: 'Diplomacy', category: 'Social', difficulty: 'medium' },
  { name: 'Survival', category: 'Wilderness', difficulty: 'easy' },
  { name: 'Healing', category: 'Support', difficulty: 'medium' },
  { name: 'Alchemy', category: 'Crafting', difficulty: 'hard' },
  { name: 'Athletics', category: 'Physical', difficulty: 'easy' },
  { name: 'Perception', category: 'Mental', difficulty: 'easy' },
  { name: 'Lore', category: 'Knowledge', difficulty: 'medium' },
  { name: 'Intimidation', category: 'Social', difficulty: 'medium' },
];

const scifiSkills = [
  { name: 'Hacking', category: 'Tech', difficulty: 'hard' },
  { name: 'Cyberware', category: 'Tech', difficulty: 'medium' },
  { name: 'Firearms', category: 'Combat', difficulty: 'medium' },
  { name: 'Piloting', category: 'Vehicle', difficulty: 'medium' },
  { name: 'Engineering', category: 'Tech', difficulty: 'hard' },
  { name: 'Streetwise', category: 'Social', difficulty: 'easy' },
  { name: 'Medicine', category: 'Science', difficulty: 'hard' },
  { name: 'Athletics', category: 'Physical', difficulty: 'easy' },
  { name: 'Persuasion', category: 'Social', difficulty: 'medium' },
  { name: 'Stealth', category: 'Subterfuge', difficulty: 'medium' },
];

export const generateTestWorld = () => {
  const selected = themes[Math.floor(Math.random() * themes.length)];
  const timestamp = Date.now();
  
  return {
    name: `${selected.name} (Test ${timestamp})`,
    description: selected.description,
    theme: selected.genre,
    attributes: generateGenreAttributes(selected.genre),
    skills: generateGenreSkills(selected.genre),
    settings: {
      maxAttributes: 6,
      maxSkills: 12,
      attributePointPool: 27,
      skillPointPool: 20,
    },
  };
};

const generateGenreAttributes = (genre: string) => {
  let attributeTemplates;
  
  switch (genre) {
    case 'sci-fi':
      attributeTemplates = scifiAttributes;
      break;
    case 'western':
      attributeTemplates = westernAttributes;
      break;
    case 'modern':
    case 'horror':
      attributeTemplates = modernAttributes;
      break;
    default:
      attributeTemplates = fantasyAttributes;
  }
  
  return attributeTemplates.map(attr => ({
    id: generateUniqueId('attr'),
    name: attr.name,
    worldId: '', // Will be set when world is created
    baseValue: 10,
    minValue: 1,
    maxValue: 10,
    category: attr.category,
  }));
};

const generateGenreSkills = (genre: string) => {
  let skillTemplates;
  
  switch (genre) {
    case 'sci-fi':
      skillTemplates = scifiSkills;
      break;
    case 'western':
      skillTemplates = [
        { name: 'Gunslinging', category: 'Combat', difficulty: 'medium' },
        { name: 'Riding', category: 'Physical', difficulty: 'easy' },
        { name: 'Gambling', category: 'Social', difficulty: 'medium' },
        { name: 'Tracking', category: 'Wilderness', difficulty: 'medium' },
        { name: 'Brawling', category: 'Combat', difficulty: 'easy' },
        { name: 'Intimidation', category: 'Social', difficulty: 'medium' },
        { name: 'Survival', category: 'Wilderness', difficulty: 'easy' },
        { name: 'Medicine', category: 'Support', difficulty: 'hard' },
        { name: 'Deception', category: 'Social', difficulty: 'medium' },
        { name: 'Athletics', category: 'Physical', difficulty: 'easy' },
      ];
      break;
    case 'modern':
    case 'horror':
      skillTemplates = [
        { name: 'Investigation', category: 'Mental', difficulty: 'medium' },
        { name: 'Technology', category: 'Technical', difficulty: 'medium' },
        { name: 'Driving', category: 'Vehicle', difficulty: 'easy' },
        { name: 'Firearms', category: 'Combat', difficulty: 'hard' },
        { name: 'First Aid', category: 'Support', difficulty: 'medium' },
        { name: 'Persuasion', category: 'Social', difficulty: 'medium' },
        { name: 'Athletics', category: 'Physical', difficulty: 'easy' },
        { name: 'Stealth', category: 'Subterfuge', difficulty: 'medium' },
        { name: 'Research', category: 'Mental', difficulty: 'easy' },
        { name: 'Networking', category: 'Social', difficulty: 'medium' },
      ];
      break;
    default:
      skillTemplates = fantasySkills;
  }
  
  return skillTemplates.map(skill => ({
    id: generateUniqueId('skill'),
    name: skill.name,
    worldId: '', // Will be set when world is created
    linkedAttributeId: undefined,
    difficulty: skill.difficulty as any,
    category: skill.category,
    baseValue: 1,
    minValue: 1,
    maxValue: 5,
  }));
};