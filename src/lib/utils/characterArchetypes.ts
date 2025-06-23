// src/lib/utils/characterArchetypes.ts

import { World } from '@/types/world.types';
import { GenreValue } from '@/lib/constants/genres';
import { generateUniqueId } from './generateId';

export interface CharacterArchetype {
  id: string;
  name: string;
  description: string;
  level: number;
  attributes: Array<{
    id: string;
    name: string;
    value: number;
  }>;
  skills: Array<{
    id: string;
    name: string;
    level: number;
  }>;
  background: {
    description: string;
    personality: string;
    motivation: string;
    fears: string[];
    physicalDescription?: string;
  };
}

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
}

/**
 * Get archetype templates based on world genre
 */
export function getArchetypeTemplatesForGenre(genre: GenreValue): ArchetypeTemplate[] {
  switch (genre) {
    case 'fantasy':
      return [
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
          nameTemplates: ['Aelric', 'Bjorn', 'Gareth', 'Thora', 'Valdris', 'Kendra']
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
          nameTemplates: ['Lyra', 'Aldric', 'Seraphina', 'Mordecai', 'Celeste', 'Zephyr']
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
          nameTemplates: ['Kael', 'Aria', 'Hunter', 'Sage', 'Raven', 'Swift']
        }
      ];

    case 'sci-fi':
      return [
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
          nameTemplates: ['Nova', 'Ace', 'Vector', 'Cosmos', 'Stellar', 'Phoenix']
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
          nameTemplates: ['Circuit', 'Gears', 'Quantum', 'Binary', 'Flux', 'Tesla']
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
          nameTemplates: ['Haven', 'Grace', 'Mercy', 'Heal', 'Hope', 'Vita']
        }
      ];

    case 'modern':
      return [
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
          nameTemplates: ['Sam', 'Alex', 'Jordan', 'Casey', 'Morgan', 'Quinn']
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
          nameTemplates: ['Max', 'Power', 'Swift', 'Strong', 'Ace', 'Champion']
        },
        {
          name: 'Scholar',
          description: 'A dedicated seeker of knowledge',
          primaryAttributes: ['Intelligence', 'Wisdom', 'Memory'],
          secondaryAttributes: ['Perception', 'Patience'],
          preferredSkills: ['Research', 'Analysis', 'Writing', 'Teaching'],
          personalities: [
            'Intellectual and thoughtful, loves learning',
            'Patient and methodical, studies everything deeply',
            'Wise and knowledgeable, shares wisdom with others'
          ],
          motivations: [
            'To expand human knowledge',
            'To preserve important information',
            'To educate and enlighten others'
          ],
          fears: [
            ['Ignorance', 'Misinformation'],
            ['Lost knowledge', 'Destroyed archives'],
            ['Being wrong', 'Spreading false information']
          ],
          nameTemplates: ['Sage', 'Professor', 'Scholar', 'Wise', 'Learn', 'Mind']
        }
      ];

    case 'western':
      return [
        {
          name: 'Gunslinger',
          description: 'A skilled marksman and quick-draw artist',
          primaryAttributes: ['Agility', 'Dexterity', 'Perception'],
          secondaryAttributes: ['Constitution', 'Charisma'],
          preferredSkills: ['Shooting', 'Quick Draw', 'Intimidation', 'Survival'],
          personalities: [
            'Cool and calculated, never loses composure',
            'Independent and self-reliant, trusts only themselves',
            'Honorable and fair, believes in a code of conduct'
          ],
          motivations: [
            'To prove they are the fastest gun in the west',
            'To protect the innocent from outlaws',
            'To uphold justice in lawless lands'
          ],
          fears: [
            ['Being outdraw', 'Losing their edge'],
            ['Innocent casualties', 'Collateral damage'],
            ['Becoming like the outlaws they hunt', 'Losing their code']
          ],
          nameTemplates: ['Colt', 'Jesse', 'Wyatt', 'Doc', 'Belle', 'Cassidy']
        },
        {
          name: 'Sheriff',
          description: 'A lawman dedicated to keeping the peace',
          primaryAttributes: ['Constitution', 'Charisma', 'Wisdom'],
          secondaryAttributes: ['Strength', 'Intelligence'],
          preferredSkills: ['Law Enforcement', 'Leadership', 'Investigation', 'Negotiation'],
          personalities: [
            'Steadfast and reliable, stands firm for justice',
            'Diplomatic and fair, seeks peaceful solutions',
            'Brave and protective, puts others before themselves'
          ],
          motivations: [
            'To bring law and order to frontier towns',
            'To protect citizens from dangerous criminals',
            'To be a beacon of justice in the wilderness'
          ],
          fears: [
            ['Failing to protect the town', 'Innocent deaths'],
            ['Corruption', 'Becoming what they fight against'],
            ['Overwhelming criminal forces', 'Being outnumbered']
          ],
          nameTemplates: ['Marshal', 'Buck', 'Clay', 'Ruth', 'Jake', 'Liberty']
        },
        {
          name: 'Cowboy',
          description: 'A cattle herder and horseman of the open range',
          primaryAttributes: ['Constitution', 'Strength', 'Survival'],
          secondaryAttributes: ['Agility', 'Perception'],
          preferredSkills: ['Riding', 'Animal Handling', 'Survival', 'Roping'],
          personalities: [
            'Rugged and independent, thrives in the wilderness',
            'Loyal and hardworking, values honest labor',
            'Free-spirited and adventurous, loves the open range'
          ],
          motivations: [
            'To live free under the open sky',
            'To build something lasting on the frontier',
            'To protect their herd and livelihood'
          ],
          fears: [
            ['Being fenced in', 'Loss of freedom'],
            ['Rustlers and bandits', 'Losing their cattle'],
            ['Drought and hardship', 'Natural disasters']
          ],
          nameTemplates: ['Tex', 'Dusty', 'Bronco', 'Sage', 'Maverick', 'Dakota']
        }
      ];

    case 'historical':
      return [
        {
          name: 'Knight',
          description: 'A noble warrior bound by chivalry and honor',
          primaryAttributes: ['Strength', 'Constitution', 'Honor'],
          secondaryAttributes: ['Charisma', 'Wisdom'],
          preferredSkills: ['Swordsmanship', 'Horsemanship', 'Chivalry', 'Leadership'],
          personalities: [
            'Noble and honorable, lives by a strict code',
            'Brave and selfless, protects the innocent',
            'Loyal and devoted, serves with distinction'
          ],
          motivations: [
            'To uphold the code of chivalry',
            'To protect the realm from threats',
            'To serve their lord with honor'
          ],
          fears: [
            ['Dishonor', 'Breaking their oath'],
            ['Failing their duty', 'Innocent suffering'],
            ['Cowardice', 'Being seen as weak']
          ],
          nameTemplates: ['Gareth', 'Roland', 'Percival', 'Guinevere', 'Lancelot', 'Galahad']
        },
        {
          name: 'Scholar',
          description: 'A learned person dedicated to knowledge and wisdom',
          primaryAttributes: ['Intelligence', 'Wisdom', 'Memory'],
          secondaryAttributes: ['Perception', 'Patience'],
          preferredSkills: ['Research', 'Languages', 'History', 'Writing'],
          personalities: [
            'Intellectual and curious, seeks knowledge',
            'Patient and methodical, studies deeply',
            'Wise and thoughtful, values learning'
          ],
          motivations: [
            'To preserve knowledge for future generations',
            'To understand the world through study',
            'To educate others and spread wisdom'
          ],
          fears: [
            ['Ignorance', 'Lost knowledge'],
            ['Book burning', 'Destruction of learning'],
            ['Being wrong', 'Spreading misinformation']
          ],
          nameTemplates: ['Thomas', 'Albertus', 'Hildegard', 'Roger', 'Duns', 'Aquinas']
        },
        {
          name: 'Merchant',
          description: 'A trader who travels far and wide for profit',
          primaryAttributes: ['Charisma', 'Intelligence', 'Perception'],
          secondaryAttributes: ['Constitution', 'Wisdom'],
          preferredSkills: ['Negotiation', 'Appraisal', 'Languages', 'Travel'],
          personalities: [
            'Shrewd and calculating, sees opportunity',
            'Charming and persuasive, makes deals',
            'Adventurous and bold, takes risks'
          ],
          motivations: [
            'To build wealth and prosperity',
            'To explore new markets and opportunities',
            'To provide valuable goods to communities'
          ],
          fears: [
            ['Bankruptcy', 'Losing investments'],
            ['Bandits', 'Theft of goods'],
            ['Market collapse', 'Economic ruin']
          ],
          nameTemplates: ['Marco', 'Giovanni', 'Isabella', 'Heinrich', 'Jacques', 'Medici']
        }
      ];

    case 'horror':
      return [
        {
          name: 'Investigator',
          description: 'A seeker of truth in dark and dangerous places',
          primaryAttributes: ['Intelligence', 'Perception', 'Willpower'],
          secondaryAttributes: ['Constitution', 'Wisdom'],
          preferredSkills: ['Investigation', 'Occult', 'Psychology', 'Research'],
          personalities: [
            'Determined and relentless, pursues the truth',
            'Skeptical yet open-minded, questions everything',
            'Brave but cautious, knows when to retreat'
          ],
          motivations: [
            'To uncover the truth behind supernatural events',
            'To protect others from otherworldly threats',
            'To understand the mysteries of the unknown'
          ],
          fears: [
            ['Losing sanity', 'Cosmic horror'],
            ['Becoming what they hunt', 'Corruption'],
            ['Failing to warn others', 'Innocent victims']
          ],
          nameTemplates: ['Vincent', 'Arkham', 'Blackwood', 'Raven', 'Salem', 'Midnight']
        },
        {
          name: 'Survivor',
          description: 'One who has faced horror and lived to tell the tale',
          primaryAttributes: ['Constitution', 'Willpower', 'Survival'],
          secondaryAttributes: ['Agility', 'Perception'],
          preferredSkills: ['Survival', 'Stealth', 'First Aid', 'Courage'],
          personalities: [
            'Resilient and tough, refuses to give up',
            'Paranoid and cautious, always alert',
            'Protective and loyal, shields others'
          ],
          motivations: [
            'To survive against all odds',
            'To protect loved ones from danger',
            'To escape the nightmare alive'
          ],
          fears: [
            ['The dark', 'Unknown threats'],
            ['Being alone', 'Isolation'],
            ['Losing control', 'Helplessness']
          ],
          nameTemplates: ['Ash', 'Ripley', 'Sidney', 'Laurie', 'Final', 'Last']
        },
        {
          name: 'Occultist',
          description: 'A student of forbidden knowledge and dark arts',
          primaryAttributes: ['Intelligence', 'Willpower', 'Occult Knowledge'],
          secondaryAttributes: ['Wisdom', 'Perception'],
          preferredSkills: ['Occult', 'Ritual', 'Ancient Languages', 'Forbidden Lore'],
          personalities: [
            'Curious and driven, seeks forbidden knowledge',
            'Mysterious and secretive, guards their secrets',
            'Powerful but dangerous, walks a dark path'
          ],
          motivations: [
            'To master the secrets of the supernatural',
            'To gain power over otherworldly forces',
            'To understand the true nature of reality'
          ],
          fears: [
            ['Losing control', 'Dark forces turning'],
            ['Being discovered', 'Persecution'],
            ['Madness', 'Price of knowledge']
          ],
          nameTemplates: ['Crowley', 'Dee', 'Lavey', 'Blavatsky', 'Magus', 'Cipher']
        }
      ];

    case 'mystery':
      return [
        {
          name: 'Private Detective',
          description: 'An independent investigator who solves cases',
          primaryAttributes: ['Intelligence', 'Perception', 'Intuition'],
          secondaryAttributes: ['Charisma', 'Wisdom'],
          preferredSkills: ['Investigation', 'Deduction', 'Interrogation', 'Research'],
          personalities: [
            'Sharp and observant, notices every detail',
            'Persistent and determined, never gives up',
            'Independent and resourceful, works alone'
          ],
          motivations: [
            'To solve the unsolvable mysteries',
            'To bring justice to victims',
            'To uncover the truth no matter the cost'
          ],
          fears: [
            ['Unsolved cases', 'Missing evidence'],
            ['Wrong conclusions', 'Innocent suffering'],
            ['Being outsmarted', 'Criminal escape']
          ],
          nameTemplates: ['Holmes', 'Poirot', 'Marple', 'Spade', 'Marlowe', 'Columbo']
        },
        {
          name: 'Forensic Expert',
          description: 'A scientific investigator who reads the evidence',
          primaryAttributes: ['Intelligence', 'Perception', 'Technical Skill'],
          secondaryAttributes: ['Patience', 'Precision'],
          preferredSkills: ['Forensics', 'Science', 'Analysis', 'Technology'],
          personalities: [
            'Methodical and precise, follows the evidence',
            'Analytical and logical, thinks scientifically',
            'Patient and thorough, misses nothing'
          ],
          motivations: [
            'To let the evidence speak the truth',
            'To apply science to solve crimes',
            'To provide closure through facts'
          ],
          fears: [
            ['Contaminated evidence', 'False conclusions'],
            ['Technology failure', 'Missing clues'],
            ['Bias affecting judgment', 'Rushed analysis']
          ],
          nameTemplates: ['Grissom', 'Scully', 'Brennan', 'Quincy', 'Lab', 'Evidence']
        },
        {
          name: 'Reporter',
          description: 'A journalist investigating stories and uncovering truth',
          primaryAttributes: ['Charisma', 'Intelligence', 'Persistence'],
          secondaryAttributes: ['Perception', 'Courage'],
          preferredSkills: ['Investigation', 'Writing', 'Networking', 'Research'],
          personalities: [
            'Inquisitive and bold, asks tough questions',
            'Determined and fearless, pursues the story',
            'Ethical and principled, seeks the truth'
          ],
          motivations: [
            'To expose corruption and wrongdoing',
            'To inform the public of important truths',
            'To give voice to the voiceless'
          ],
          fears: [
            ['Censorship', 'Being silenced'],
            ['False information', 'Misleading public'],
            ['Retaliation', 'Dangerous sources']
          ],
          nameTemplates: ['Lois', 'Clark', 'Woodward', 'Bernstein', 'Murrow', 'Press']
        }
      ];

    case 'cyberpunk':
      return [
        {
          name: 'Hacker',
          description: 'A digital warrior who fights in cyberspace',
          primaryAttributes: ['Intelligence', 'Technical Skill', 'Reflexes'],
          secondaryAttributes: ['Perception', 'Logic'],
          preferredSkills: ['Hacking', 'Programming', 'Cybersecurity', 'Electronics'],
          personalities: [
            'Brilliant and rebellious, fights the system',
            'Paranoid and careful, trusts no one',
            'Independent and resourceful, relies on skill'
          ],
          motivations: [
            'To bring down corporate oppression',
            'To free information from control',
            'To protect privacy and freedom'
          ],
          fears: [
            ['Corporate retaliation', 'Being traced'],
            ['System failure', 'Losing connection'],
            ['AI takeover', 'Being replaced']
          ],
          nameTemplates: ['Neo', 'Trinity', 'Zero', 'Cipher', 'Ghost', 'Matrix']
        },
        {
          name: 'Street Samurai',
          description: 'A cybernetically enhanced warrior for hire',
          primaryAttributes: ['Strength', 'Reflexes', 'Cybernetics'],
          secondaryAttributes: ['Constitution', 'Agility'],
          preferredSkills: ['Combat', 'Weapons', 'Cybernetics', 'Intimidation'],
          personalities: [
            'Disciplined and honorable, follows a code',
            'Enhanced and deadly, precision fighter',
            'Professional and reliable, completes contracts'
          ],
          motivations: [
            'To honor their cybernetic upgrades',
            'To protect clients and complete missions',
            'To maintain their reputation and code'
          ],
          fears: [
            ['System malfunction', 'Cybernetic failure'],
            ['Obsolescence', 'Better models'],
            ['Loss of humanity', 'Becoming machine']
          ],
          nameTemplates: ['Blade', 'Chrome', 'Steel', 'Razor', 'Wire', 'Edge']
        },
        {
          name: 'Corporate Agent',
          description: 'A company operative navigating corporate warfare',
          primaryAttributes: ['Charisma', 'Intelligence', 'Resources'],
          secondaryAttributes: ['Perception', 'Networking'],
          preferredSkills: ['Business', 'Negotiation', 'Espionage', 'Technology'],
          personalities: [
            'Ambitious and calculating, climbs the ladder',
            'Professional and polished, represents the corp',
            'Ruthless and efficient, gets results'
          ],
          motivations: [
            'To advance their corporate career',
            'To increase company profits and power',
            'To outmaneuver rival corporations'
          ],
          fears: [
            ['Corporate betrayal', 'Being expendable'],
            ['Market collapse', 'Economic failure'],
            ['Hostile takeover', 'Losing position']
          ],
          nameTemplates: ['Executive', 'Suit', 'Corporate', 'Business', 'Profit', 'Success']
        }
      ];

    default:
      // Generic archetypes for unknown genres
      return [
        {
          name: 'Balanced',
          description: 'A well-rounded individual',
          primaryAttributes: ['Strength', 'Intelligence', 'Agility'],
          secondaryAttributes: ['Wisdom', 'Charisma'],
          preferredSkills: ['General', 'Adaptability', 'Problem Solving'],
          personalities: [
            'Adaptable and versatile, handles any situation',
            'Balanced and steady, provides stability',
            'Practical and resourceful, finds solutions'
          ],
          motivations: [
            'To help others and make a difference',
            'To maintain balance and harmony',
            'To adapt and overcome challenges'
          ],
          fears: [
            ['Chaos', 'Instability'],
            ['Being useless', 'Not belonging'],
            ['Extreme situations', 'Making wrong choices']
          ],
          nameTemplates: ['Balance', 'Harmony', 'Steady', 'Adapt', 'Resolve', 'Unity']
        },
        {
          name: 'Specialist',
          description: 'An expert in their chosen field',
          primaryAttributes: ['Intelligence', 'Wisdom', 'Focus'],
          secondaryAttributes: ['Perception', 'Dexterity'],
          preferredSkills: ['Specialization', 'Expertise', 'Mastery'],
          personalities: [
            'Focused and dedicated, masters their craft',
            'Perfectionistic and precise, accepts no compromise',
            'Passionate and driven, lives for their specialty'
          ],
          motivations: [
            'To achieve mastery in their field',
            'To be recognized as an expert',
            'To push the boundaries of knowledge'
          ],
          fears: [
            ['Mediocrity', 'Being surpassed'],
            ['Irrelevance', 'Field becoming obsolete'],
            ['Making mistakes', 'Losing expertise']
          ],
          nameTemplates: ['Expert', 'Master', 'Focused', 'Sharp', 'Precise', 'Elite']
        },
        {
          name: 'Versatile',
          description: 'A flexible jack-of-all-trades',
          primaryAttributes: ['Adaptability', 'Resourcefulness', 'Creativity'],
          secondaryAttributes: ['Intelligence', 'Charisma'],
          preferredSkills: ['Versatility', 'Innovation', 'Quick Learning'],
          personalities: [
            'Creative and innovative, thinks outside the box',
            'Flexible and adaptable, changes with circumstances',
            'Curious and experimental, tries new approaches'
          ],
          motivations: [
            'To experience as much as possible',
            'To find creative solutions to problems',
            'To never be limited by specialization'
          ],
          fears: [
            ['Boredom', 'Routine'],
            ['Being trapped', 'Limited options'],
            ['Stagnation', 'Lack of variety']
          ],
          nameTemplates: ['Flex', 'Multi', 'Diverse', 'Change', 'Flow', 'Free']
        }
      ];
  }
}

