import { World } from '@/types/world.types';

const firstNames = ['Aragorn', 'Gandalf', 'Frodo', 'Elara', 'Marcus', 'Luna', 'Kai', 'Zara', 'Thorin', 'Lyra'];
const lastNames = ['Stormwind', 'Ironforge', 'Brightblade', 'Shadowmere', 'Goldleaf', 'Starweaver', 'Moonwhisper'];
const descriptions = [
  'A brave warrior seeking redemption for past mistakes',
  'A wise sage with ancient knowledge and mystical powers',
  'An unlikely hero with a mysterious past and hidden talents',
  'A skilled ranger from the northern lands, master of survival',
  'A charismatic leader with a silver tongue and noble heart',
  'A cunning rogue with quick wits and quicker reflexes',
  'A devoted healer bringing hope to the downtrodden',
];

const personalities = [
  'Brave and loyal, always standing up for what is right',
  'Curious and intelligent, constantly seeking new knowledge',
  'Mischievous but kind-hearted, bringing joy to others',
  'Stoic and determined, never backing down from a challenge',
  'Compassionate and empathetic, feeling deeply for others',
];

const histories = {
  fantasy: [
    'Born in a small village on the edge of the Darkwood Forest, I learned early the importance of courage. When orcs raided our home, I picked up my father\'s sword and fought alongside the village guard. Though we lost much that day, I found my calling as a protector of the innocent.',
    'Raised in the grand libraries of Arcanum City, I spent my youth studying ancient tomes and forgotten languages. My discovery of a mysterious artifact led me on a journey across the realm, seeking answers to questions that could reshape our understanding of magic itself.',
  ],
  'sci-fi': [
    'Growing up in the lower levels of Neo Tokyo, I witnessed firsthand the inequality between the corporate elite and the street dwellers. After my brother was taken by CorpSec, I dedicated my life to exposing their crimes and fighting for justice in the shadows of the megacity.',
    'As a child on the mining colony of Kepler-442b, I always dreamed of the stars. When pirates attacked our settlement, I stowed away on their ship and eventually earned my place among the crew. Now I sail the cosmic seas, seeking adventure and redemption.',
  ],
  western: [
    'I rode into Dustwood County with nothing but the clothes on my back and a six-shooter at my hip. My past is written in the scars I bear, each one a reminder of the lawless frontier that shaped me. Now I stand between the innocent and those who would do them harm.',
    'Born on a cattle ranch outside Tombstone, I learned to ride before I could walk proper. When bandits killed my family and stole our herd, I took up the badge and the gun, swearing to bring justice to the untamed territories.',
  ],
  modern: [
    'After witnessing a crime that the authorities refused to investigate, I realized that sometimes justice needs a helping hand. By day I work a regular job, but by night I use my skills to help those who have nowhere else to turn in this city of shadows and secrets.',
    'Growing up on the streets taught me that survival requires both strength and smarts. I\'ve made my share of mistakes, but now I use what I\'ve learned to guide others away from the darkness that once consumed me.',
  ],
};

const goals = [
  'Become renowned throughout the land',
  'Discover the truth about my mysterious past',
  'Master the ancient arts of my craft',
  'Protect the innocent from harm',
  'Find a place to truly belong',
  'Uncover the secrets of the ancients',
  'Build a legacy that will last generations',
  'Bring justice to those who have none',
];

const motivations = [
  'To protect those who cannot protect themselves',
  'To uncover the truth, no matter the cost',
  'To prove myself worthy of my heritage',
  'To find redemption for past mistakes',
  'To bring hope to a world in darkness',
  'To master my abilities and reach my full potential',
];

export const generateTestCharacter = (world: World) => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${firstName} ${lastName}`;
  
  // Get appropriate history based on theme
  const themeHistories = histories[world.theme as keyof typeof histories] || histories.fantasy;
  const history = themeHistories[Math.floor(Math.random() * themeHistories.length)];
  
  // Generate attributes with random distribution
  const attributes = distributePointsRandomly(world.attributes, world.settings.attributePointPool);
  
  // Select random skills
  const selectedSkills = selectRandomSkills(world.skills, Math.min(Math.floor(Math.random() * 5) + 3, 8));
  
  // Generate random goals (2-4)
  const numGoals = Math.floor(Math.random() * 3) + 2;
  const selectedGoals = [];
  const goalsCopy = [...goals];
  for (let i = 0; i < numGoals && goalsCopy.length > 0; i++) {
    const index = Math.floor(Math.random() * goalsCopy.length);
    selectedGoals.push(goalsCopy[index]);
    goalsCopy.splice(index, 1);
  }
  
  return {
    name,
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    portraitPlaceholder: '',
    attributes,
    skills: selectedSkills,
    background: {
      history,
      personality: personalities[Math.floor(Math.random() * personalities.length)],
      goals: selectedGoals,
      motivation: motivations[Math.floor(Math.random() * motivations.length)],
    },
  };
};

const distributePointsRandomly = (worldAttributes: World['attributes'], totalPoints: number) => {
  const result = worldAttributes.map(attr => ({
    attributeId: attr.id,
    name: attr.name,
    value: attr.minValue,
    minValue: attr.minValue,
    maxValue: attr.maxValue,
  }));
  
  let remainingPoints = totalPoints - worldAttributes.length * worldAttributes[0].minValue;
  
  while (remainingPoints > 0) {
    const randomIndex = Math.floor(Math.random() * result.length);
    if (result[randomIndex].value < result[randomIndex].maxValue) {
      result[randomIndex].value++;
      remainingPoints--;
    }
  }
  
  return result;
};

const selectRandomSkills = (worldSkills: World['skills'], count: number) => {
  const shuffled = [...worldSkills].sort(() => Math.random() - 0.5);
  const selectedCount = Math.min(count, shuffled.length);
  
  return shuffled.map((skill, index) => ({
    skillId: skill.id,
    name: skill.name,
    level: index < selectedCount ? Math.floor(Math.random() * 4) + 1 : 1,
    linkedAttributeId: skill.linkedAttributeId,
    isSelected: index < selectedCount,
  }));
};