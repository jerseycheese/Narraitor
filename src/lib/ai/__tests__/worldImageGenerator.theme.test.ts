import { WorldImageGenerator } from '../worldImageGenerator';
import { World } from '@/types/world.types';
import { generateUniqueId } from '@/lib/utils/generateId';

describe('WorldImageGenerator theme handling', () => {
  let generator: WorldImageGenerator;
  let mockAIClient: { generateImage: jest.Mock };

  beforeEach(() => {
    mockAIClient = {
      generateImage: jest.fn()
    };
    generator = new WorldImageGenerator(mockAIClient as any);
  });

  const createMockWorld = (theme: string, description?: string): World => ({
    id: generateUniqueId('world'),
    name: 'Test World',
    theme,
    description: description || 'A test world',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 10,
      attributePointPool: 30,
      skillPointPool: 50
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  describe('prompt generation for different themes', () => {
    it('should not include fantasy elements for Modern theme', async () => {
      const world = createMockWorld('Modern', 'A corporate office environment');
      
      // Access the private buildPrompt method via reflection
      const buildPrompt = (generator as any).buildPrompt.bind(generator);
      const prompt = buildPrompt(world);

      expect(prompt).toContain('modern realistic style');
      expect(prompt).toContain('contemporary setting');
      expect(prompt).toContain('real-world environment');
      expect(prompt).toContain('no fantasy or magical elements');
      
      // Should NOT contain fantasy terms (except in the "no fantasy" instruction)
      const promptWithoutNoFantasy = prompt.replace(/no fantasy or magical elements/gi, '');
      expect(promptWithoutNoFantasy).not.toMatch(/magic|mystical|fantasy|enchant/i);
    });

    it('should not include fantasy elements for Comedy theme', async () => {
      const world = createMockWorld('Comedy', 'A workplace comedy setting');
      
      const buildPrompt = (generator as any).buildPrompt.bind(generator);
      const prompt = buildPrompt(world);

      expect(prompt).toContain('modern realistic style');
      expect(prompt).toContain('no fantasy or magical elements');
      
      // Should NOT contain fantasy terms (except in the "no fantasy" instruction)
      const promptWithoutNoFantasy = prompt.replace(/no fantasy or magical elements/gi, '');
      expect(promptWithoutNoFantasy).not.toMatch(/magic|mystical|fantasy|enchant/i);
    });

    it('should allow fantasy elements for Fantasy theme', async () => {
      const world = createMockWorld('Fantasy', 'A magical realm');
      
      const buildPrompt = (generator as any).buildPrompt.bind(generator);
      const prompt = buildPrompt(world);

      expect(prompt).toContain('epic fantasy style');
      expect(prompt).toContain('magical atmosphere');
      expect(prompt).toContain('mystical lighting');
    });

    it('should use sci-fi elements for Sci-Fi theme', async () => {
      const world = createMockWorld('Sci-Fi', 'A space station');
      
      const buildPrompt = (generator as any).buildPrompt.bind(generator);
      const prompt = buildPrompt(world);

      expect(prompt).toContain('science fiction style');
      expect(prompt).toContain('futuristic aesthetic');
      expect(prompt).toContain('advanced technology');
    });

    it('should use western elements for Western theme', async () => {
      const world = createMockWorld('Western', 'A frontier town');
      
      const buildPrompt = (generator as any).buildPrompt.bind(generator);
      const prompt = buildPrompt(world);

      expect(prompt).toContain('western style');
      expect(prompt).toContain('rugged frontier aesthetic');
      expect(prompt).toContain('dusty atmosphere');
    });
  });

  describe('The Office specific scenario', () => {
    it('should generate appropriate prompt for The Office world', async () => {
      const world = createMockWorld(
        'Modern', 
        'A paper supply company office in Scranton, PA where everyday workplace situations become comedic adventures'
      );
      
      const buildPrompt = (generator as any).buildPrompt.bind(generator);
      const prompt = buildPrompt(world);

      // Should include the world description
      expect(prompt).toContain('paper supply company office');
      expect(prompt).toContain('Scranton, PA');
      
      // Should use modern style, not fantasy
      expect(prompt).toContain('modern realistic style');
      expect(prompt).toContain('contemporary setting');
      expect(prompt).toContain('no fantasy or magical elements');
      
      // Should NOT contain any fantasy elements (except in the "no fantasy" instruction)
      const promptWithoutNoFantasy = prompt.replace(/no fantasy or magical elements/gi, '');
      expect(promptWithoutNoFantasy).not.toMatch(/magic|mystical|fantasy|enchant|spell|wizard|dragon/i);
      
      // Should contain technical requirements
      expect(prompt).toContain('cinematic composition');
      expect(prompt).toContain('no people visible');
    });
  });
});