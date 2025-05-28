import { FallbackContent } from '../types';

export const fantasyContent: FallbackContent[] = [
  // Initial scenes
  {
    id: 'fantasy-init-1',
    type: 'initial',
    themes: ['fantasy'],
    tags: ['beginning', 'kingdom'],
    content: 'Your adventure begins in the ancient kingdom of Eldoria, where magic flows through the very air and mythical creatures roam the wild lands beyond the city walls. You stand at the gates of the capital, ready to forge your destiny.',
    choices: [
      { text: 'Enter the bustling marketplace', outcome: 'You make your way into the crowded marketplace, where merchants hawk exotic wares and the air fills with a dozen different languages.', tags: ['marketplace', 'city'] },
      { text: 'Visit the royal castle', outcome: 'You approach the towering castle that dominates the skyline, its white stone walls gleaming in the sunlight.', tags: ['castle', 'royal'] },
      { text: 'Head to the tavern', outcome: 'You push open the heavy wooden door of the Prancing Pony tavern, immediately enveloped by warmth and the sound of laughter.', tags: ['tavern', 'social'] }
    ]
  },
  {
    id: 'fantasy-init-2',
    type: 'initial',
    themes: ['fantasy', 'adventure'],
    tags: ['beginning', 'quest'],
    content: 'The village elder has summoned you with urgent news. Dark forces stir in the northern mountains, and the ancient prophecy speaks of a hero who will rise to face this threat. As you stand before the elder, you feel the weight of destiny upon your shoulders.',
    choices: [
      { text: 'Accept the quest immediately', outcome: 'You nod solemnly, accepting the burden of this great quest. The elder\'s eyes shine with hope as he begins to explain what you must do.', tags: ['quest_accepted', 'eager'] },
      { text: 'Ask for more information', outcome: 'You raise your hand, requesting more details about these dark forces and the prophecy that names you.', tags: ['cautious', 'information'] },
      { text: 'Request time to prepare', outcome: 'You ask for time to gather supplies and allies before embarking on such a dangerous journey.', tags: ['preparation', 'practical'] }
    ]
  },

  // Combat-specific test content
  {
    id: 'fantasy-combat-night',
    type: 'scene',
    themes: ['fantasy'],
    tags: ['combat', 'night'],
    content: 'In the darkness, combat becomes even more dangerous. Every shadow could hide an enemy, every sound could signal an attack.',
    weight: 1
  },

  // Forest scenes
  {
    id: 'fantasy-forest-1',
    type: 'scene',
    themes: ['fantasy'],
    tags: ['forest', 'day', 'peaceful'],
    content: 'The forest path winds between ancient oaks, their branches forming a green canopy overhead. Shafts of golden sunlight pierce through the leaves, creating pools of warmth on the moss-covered ground. Birds sing their afternoon songs, and a gentle breeze carries the scent of wildflowers.',
    weight: 1
  },
  {
    id: 'fantasy-forest-2',
    type: 'scene',
    themes: ['fantasy', 'adventure'],
    tags: ['forest', 'mysterious'],
    content: 'The forest grows darker and more mysterious as you venture deeper. Strange symbols are carved into the bark of the trees, and you could swear you hear whispers in a language you don\'t understand. The path ahead splits into two directions.',
    choices: [
      { text: 'Follow the left path toward the whispers', outcome: 'You turn left, drawn by the mysterious whispers that seem to beckon you deeper into the shadows.', tags: ['left_path', 'mysterious'] },
      { text: 'Take the right path toward a clearing', outcome: 'You choose the right path, which appears to lead toward a bright clearing visible through the trees.', tags: ['right_path', 'clearing'] }
    ],
    weight: 2
  },
  {
    id: 'fantasy-forest-night',
    type: 'scene',
    themes: ['fantasy'],
    tags: ['forest', 'night', 'atmospheric'],
    content: 'Night has fallen in the forest, transforming the familiar paths into a maze of shadows and moonlight. Glowing fungi provide an eerie illumination, and nocturnal creatures rustle in the undergrowth. You must decide whether to make camp or continue through the darkness.',
    choices: [
      { text: 'Make camp for the night', outcome: 'You find a suitable clearing and begin gathering wood for a fire, deciding that rest is wiser than stumbling through the dark.', tags: ['camp', 'rest'] },
      { text: 'Press on through the night', outcome: 'You light a torch and continue forward, determined to make progress despite the dangers of traveling at night.', tags: ['night_travel', 'determined'] }
    ]
  },

  // Combat scenes
  {
    id: 'fantasy-combat-1',
    type: 'scene',
    themes: ['fantasy'],
    tags: ['combat', 'forest', 'creature'],
    content: 'A snarl breaks the forest\'s peace as a dire wolf emerges from the undergrowth, its red eyes fixed on you with predatory intent. The massive beast circles slowly, muscles tensed for attack. You must act quickly!',
    requirements: {
      includeTags: ['forest'],
      minSegments: 2
    },
    choices: [
      { text: 'Draw your weapon and fight', outcome: 'You draw your weapon in one smooth motion, facing the beast with grim determination.', tags: ['combat', 'brave'] },
      { text: 'Try to intimidate the wolf', outcome: 'You stand tall and roar at the wolf, attempting to establish dominance and frighten it away.', tags: ['intimidation', 'clever'] },
      { text: 'Slowly back away', outcome: 'You begin to carefully retreat, maintaining eye contact while searching for an escape route.', tags: ['retreat', 'cautious'] }
    ]
  },

  // Transition scenes
  {
    id: 'fantasy-transition-1',
    type: 'transition',
    themes: ['fantasy'],
    tags: ['travel', 'mountain'],
    content: 'Days pass as you journey toward the mountains. The landscape gradually changes from rolling hills to rocky terrain, and the air grows thin and cold. Each step brings you closer to your destination, though what awaits you there remains uncertain.'
  },
  {
    id: 'fantasy-transition-2',
    type: 'transition',
    themes: ['fantasy'],
    tags: ['travel', 'river'],
    content: 'Following the river has proven wise - fresh water and fish have sustained you, and the path is easier than cutting through the dense forest. As you round a bend, you spot smoke rising in the distance, suggesting civilization ahead.'
  },

  // City scenes
  {
    id: 'fantasy-city-market',
    type: 'scene',
    themes: ['fantasy'],
    tags: ['city', 'marketplace', 'social'],
    content: 'The marketplace buzzes with activity. Merchants call out their wares - everything from common vegetables to mysterious potions that glow with inner light. A crowd has gathered around a street performer who juggles balls of colored fire.',
    choices: [
      { text: 'Browse the potion stall', outcome: 'You approach the alchemist\'s stall, where bottles of every shape and color promise various magical effects.', tags: ['shopping', 'potions'] },
      { text: 'Watch the fire juggler', outcome: 'You join the crowd watching the performer, mesmerized by the dancing flames.', tags: ['entertainment', 'magic'] },
      { text: 'Look for information', outcome: 'You move through the crowd, listening for useful gossip or news about your quest.', tags: ['information', 'social'] }
    ],
    requirements: {
      includeTags: ['city']
    }
  },

  // Tavern scenes
  {
    id: 'fantasy-tavern-1',
    type: 'scene',
    themes: ['fantasy'],
    tags: ['tavern', 'social', 'evening'],
    content: 'The tavern is warm and inviting after your travels. Patrons of all kinds fill the common room - weathered merchants, mysterious hooded figures, and boisterous adventurers sharing tales of their exploits. The barkeeper, a stout dwarf with an impressive beard, nods at your entrance.',
    choices: [
      { text: 'Order a meal and drink', outcome: 'You settle at the bar and order the house special, grateful for hot food after days of travel rations.', tags: ['rest', 'meal'] },
      { text: 'Listen for useful information', outcome: 'You find a corner table and nurse a drink while eavesdropping on the various conversations around you.', tags: ['information', 'stealth'] },
      { text: 'Join the adventurers\' table', outcome: 'You approach the group of adventurers, hoping to share stories and perhaps find allies.', tags: ['social', 'allies'] }
    ],
    requirements: {
      includeTags: ['tavern']
    }
  }
];