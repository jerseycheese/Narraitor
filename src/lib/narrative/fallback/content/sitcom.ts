import { FallbackContent } from '../types';

export const sitcomContent: FallbackContent[] = [
  {
    id: 'sitcom-init-1',
    type: 'initial',
    themes: ['sitcom'],
    tags: ['beginning', 'apartment'],
    content: 'You stand outside apartment 3B, key in hand. Your new life in the city begins today! From inside, you can hear what sounds like an argument about whether a hot dog is a sandwich. These are going to be interesting neighbors.',
    choices: [
      { text: 'Knock and introduce yourself', outcome: 'You knock on the door, figuring it\'s best to meet the neighbors right away. The argument suddenly stops.', tags: ['social', 'friendly'] },
      { text: 'Quietly enter your apartment', outcome: 'You slip into your apartment, deciding to avoid the chaos for now and unpack in peace.', tags: ['avoidance', 'quiet'] },
      { text: 'Listen at the door', outcome: 'You lean closer to hear the debate better. This could tell you a lot about your new neighbors.', tags: ['eavesdrop', 'curious'] }
    ]
  },

  {
    id: 'sitcom-coffee-shop',
    type: 'scene',
    themes: ['sitcom'],
    tags: ['coffee_shop', 'social', 'day'],
    content: 'The local coffee shop bustles with activity. Your usual table is taken by someone working on what appears to be a screenplay about vampire accountants. The barista catches your eye and mouths "the usual?" while juggling multiple orders.',
    choices: [
      { text: 'Get your usual order', outcome: 'You nod to the barista and find another spot to sit, accepting the change in routine.', tags: ['routine', 'flexible'] },
      { text: 'Strike up a conversation about vampires', outcome: 'You approach the screenwriter, curious about vampire accountants and their tax implications.', tags: ['social', 'quirky'] }
    ]
  }
];