/**
 * Generate character name based on template and ensure uniqueness
 */
function generateCharacterName(template: ArchetypeTemplate, existingNames: string[] = []): string {
  const baseName = template.nameTemplates[Math.floor(Math.random() * template.nameTemplates.length)];
  
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
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
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
  template: ArchetypeTemplate
): CharacterArchetype['attributes'] {
  return worldAttributes.map(attr => {
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
      value = Math.floor(attr.minValue + range * 0.7 + Math.random() * range * 0.3);
    } else if (isSecondary) {
      // Secondary attributes: 50-80% of range
      value = Math.floor(attr.minValue + range * 0.5 + Math.random() * range * 0.3);
    } else {
      // Other attributes: 20-60% of range
      value = Math.floor(attr.minValue + range * 0.2 + Math.random() * range * 0.4);
    }
    
    // Ensure within bounds
    value = Math.max(attr.minValue, Math.min(attr.maxValue, value));
    
    return {
      id: attr.id,
      name: attr.name,
      value
    };
  });
}

/**
 * Distribute skill levels based on archetype preferences
 */
function distributeSkills(
  worldSkills: World['skills'], 
  template: ArchetypeTemplate
): CharacterArchetype['skills'] {
  return worldSkills.map(skill => {
    const isPreferred = template.preferredSkills.some(preferred => 
      skill.name.toLowerCase().includes(preferred.toLowerCase()) ||
      preferred.toLowerCase().includes(skill.name.toLowerCase())
    );
    
    let level: number;
    
    if (isPreferred) {
      // Preferred skills: 6-9 (competent to expert)
      level = Math.floor(Math.random() * 4) + 6;
    } else {
      // Other skills: 1-6 (beginner to competent)
      level = Math.floor(Math.random() * 6) + 1;
    }
    
    // Ensure within bounds
    level = Math.max(1, Math.min(10, level));
    
    return {
      id: skill.id,
      name: skill.name,
      level
    };
  });
}

