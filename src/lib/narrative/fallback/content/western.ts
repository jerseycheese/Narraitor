import { FallbackContent } from '../types';

export const westernContent: FallbackContent[] = [
  {
    id: 'western-init-1',
    type: 'initial',
    themes: ['western'],
    tags: ['beginning', 'town'],
    content: 'The stagecoach comes to a dusty halt in the frontier town of Deadwood Creek. As you step down, the wooden sidewalks creak under your boots, and curious eyes watch from behind saloon doors and shop windows. This town holds secrets, and you aim to uncover them.',
    choices: [
      { text: 'Head to the saloon', outcome: 'You push through the swinging doors of the Silver Dollar Saloon, where piano music and laughter fill the air.', tags: ['saloon', 'social'] },
      { text: 'Visit the sheriff', outcome: 'You make your way to the sheriff\'s office, figuring it\'s best to announce yourself to the local law.', tags: ['sheriff', 'law'] },
      { text: 'Check into the hotel', outcome: 'You head to the Frontier Inn to secure lodging and get the lay of the land.', tags: ['hotel', 'rest'] }
    ]
  },

  {
    id: 'western-desert-1',
    type: 'scene',
    themes: ['western'],
    tags: ['desert', 'travel', 'day'],
    content: 'The desert stretches endlessly before you, heat waves shimmering off the sandy ground. Your horse plods steadily onward, and you take frequent sips from your canteen. In the distance, you spot a rock formation that might offer shade and rest.'
  }
];