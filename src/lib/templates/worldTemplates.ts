/**
 * World Templates Module
 * 
 * Provides predefined world templates (Western, Sitcom, Fantasy) for quick game setup.
 */

/**
 * Template data structures
 */
export interface WorldTemplate {
  id: string;
  name: string;
  description: string;
  genre: string;
  narrative?: string;
  attributes: AttributeTemplate[];
  skills: SkillTemplate[];
  theme: ThemeTemplate;
}

export interface AttributeTemplate {
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  defaultValue: number;
}

export interface SkillTemplate {
  name: string;
  description: string;
  relatedAttributes: string[]; // Names of attributes
  minValue: number;
  maxValue: number;
  defaultValue: number;
  linkedAttributes: string[]; // For template loader
  category?: string; // Optional category for the skill
}

export interface ThemeTemplate {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  backgroundStyle: string;
}

/**
 * Western template
 */
export const westernTemplate: WorldTemplate = {
  id: 'western',
  name: 'Western',
  description: 'A world set in the American frontier during the late 19th century.',
  genre: 'Western',
  attributes: [
    {
      name: 'Grit',
      description: 'Mental toughness and resilience in the face of hardship.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Quickdraw',
      description: 'Speed and accuracy when drawing weapons.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Charisma',
      description: 'Charm, persuasiveness, and leadership ability.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Strength',
      description: 'Physical power and endurance.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Wits',
      description: 'Problem-solving ability and cleverness.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Perception',
      description: 'Awareness of surroundings and attention to detail.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    }
  ],
  skills: [
    {
      name: 'Shooting',
      description: 'Accuracy with firearms.',
      relatedAttributes: ['Quickdraw', 'Perception'],
      linkedAttributes: ['Quickdraw', 'Perception'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Riding',
      description: 'Skill with horses and other mounts.',
      relatedAttributes: ['Strength'],
      linkedAttributes: ['Strength'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Survival',
      description: 'Ability to survive in the wilderness.',
      relatedAttributes: ['Grit', 'Wits'],
      linkedAttributes: ['Grit', 'Wits'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Brawling',
      description: 'Hand-to-hand combat ability.',
      relatedAttributes: ['Strength', 'Grit'],
      linkedAttributes: ['Strength', 'Grit'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Gambling',
      description: 'Skill at cards, dice, and other games of chance.',
      relatedAttributes: ['Wits', 'Charisma'],
      linkedAttributes: ['Wits', 'Charisma'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Intimidation',
      description: 'Ability to scare or coerce others.',
      relatedAttributes: ['Grit', 'Charisma'],
      linkedAttributes: ['Grit', 'Charisma'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Deception',
      description: 'Skill at lying and trickery.',
      relatedAttributes: ['Charisma', 'Wits'],
      linkedAttributes: ['Charisma', 'Wits'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Medicine',
      description: 'Knowledge of healing and remedies.',
      relatedAttributes: ['Wits'],
      linkedAttributes: ['Wits'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Tracking',
      description: 'Ability to follow trails and find people or animals.',
      relatedAttributes: ['Perception', 'Wits'],
      linkedAttributes: ['Perception', 'Wits'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Bargaining',
      description: 'Skill at negotiation and trade.',
      relatedAttributes: ['Charisma'],
      linkedAttributes: ['Charisma'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Animal Handling',
      description: 'Working with and caring for animals.',
      relatedAttributes: ['Perception', 'Charisma'],
      linkedAttributes: ['Perception', 'Charisma'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Lore',
      description: 'Knowledge of the frontier and its history.',
      relatedAttributes: ['Wits'],
      linkedAttributes: ['Wits'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    }
  ],
  theme: {
    name: 'Western',
    primaryColor: '#8B4513', // SaddleBrown
    secondaryColor: '#D2B48C', // Tan
    accentColor: '#FFD700', // Gold
    fontFamily: 'serif',
    backgroundStyle: 'old-paper'
  }
};

/**
 * Sitcom template
 */
export const sitcomTemplate: WorldTemplate = {
  id: 'sitcom',
  name: 'Sitcom',
  description: 'A comedic world based on modern situation comedies.',
  genre: 'Comedy',
  attributes: [
    {
      name: 'Humor',
      description: 'Ability to be funny and make others laugh.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Charm',
      description: 'Personal magnetism and likability.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Awkwardness',
      description: 'Tendency to create comedic, uncomfortable situations.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Cleverness',
      description: 'Quick thinking and problem-solving ability.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Drama',
      description: 'Ability to create or escalate dramatic situations.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Resilience',
      description: 'Ability to bounce back from embarrassment or setbacks.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    }
  ],
  skills: [
    {
      name: 'Physical Comedy',
      description: 'Skill at slapstick and physical humor.',
      relatedAttributes: ['Humor', 'Awkwardness'],
      linkedAttributes: ['Humor', 'Awkwardness'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Witty Comebacks',
      description: 'Ability to respond quickly with humor.',
      relatedAttributes: ['Humor', 'Cleverness'],
      linkedAttributes: ['Humor', 'Cleverness'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Scheming',
      description: 'Creating elaborate, often backfiring plans.',
      relatedAttributes: ['Cleverness', 'Drama'],
      linkedAttributes: ['Cleverness', 'Drama'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Gossip',
      description: 'Spreading and collecting information about others.',
      relatedAttributes: ['Drama', 'Charm'],
      linkedAttributes: ['Drama', 'Charm'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Dating',
      description: 'Success in romantic encounters.',
      relatedAttributes: ['Charm', 'Awkwardness'],
      linkedAttributes: ['Charm', 'Awkwardness'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Friendship',
      description: 'Maintaining and nurturing friendships.',
      relatedAttributes: ['Charm', 'Resilience'],
      linkedAttributes: ['Charm', 'Resilience'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Job Skills',
      description: 'Ability to succeed (or amusingly fail) at work.',
      relatedAttributes: ['Cleverness', 'Resilience'],
      linkedAttributes: ['Cleverness', 'Resilience'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Catchphrase',
      description: 'Creating memorable recurring jokes or phrases.',
      relatedAttributes: ['Humor'],
      linkedAttributes: ['Humor'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Misunderstanding',
      description: 'Creating or resolving comedic misunderstandings.',
      relatedAttributes: ['Drama', 'Awkwardness'],
      linkedAttributes: ['Drama', 'Awkwardness'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Group Dynamics',
      description: 'Understanding and navigating friend group dynamics.',
      relatedAttributes: ['Cleverness', 'Charm'],
      linkedAttributes: ['Cleverness', 'Charm'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Emotional Speeches',
      description: 'Delivering heartfelt moments that resolve plots.',
      relatedAttributes: ['Drama', 'Resilience'],
      linkedAttributes: ['Drama', 'Resilience'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Running Gags',
      description: 'Creating and maintaining recurring jokes.',
      relatedAttributes: ['Humor', 'Cleverness'],
      linkedAttributes: ['Humor', 'Cleverness'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    }
  ],
  theme: {
    name: 'Sitcom',
    primaryColor: '#FF6B6B', // Coral-like
    secondaryColor: '#4ECDC4', // Turquoise
    accentColor: '#FFD166', // Mustard Yellow
    fontFamily: 'sans-serif',
    backgroundStyle: 'modern-apartment'
  }
};

/**
 * Fantasy template
 */
export const fantasyTemplate: WorldTemplate = {
  id: 'fantasy',
  name: 'Fantasy',
  description: 'A magical world of heroes, monsters, and epic quests.',
  genre: 'Fantasy',
  attributes: [
    {
      name: 'Strength',
      description: 'Physical power and combat ability.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Dexterity',
      description: 'Agility, reflexes, and precision.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Constitution',
      description: 'Health, stamina, and resistance to harm.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Intelligence',
      description: 'Knowledge, memory, and reasoning ability.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Wisdom',
      description: 'Insight, intuition, and willpower.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Charisma',
      description: 'Force of personality and magical influence.',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    }
  ],
  skills: [
    {
      name: 'Swordsmanship',
      description: 'Skill with bladed weapons.',
      relatedAttributes: ['Strength', 'Dexterity'],
      linkedAttributes: ['Strength', 'Dexterity'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Archery',
      description: 'Skill with bows and ranged weapons.',
      relatedAttributes: ['Dexterity'],
      linkedAttributes: ['Dexterity'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Spellcasting',
      description: 'Ability to cast and control magical spells.',
      relatedAttributes: ['Intelligence', 'Wisdom'],
      linkedAttributes: ['Intelligence', 'Wisdom'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Alchemy',
      description: 'Creating potions and magical substances.',
      relatedAttributes: ['Intelligence'],
      linkedAttributes: ['Intelligence'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Lore',
      description: 'Knowledge of history, legends, and magical creatures.',
      relatedAttributes: ['Intelligence', 'Wisdom'],
      linkedAttributes: ['Intelligence', 'Wisdom'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Survival',
      description: 'Living off the land and navigating wilderness.',
      relatedAttributes: ['Wisdom', 'Constitution'],
      linkedAttributes: ['Wisdom', 'Constitution'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Diplomacy',
      description: 'Negotiating with kings, dragons, and other powerful beings.',
      relatedAttributes: ['Charisma'],
      linkedAttributes: ['Charisma'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Stealth',
      description: 'Moving silently and remaining hidden.',
      relatedAttributes: ['Dexterity'],
      linkedAttributes: ['Dexterity'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Animal Handling',
      description: 'Interacting with and training mundane and magical creatures.',
      relatedAttributes: ['Wisdom', 'Charisma'],
      linkedAttributes: ['Wisdom', 'Charisma'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Religion',
      description: 'Knowledge of deities and religious practices.',
      relatedAttributes: ['Wisdom'],
      linkedAttributes: ['Wisdom'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Crafting',
      description: 'Creating weapons, armor, and magical items.',
      relatedAttributes: ['Strength', 'Intelligence'],
      linkedAttributes: ['Strength', 'Intelligence'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Leadership',
      description: 'Inspiring and commanding allies.',
      relatedAttributes: ['Charisma', 'Wisdom'],
      linkedAttributes: ['Charisma', 'Wisdom'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    }
  ],
  theme: {
    name: 'Fantasy',
    primaryColor: '#5D4037', // Brown
    secondaryColor: '#7986CB', // Blue-Purple
    accentColor: '#FFB74D', // Orange
    fontFamily: 'fantasy',
    backgroundStyle: 'parchment'
  }
};

/**
 * Array of all available templates
 */
export const templates = [westernTemplate, sitcomTemplate, fantasyTemplate];
