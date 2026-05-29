/**
 * Character archetype templates for quick-start character creation
 *
 * This file defines genre-specific character archetypes used in the character
 * creation process. Each archetype includes attribute preferences, skill sets,
 * personality traits, and thematic elements appropriate to the genre.
 *
 * These templates are consumed by characterArchetypes.ts generator functions.
 */

import { GenreValue } from './genres';
import type { InventoryItemInput } from '@/types/inventory.types';

export interface ArchetypeTemplate {
  name: string;
  description: string;
  primaryAttributes: string[];
  secondaryAttributes: string[];
  preferredSkills: string[];
  personalities: string[];
  motivations: string[];
  fears: string[][];
  nameTemplates: string[];
  /** Archetype-appropriate equipment a character of this archetype starts with. */
  startingInventory?: InventoryItemInput[];
}

const BASE_ARCHETYPE_TEMPLATES: Record<
  'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'horror' | 'western',
  ArchetypeTemplate[]
> = {
  fantasy: [
    {
      name: 'Warrior',
      description: 'A stalwart fighter trained in combat',
      primaryAttributes: ['Strength', 'Constitution', 'Endurance'],
      secondaryAttributes: ['Agility', 'Dexterity'],
      preferredSkills: ['Combat', 'Tactics', 'Athletics', 'Intimidation'],
      personalities: [
        'Brave and steadfast, values honor above all',
        'Fierce and determined, never backs down from a fight',
        'Protective and loyal, stands guard over companions'
      ],
      motivations: [
        'To protect the innocent and uphold justice',
        'To prove their worth in battle',
        'To defend their homeland from threats'
      ],
      fears: [
        ['Failure to protect others', 'Being seen as weak'],
        ['Dishonor', 'Cowardice'],
        ['Being forgotten', 'Letting down allies']
      ],
      nameTemplates: ['Aelric', 'Bjorn', 'Gareth', 'Thora', 'Valdris', 'Kendra'],
      startingInventory: [
        { name: 'Steel Sword', description: 'A well-balanced blade, kept sharp.', categoryId: 'equipment', equipped: true },
        { name: 'Wooden Shield', description: 'Battered but reliable.', categoryId: 'equipment' },
        { name: 'Health Potion', description: 'Restores vitality when wounded.', categoryId: 'consumables', quantity: 3, stackable: true, maxStack: 10 }
      ]
    },
    {
      name: 'Mage',
      description: 'A scholar of the mystical arts',
      primaryAttributes: ['Intelligence', 'Wisdom', 'Willpower'],
      secondaryAttributes: ['Perception', 'Memory'],
      preferredSkills: ['Magic', 'Arcana', 'Research', 'Meditation'],
      personalities: [
        'Curious and methodical, driven by knowledge',
        'Mysterious and contemplative, sees beyond the veil',
        'Ambitious and powerful, seeks to master the arcane'
      ],
      motivations: [
        'To unlock the secrets of ancient magic',
        'To understand the fundamental nature of reality',
        'To protect the world from mystical threats'
      ],
      fears: [
        ['Magical backlash', 'Losing control of power'],
        ['Ignorance', 'Being intellectually surpassed'],
        ['Dark magic corruption', 'Forbidden knowledge']
      ],
      nameTemplates: ['Lyra', 'Aldric', 'Seraphina', 'Mordecai', 'Celeste', 'Zephyr'],
      startingInventory: [
        { name: 'Spellbook', description: 'Worn pages crowded with arcane notation.', categoryId: 'equipment', equipped: true },
        { name: 'Traveler\'s Robes', description: 'Embroidered with protective sigils.', categoryId: 'personal', equipped: true },
        { name: 'Mana Potion', description: 'Replenishes spent magical energy.', categoryId: 'consumables', quantity: 3, stackable: true, maxStack: 10 }
      ]
    },
    {
      name: 'Scout',
      description: 'A nimble explorer and tracker',
      primaryAttributes: ['Agility', 'Dexterity', 'Perception'],
      secondaryAttributes: ['Constitution', 'Wisdom'],
      preferredSkills: ['Stealth', 'Survival', 'Archery', 'Tracking'],
      personalities: [
        'Independent and observant, prefers solitude',
        'Quick-witted and adaptable, thrives in nature',
        'Cautious and stealthy, strikes from the shadows'
      ],
      motivations: [
        'To explore uncharted territories',
        'To protect the balance of nature',
        'To gather intelligence for their people'
      ],
      fears: [
        ['Being trapped', 'Losing freedom'],
        ['Civilization', 'Crowds'],
        ['Being detected', 'Failing a mission']
      ],
      nameTemplates: ['Kael', 'Aria', 'Hunter', 'Sage', 'Raven', 'Swift'],
      startingInventory: [
        { name: 'Hunting Bow', description: 'Strung and ready for the trail.', categoryId: 'equipment', equipped: true },
        { name: 'Bundle of Arrows', description: 'Fletched for a clean flight.', categoryId: 'equipment', quantity: 20, stackable: true, maxStack: 50 },
        { name: 'Lockpicks', description: 'A slim set for stubborn locks.', categoryId: 'equipment' },
        { name: 'Leather Cloak', description: 'Muted greens for blending in.', categoryId: 'personal', equipped: true }
      ]
    }
  ],

  'sci-fi': [
    {
      name: 'Pilot',
      description: 'A skilled spacecraft operator',
      primaryAttributes: ['Agility', 'Reflexes', 'Intelligence'],
      secondaryAttributes: ['Perception', 'Constitution'],
      preferredSkills: ['Piloting', 'Navigation', 'Engineering', 'Combat'],
      personalities: [
        'Confident and daring, lives for the thrill of flight',
        'Cool under pressure, makes split-second decisions',
        'Independent and free-spirited, rebels against authority'
      ],
      motivations: [
        'To explore the far reaches of space',
        'To be the best pilot in the galaxy',
        'To deliver important cargo safely'
      ],
      fears: [
        ['Mechanical failure', 'Being grounded'],
        ['Space madness', 'Isolation'],
        ['Losing their ship', 'Navigation errors']
      ],
      nameTemplates: ['Nova', 'Ace', 'Vector', 'Cosmos', 'Stellar', 'Phoenix'],
      startingInventory: [
        { name: 'Sidearm Blaster', description: 'Standard-issue, holstered at the hip.', categoryId: 'equipment', equipped: true },
        { name: 'Flight Jacket', description: 'Insulated, patched at the elbows.', categoryId: 'personal', equipped: true },
        { name: 'Ration Packs', description: 'Freeze-dried meals for long hauls.', categoryId: 'consumables', quantity: 3, stackable: true, maxStack: 10 }
      ]
    },
    {
      name: 'Engineer',
      description: 'A technical specialist and problem solver',
      primaryAttributes: ['Intelligence', 'Logic', 'Technical Aptitude'],
      secondaryAttributes: ['Dexterity', 'Patience'],
      preferredSkills: ['Engineering', 'Technology', 'Repair', 'Science'],
      personalities: [
        'Analytical and precise, solves problems methodically',
        'Innovative and creative, builds impossible solutions',
        'Practical and reliable, keeps everything running'
      ],
      motivations: [
        'To create technology that helps others',
        'To solve impossible technical challenges',
        'To understand how everything works'
      ],
      fears: [
        ['System failures', 'Unsolvable problems'],
        ['Obsolescence', 'Being replaced by AI'],
        ['Critical malfunction', 'Lives depending on their work']
      ],
      nameTemplates: ['Circuit', 'Gears', 'Quantum', 'Binary', 'Flux', 'Tesla'],
      startingInventory: [
        { name: 'Multi-Tool', description: 'A dozen instruments folded into one.', categoryId: 'equipment', equipped: true },
        { name: 'Diagnostic Scanner', description: 'Reads faults the eye can\'t catch.', categoryId: 'equipment' },
        { name: 'Spare Parts', description: 'Couplings, wiring, and seals.', categoryId: 'equipment', quantity: 5, stackable: true, maxStack: 20 }
      ]
    },
    {
      name: 'Medic',
      description: 'A healer and life-saver',
      primaryAttributes: ['Intelligence', 'Wisdom', 'Empathy'],
      secondaryAttributes: ['Dexterity', 'Perception'],
      preferredSkills: ['Medicine', 'Science', 'First Aid', 'Biology'],
      personalities: [
        'Compassionate and caring, dedicated to healing',
        'Calm and focused, works well under pressure',
        'Ethical and principled, values all life'
      ],
      motivations: [
        'To save lives and reduce suffering',
        'To advance medical knowledge',
        'To be there when people need help most'
      ],
      fears: [
        ['Losing a patient', 'Medical mistakes'],
        ['Pandemic outbreaks', 'Incurable diseases'],
        ['Ethical dilemmas', 'Being unable to help']
      ],
      nameTemplates: ['Haven', 'Grace', 'Mercy', 'Heal', 'Hope', 'Vita'],
      startingInventory: [
        { name: 'Medkit', description: 'Field dressings, sealant, and tools.', categoryId: 'equipment', equipped: true },
        { name: 'Med Scanner', description: 'Reads vitals through a sleeve.', categoryId: 'equipment' },
        { name: 'Stim Injectors', description: 'Single-use shots that steady a patient.', categoryId: 'consumables', quantity: 3, stackable: true, maxStack: 10 }
      ]
    }
  ],

  modern: [
    {
      name: 'Detective',
      description: 'An investigator who solves mysteries',
      primaryAttributes: ['Intelligence', 'Perception', 'Intuition'],
      secondaryAttributes: ['Charisma', 'Constitution'],
      preferredSkills: ['Investigation', 'Deduction', 'Psychology', 'Interrogation'],
      personalities: [
        'Observant and analytical, notices every detail',
        'Persistent and determined, never gives up on a case',
        'Cynical and world-weary, has seen it all'
      ],
      motivations: [
        'To bring justice to victims',
        'To solve the unsolvable cases',
        'To protect society from criminals'
      ],
      fears: [
        ['Unsolved cases', 'Missing clues'],
        ['Corruption', 'System failures'],
        ['Wrong accusations', 'Innocent people suffering']
      ],
      nameTemplates: ['Sam', 'Alex', 'Jordan', 'Casey', 'Morgan', 'Quinn'],
      startingInventory: [
        { name: 'Service Pistol', description: 'Holstered, with the safety on.', categoryId: 'equipment', equipped: true },
        { name: 'Magnifying Glass', description: 'For the details everyone else misses.', categoryId: 'equipment' },
        { name: 'Case Notebook', description: 'Dog-eared and full of leads.', categoryId: 'documents' }
      ]
    },
    {
      name: 'Athlete',
      description: 'A physically gifted competitor',
      primaryAttributes: ['Strength', 'Agility', 'Constitution'],
      secondaryAttributes: ['Willpower', 'Charisma'],
      preferredSkills: ['Athletics', 'Acrobatics', 'Competition', 'Fitness'],
      personalities: [
        'Competitive and driven, always strives to win',
        'Disciplined and focused, trains constantly',
        'Team-oriented and inspiring, motivates others'
      ],
      motivations: [
        'To achieve peak physical performance',
        'To inspire others through sport',
        'To overcome personal limitations'
      ],
      fears: [
        ['Career-ending injury', 'Losing physical ability'],
        ['Performance anxiety', 'Letting the team down'],
        ['Age and decline', 'Being surpassed']
      ],
      nameTemplates: ['Max', 'Power', 'Swift', 'Strong', 'Ace', 'Champion'],
      startingInventory: [
        { name: 'Training Gear', description: 'Broken-in and built for movement.', categoryId: 'personal', equipped: true },
        { name: 'Energy Bars', description: 'Quick fuel between efforts.', categoryId: 'consumables', quantity: 4, stackable: true, maxStack: 10 },
        { name: 'Water Bottle', description: 'Insulated, always within reach.', categoryId: 'consumables' }
      ]
    },
    {
      name: 'Scholar',
      description: 'A dedicated seeker of knowledge',
      primaryAttributes: ['Intelligence', 'Wisdom', 'Memory'],
      secondaryAttributes: ['Perception', 'Patience'],
      preferredSkills: ['Research', 'History', 'Languages', 'Writing'],
      personalities: [
        'Intellectual and curious, loves learning',
        'Patient and methodical, studies thoroughly',
        'Wise and knowledgeable, shares information freely'
      ],
      motivations: [
        'To discover lost knowledge',
        'To educate and enlighten others',
        'To preserve important information'
      ],
      fears: [
        ['Ignorance', 'Misinformation'],
        ['Book burning', 'Lost knowledge'],
        ['Being wrong', 'Spreading false information']
      ],
      nameTemplates: ['Professor', 'Doctor', 'Sage', 'Scholar', 'Librarian', 'Teacher'],
      startingInventory: [
        { name: 'Reference Tome', description: 'Annotated in three different hands.', categoryId: 'equipment', equipped: true },
        { name: 'Reading Glasses', description: 'Smudged, but they do the job.', categoryId: 'personal', equipped: true },
        { name: 'Field Notebook', description: 'Half notes, half questions.', categoryId: 'documents' }
      ]
    }
  ],

  western: [
    {
      name: 'Gunslinger',
      description: 'A quick-draw expert with a mysterious past',
      primaryAttributes: ['Agility', 'Reflexes', 'Perception'],
      secondaryAttributes: ['Constitution', 'Charisma'],
      preferredSkills: ['Shooting', 'Quick Draw', 'Intimidation', 'Survival'],
      personalities: [
        'Cool and collected, never shows fear',
        'Mysterious and dangerous, has a dark past',
        'Honorable and fair, lives by a code'
      ],
      motivations: [
        'To seek revenge for past wrongs',
        'To uphold justice in lawless lands',
        'To protect the innocent from outlaws'
      ],
      fears: [
        ['Meeting a faster gun', 'Losing their edge'],
        ['The law catching up', 'Their past being revealed'],
        ['Innocents getting hurt', 'Becoming the villain']
      ],
      nameTemplates: ['Doc', 'Ace', 'Jesse', 'Belle', 'Kid', 'Slim'],
      startingInventory: [
        { name: 'Six-Shooter Revolver', description: 'Worn grip, oiled action.', categoryId: 'equipment', equipped: true },
        { name: 'Worn Duster', description: 'Trail dust ground into every seam.', categoryId: 'personal', equipped: true },
        { name: 'Box of Ammunition', description: 'Enough rounds to settle most arguments.', categoryId: 'equipment', quantity: 24, stackable: true, maxStack: 50 }
      ]
    },
    {
      name: 'Sheriff',
      description: 'A lawman dedicated to keeping the peace',
      primaryAttributes: ['Charisma', 'Constitution', 'Wisdom'],
      secondaryAttributes: ['Strength', 'Perception'],
      preferredSkills: ['Law', 'Investigation', 'Leadership', 'Combat'],
      personalities: [
        'Just and fair, upholds the law',
        'Tough but compassionate, protects the town',
        'Strategic and careful, thinks before acting'
      ],
      motivations: [
        'To bring law and order to the frontier',
        'To protect the townspeople',
        'To uphold justice and the law'
      ],
      fears: [
        ['Corruption', 'Failing the town'],
        ['Outlaws winning', 'Lawlessness spreading'],
        ['Innocent bloodshed', 'Becoming like the criminals']
      ],
      nameTemplates: ['Marshal', 'Sheriff', 'Deputy', 'Wyatt', 'Justice', 'Badge'],
      startingInventory: [
        { name: 'Lawman\'s Revolver', description: 'Carried with the weight of the office.', categoryId: 'equipment', equipped: true },
        { name: 'Sheriff\'s Badge', description: 'Tin star, polished by habit.', categoryId: 'personal', equipped: true },
        { name: 'Set of Handcuffs', description: 'For the ones who come quietly.', categoryId: 'equipment' }
      ]
    },
    {
      name: 'Cowboy',
      description: 'A rugged wanderer of the open range',
      primaryAttributes: ['Constitution', 'Strength', 'Survival'],
      secondaryAttributes: ['Agility', 'Animal Handling'],
      preferredSkills: ['Riding', 'Roping', 'Tracking', 'Survival'],
      personalities: [
        'Independent and free-spirited, answers to no one',
        'Hardworking and reliable, earns their keep',
        'Humble and honest, values simple living'
      ],
      motivations: [
        'To roam free across the frontier',
        'To make an honest living',
        'To find a place to call home'
      ],
      fears: [
        ['Being fenced in', 'Losing freedom'],
        ['Drought', 'Losing the herd'],
        ['Settling down', 'Civilization encroaching']
      ],
      nameTemplates: ['Buck', 'Dusty', 'Tex', 'Montana', 'Dakota', 'Ranger'],
      startingInventory: [
        { name: 'Lasso', description: 'Coiled and ready at the saddle.', categoryId: 'equipment', equipped: true },
        { name: 'Hunting Knife', description: 'Earns its keep on the range.', categoryId: 'equipment' },
        { name: 'Canteen', description: 'Dented, never empty for long.', categoryId: 'consumables' },
        { name: 'Bedroll', description: 'Home wherever the day ends.', categoryId: 'personal' }
      ]
    }
  ],

  historical: [
    {
      name: 'Knight',
      description: 'A noble warrior bound by chivalry',
      primaryAttributes: ['Strength', 'Constitution', 'Honor'],
      secondaryAttributes: ['Charisma', 'Wisdom'],
      preferredSkills: ['Combat', 'Horsemanship', 'Etiquette', 'Leadership'],
      personalities: [
        'Chivalrous and noble, follows the code',
        'Brave and selfless, protects the weak',
        'Loyal and dutiful, serves their lord'
      ],
      motivations: [
        'To uphold the ideals of chivalry',
        'To earn glory and honor',
        'To protect the realm from threats'
      ],
      fears: [
        ['Dishonor', 'Breaking the code'],
        ['Failing their lord', 'Cowardice'],
        ['Being unworthy', 'Losing their status']
      ],
      nameTemplates: ['Sir Galahad', 'Sir Lancelot', 'Lady Joan', 'Sir Richard', 'Dame Eleanor', 'Sir William'],
      startingInventory: [
        { name: 'Steel Longsword', description: 'Crest etched near the hilt.', categoryId: 'equipment', equipped: true },
        { name: 'Kite Shield', description: 'Bears the marks of past tourneys.', categoryId: 'equipment', equipped: true },
        { name: 'Health Tonic', description: 'A field remedy for grievous wounds.', categoryId: 'consumables', quantity: 3, stackable: true, maxStack: 10 }
      ]
    },
    {
      name: 'Merchant',
      description: 'A shrewd trader and negotiator',
      primaryAttributes: ['Charisma', 'Intelligence', 'Perception'],
      secondaryAttributes: ['Wisdom', 'Constitution'],
      preferredSkills: ['Negotiation', 'Appraisal', 'Languages', 'Accounting'],
      personalities: [
        'Shrewd and calculating, always seeks profit',
        'Friendly and charming, makes deals easily',
        'Ambitious and risk-taking, seeks new markets'
      ],
      motivations: [
        'To build a trading empire',
        'To discover new trade routes',
        'To achieve wealth and influence'
      ],
      fears: [
        ['Bankruptcy', 'Bad investments'],
        ['Pirates', 'Thieves'],
        ['Market collapse', 'Losing reputation']
      ],
      nameTemplates: ['Giovanni', 'Marco', 'Isabella', 'Lorenzo', 'Catalina', 'Antonio'],
      startingInventory: [
        { name: 'Fine Cloak', description: 'Cut to signal means and taste.', categoryId: 'personal', equipped: true },
        { name: 'Coin Purse', description: 'Heavy enough to open doors.', categoryId: 'valuables', quantity: 50, stackable: true, maxStack: 999 },
        { name: 'Ledger', description: 'Every debt and favor, accounted for.', categoryId: 'documents' }
      ]
    },
    {
      name: 'Blacksmith',
      description: 'A skilled craftsperson who works with metal',
      primaryAttributes: ['Strength', 'Constitution', 'Craftsmanship'],
      secondaryAttributes: ['Dexterity', 'Patience'],
      preferredSkills: ['Metalworking', 'Repair', 'Engineering', 'Appraisal'],
      personalities: [
        'Hardworking and dedicated, takes pride in craft',
        'Strong and reliable, respected in community',
        'Perfectionist and skilled, demands excellence'
      ],
      motivations: [
        'To create masterwork items',
        'To pass on the craft to apprentices',
        'To earn respect through quality work'
      ],
      fears: [
        ['Injury to hands', 'Losing ability to work'],
        ['Poor materials', 'Substandard work'],
        ['Being forgotten', 'Craft dying out']
      ],
      nameTemplates: ['John', 'Thomas', 'Mary', 'William', 'Agnes', 'Robert'],
      startingInventory: [
        { name: 'Smithing Hammer', description: 'Balanced from years at the anvil.', categoryId: 'equipment', equipped: true },
        { name: 'Leather Apron', description: 'Scorched, scarred, and trusted.', categoryId: 'personal', equipped: true },
        { name: 'Iron Ingots', description: 'Raw stock waiting for the forge.', categoryId: 'equipment', quantity: 5, stackable: true, maxStack: 20 }
      ]
    }
  ],

  horror: [
    {
      name: 'Investigator',
      description: 'A seeker of forbidden truths',
      primaryAttributes: ['Intelligence', 'Perception', 'Willpower'],
      secondaryAttributes: ['Constitution', 'Wisdom'],
      preferredSkills: ['Research', 'Occult', 'Investigation', 'Psychology'],
      personalities: [
        'Curious and driven, seeks the truth at any cost',
        'Rational and skeptical, refuses to believe without proof',
        'Haunted and obsessed, cannot let go of mysteries'
      ],
      motivations: [
        'To uncover hidden truths',
        'To understand the supernatural',
        'To prevent dark forces from rising'
      ],
      fears: [
        ['Going mad', 'Losing grip on reality'],
        ['Being consumed by darkness', 'Becoming a monster'],
        ['Forbidden knowledge', 'Things beyond comprehension']
      ],
      nameTemplates: ['Arkham', 'Lovecraft', 'Poe', 'Raven', 'Shadow', 'Grimm'],
      startingInventory: [
        { name: 'Revolver', description: 'Six rounds against the dark.', categoryId: 'equipment', equipped: true },
        { name: 'Electric Torch', description: 'The beam flickers when it shouldn\'t.', categoryId: 'equipment', equipped: true },
        { name: 'Field Journal', description: 'Notes that read worse by lamplight.', categoryId: 'documents' }
      ]
    },
    {
      name: 'Survivor',
      description: 'Someone who has faced horror and lived',
      primaryAttributes: ['Constitution', 'Willpower', 'Survival'],
      secondaryAttributes: ['Agility', 'Perception'],
      preferredSkills: ['Survival', 'Medicine', 'Stealth', 'Combat'],
      personalities: [
        'Traumatized but resilient, refuses to give up',
        'Paranoid and cautious, trusts no one',
        'Determined and vengeful, seeks to fight back'
      ],
      motivations: [
        'To survive at any cost',
        'To warn others of the danger',
        'To destroy the source of horror'
      ],
      fears: [
        ['It returning', 'Happening again'],
        ['No one believing them', 'Being alone'],
        ['Losing their mind', 'Becoming what they fear']
      ],
      nameTemplates: ['Ash', 'Ripley', 'Laurie', 'Final', 'Last', 'Sole'],
      startingInventory: [
        { name: 'Crowbar', description: 'Pries, pries open, and pries off.', categoryId: 'equipment', equipped: true },
        { name: 'Bandages', description: 'Clean enough, mostly.', categoryId: 'consumables', quantity: 3, stackable: true, maxStack: 10 },
        { name: 'Canned Food', description: 'Dented tins, labels long gone.', categoryId: 'consumables', quantity: 2, stackable: true, maxStack: 10 }
      ]
    },
    {
      name: 'Occultist',
      description: 'A practitioner of dark arts',
      primaryAttributes: ['Intelligence', 'Willpower', 'Charisma'],
      secondaryAttributes: ['Wisdom', 'Perception'],
      preferredSkills: ['Occult', 'Ritual', 'Divination', 'Summoning'],
      personalities: [
        'Mysterious and secretive, guards forbidden knowledge',
        'Power-hungry and reckless, dabbles in dark forces',
        'Protective and cautious, knows the dangers of magic'
      ],
      motivations: [
        'To master forbidden powers',
        'To protect others from dark forces',
        'To understand the supernatural'
      ],
      fears: [
        ['Losing control', 'Being possessed'],
        ['Dark entities', 'Demons and spirits'],
        ['Corruption', 'Becoming evil']
      ],
      nameTemplates: ['Crowley', 'Salem', 'Hex', 'Rune', 'Tarot', 'Witch'],
      startingInventory: [
        { name: 'Ritual Dagger', description: 'Cold to the touch, always.', categoryId: 'equipment', equipped: true },
        { name: 'Tome of Rites', description: 'Bound in something best not named.', categoryId: 'documents' },
        { name: 'Bundle of Candles', description: 'Black wax for the longer workings.', categoryId: 'consumables', quantity: 5, stackable: true, maxStack: 20 }
      ]
    }
  ]
};