/**
 * Generate character archetypes for quick start
 */
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
  
  for (const template of templates) {
    try {
      const name = generateCharacterName(template, [...existingNames, ...archetypes.map(a => a.name)]);
      const personality = template.personalities[Math.floor(Math.random() * template.personalities.length)];
      const motivation = template.motivations[Math.floor(Math.random() * template.motivations.length)];
      const fears = template.fears[Math.floor(Math.random() * template.fears.length)];
      
      const archetype: CharacterArchetype = {
        id: generateUniqueId('archetype'),
        name,
        description: template.description,
        level: 1, // All quick start characters are level 1
        attributes: distributeAttributes(world.attributes, template),
        skills: distributeSkills(world.skills, template),
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
  
  return archetypes;
}

/**
 * Generate physical description based on archetype and genre
 */
function generatePhysicalDescription(template: ArchetypeTemplate, genre: GenreValue, worldName?: string): string {
  const ageRange = Math.floor(Math.random() * 20) + 20; // 20-40 years old
  
  const builds = {
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
  
  const build = builds[template.name as keyof typeof builds] || builds['Balanced'];
  const selectedBuild = build[Math.floor(Math.random() * build.length)];
  
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
  
  const selectedFeature = features[Math.floor(Math.random() * features.length)];
  
  return `${ageRange}-year-old human with a ${selectedBuild} build and ${selectedFeature}, perfectly suited for the ${genre} setting of ${worldName || 'this world'}.`;
}

/**
 * Generate a random archetype from the available options
 */
export async function generateRandomArchetype(world: World, existingNames: string[] = []): Promise<CharacterArchetype> {
  const archetypes = await generateCharacterArchetypes(world, existingNames);
  const randomIndex = Math.floor(Math.random() * archetypes.length);
  
  // Modify the selected archetype to be more randomized
  const selectedArchetype = archetypes[randomIndex];
  
  // Randomize the name further
  const templates = getArchetypeTemplatesForGenre(world.genre);
  const allNameTemplates = templates.flatMap(t => t.nameTemplates);
  const randomBaseName = allNameTemplates[Math.floor(Math.random() * allNameTemplates.length)];
  
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
        attr.value + (Math.random() > 0.5 ? 1 : -1)
      )
    )
  }));
  
  return selectedArchetype;
}