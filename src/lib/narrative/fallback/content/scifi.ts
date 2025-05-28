import { FallbackContent } from '../types';

export const scifiContent: FallbackContent[] = [
  // Initial scenes
  {
    id: 'scifi-init-1',
    type: 'initial',
    themes: ['scifi'],
    tags: ['beginning', 'spaceship'],
    content: 'You wake from cryosleep as the ship\'s AI announces arrival at the Kepler Station. Through the viewport, you see the massive space station rotating slowly against a backdrop of distant stars. Your mission briefing blinks on the nearby console, waiting for your attention.',
    choices: [
      { text: 'Review the mission briefing', outcome: 'You access the console and begin reading through your mission parameters, trying to shake off the grogginess of extended cryosleep.', tags: ['briefing', 'preparation'] },
      { text: 'Check ship systems', outcome: 'You run a diagnostic check on all ship systems, ensuring everything survived the long journey intact.', tags: ['technical', 'cautious'] },
      { text: 'Hail the station', outcome: 'You open a comm channel to Kepler Station, announcing your arrival and requesting docking clearance.', tags: ['communication', 'protocol'] }
    ]
  },

  // Ship interior scenes
  {
    id: 'scifi-ship-corridor',
    type: 'scene',
    themes: ['scifi'],
    tags: ['spaceship', 'interior', 'corridor'],
    content: 'The ship\'s corridors hum with the steady rhythm of life support systems. Emergency lighting casts long shadows, and you can hear the distant echo of machinery. Your footsteps ring metallic against the deck plating as you make your way forward.',
    weight: 1
  },

  // Space station scenes
  {
    id: 'scifi-station-docking',
    type: 'scene',
    themes: ['scifi'],
    tags: ['station', 'docking', 'arrival'],
    content: 'The docking procedure completes with a resonant thunk as magnetic clamps secure your ship. Through the airlock window, you can see the station\'s reception area - a blend of utilitarian design and attempts at comfort for weary travelers. A customs official waits on the other side.',
    choices: [
      { text: 'Proceed through customs', outcome: 'You gather your documentation and step through the airlock to meet the customs official.', tags: ['customs', 'official'] },
      { text: 'Delay and observe', outcome: 'You take a moment to observe the station\'s activity through the window, looking for anything unusual.', tags: ['observation', 'cautious'] }
    ]
  }
];