export const ARCHETYPE_TEMPLATES: Record<GenreValue, ArchetypeTemplate[]> = {
  ...BASE_ARCHETYPE_TEMPLATES,
  mystery: BASE_ARCHETYPE_TEMPLATES.modern,
  cyberpunk: BASE_ARCHETYPE_TEMPLATES['sci-fi'],
  other: BASE_ARCHETYPE_TEMPLATES.fantasy,
};

// Physical description templates by archetype name
export const PHYSICAL_DESCRIPTION_TEMPLATES: Record<string, string[]> = {
  'Warrior': ['muscular', 'athletic', 'sturdy', 'imposing'],
  'Mage': ['slight', 'lean', 'ethereal', 'scholarly'],
  'Scout': ['lithe', 'wiry', 'agile', 'compact'],
  'Pilot': ['lean', 'quick', 'alert', 'confident'],
  'Engineer': ['steady', 'practical', 'focused', 'precise'],
  'Medic': ['gentle', 'caring', 'alert', 'composed'],
  'Detective': ['observant', 'weathered', 'sharp-eyed', 'experienced'],
  'Athlete': ['powerful', 'toned', 'graceful', 'energetic'],
  'Scholar': ['thoughtful', 'bookish', 'contemplative', 'wise'],
  'Gunslinger': ['lean', 'quick', 'sharp-eyed', 'weathered'],
  'Sheriff': ['sturdy', 'commanding', 'reliable', 'authoritative'],
  'Cowboy': ['rugged', 'sun-weathered', 'tough', 'hardy'],
  'Knight': ['noble', 'armored', 'imposing', 'chivalrous'],
  'Merchant': ['well-dressed', 'prosperous', 'traveled', 'shrewd'],
  'Investigator': ['intense', 'focused', 'determined', 'haunted'],
  'Survivor': ['scarred', 'resilient', 'alert', 'battle-worn'],
  'Occultist': ['mysterious', 'pale', 'otherworldly', 'secretive'],
  'Private Detective': ['sharp', 'perceptive', 'streetwise', 'experienced'],
  'Forensic Expert': ['precise', 'analytical', 'methodical', 'scientific'],
  'Reporter': ['energetic', 'inquisitive', 'persistent', 'well-informed'],
  'Hacker': ['cyber-enhanced', 'tech-savvy', 'wired', 'digital'],
  'Street Samurai': ['enhanced', 'cybernetic', 'deadly', 'precise'],
  'Corporate Agent': ['polished', 'professional', 'ambitious', 'calculating'],
  'Balanced': ['average', 'well-proportioned', 'approachable', 'steady'],
  'Specialist': ['focused', 'intense', 'precise', 'dedicated'],
  'Versatile': ['adaptable', 'dynamic', 'expressive', 'changeable']
};
