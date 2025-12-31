import { WorldContext, CharacterContext } from '../types';

export const createMockWorld = (overrides = {}): WorldContext => ({
  id: 'world-1',
  name: 'Eldoria',
  genre: 'fantasy',
  description: 'A magical realm',
  attributes: [
    { id: 'attr-1', name: 'Strength', description: 'Physical power' }
  ],
  skills: [
    { id: 'skill-1', name: 'Swordsmanship', description: 'Blade mastery' }
  ],
  ...overrides
});

export const createMockCharacter = (overrides = {}): CharacterContext => ({
  id: 'char-1',
  name: 'Hero',
  level: 5,
  description: 'Brave adventurer',
  attributes: [
    { attributeId: 'attr-1', name: 'Strength', value: 8 }
  ],
  skills: [
    { skillId: 'skill-1', name: 'Swordsmanship', value: 3 }
  ],
  ...overrides
});
