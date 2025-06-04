import { generateWorld } from '../worldGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';

// Mock the AI client
jest.mock('@/lib/ai/defaultGeminiClient');

describe('worldGenerator', () => {
  const mockGenerateContent = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (createDefaultGeminiClient as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent
    });
  });

  describe('theme selection for "set_in" worlds', () => {
    it('should use Modern theme for The Office setting', async () => {
      const mockResponse = {
        content: JSON.stringify({
          name: "Dunder Mifflin Scranton",
          theme: "Modern",
          description: "A paper supply company branch in Scranton, PA where everyday office life becomes an adventure.",
          attributes: [
            {
              name: "Charisma",
              description: "Your ability to connect with coworkers",
              minValue: 1,
              maxValue: 10,
              defaultValue: 5
            },
            {
              name: "Productivity",
              description: "How well you actually do your job",
              minValue: 1,
              maxValue: 10,
              defaultValue: 5
            }
          ],
          skills: [
            {
              name: "Sales",
              description: "Closing deals and managing clients",
              difficulty: "medium",
              category: "Professional"
            },
            {
              name: "Office Politics",
              description: "Navigating workplace relationships",
              difficulty: "hard",
              category: "Social"
            }
          ]
        })
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await generateWorld({
        method: 'ai',
        reference: 'The Office',
        relationship: 'set_in',
        existingNames: []
      });

      // Verify the AI was called
      expect(mockGenerateContent).toHaveBeenCalled();
      
      // Verify the prompt includes the correct instructions
      const promptArg = mockGenerateContent.mock.calls[0][0];
      expect(promptArg).toContain('The Office');
      expect(promptArg).toContain('CRITICAL: You MUST identify and use the correct genre');
      expect(promptArg).toContain('The Office = "Modern"');
      expect(promptArg).toContain('NEVER default to Fantasy');
      
      // Verify the result has Modern theme, not Fantasy
      expect(result.theme).toBe('Modern');
      expect(result.theme).not.toBe('Fantasy');
    });

    it('should use Sci-Fi theme for Star Wars setting', async () => {
      const mockResponse = {
        content: JSON.stringify({
          name: "Mos Eisley Cantina",
          theme: "Sci-Fi",
          description: "A notorious spaceport cantina on Tatooine, frequented by smugglers, bounty hunters, and travelers.",
          attributes: [
            {
              name: "Force Sensitivity",
              description: "Connection to the Force",
              minValue: 1,
              maxValue: 10,
              defaultValue: 5
            }
          ],
          skills: [
            {
              name: "Piloting",
              description: "Flying starships and speeders",
              difficulty: "medium",
              category: "Technical"
            }
          ]
        })
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await generateWorld({
        method: 'ai',
        reference: 'Star Wars',
        relationship: 'set_in',
        existingNames: []
      });

      expect(result.theme).toBe('Sci-Fi');
    });

    it('should allow Fantasy theme for Lord of the Rings setting', async () => {
      const mockResponse = {
        content: JSON.stringify({
          name: "The Prancing Pony",
          theme: "Fantasy",
          description: "A famous inn in Bree where travelers from all corners of Middle-earth gather.",
          attributes: [
            {
              name: "Wisdom",
              description: "Knowledge and magical understanding",
              minValue: 1,
              maxValue: 10,
              defaultValue: 5
            }
          ],
          skills: [
            {
              name: "Swordplay",
              description: "Combat with bladed weapons",
              difficulty: "medium",
              category: "Combat"
            }
          ]
        })
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await generateWorld({
        method: 'ai',
        reference: 'Lord of the Rings',
        relationship: 'set_in',
        existingNames: []
      });

      expect(result.theme).toBe('Fantasy');
    });
  });

  describe('skills and attributes for non-fantasy settings', () => {
    it('should generate realistic skills for modern office setting', async () => {
      const mockResponse = {
        content: JSON.stringify({
          name: "Corporate Heights",
          theme: "Modern",
          description: "A modern office building where corporate drama unfolds daily.",
          attributes: [
            {
              name: "Leadership",
              description: "Ability to manage and inspire teams",
              minValue: 1,
              maxValue: 10,
              defaultValue: 5
            }
          ],
          skills: [
            {
              name: "Negotiation",
              description: "Making deals and resolving conflicts",
              difficulty: "hard",
              category: "Professional"
            },
            {
              name: "Networking",
              description: "Building professional relationships",
              difficulty: "medium",
              category: "Social"
            }
          ]
        })
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await generateWorld({
        method: 'ai',
        reference: 'The Office',
        relationship: 'set_in',
        existingNames: []
      });

      // Verify no fantasy elements in skills
      result.skills.forEach(skill => {
        expect(skill.name).not.toMatch(/magic|spell|sorcery|enchant/i);
        expect(skill.description).not.toMatch(/magic|spell|sorcery|enchant/i);
      });

      // Verify no fantasy elements in attributes
      result.attributes.forEach(attr => {
        expect(attr.name).not.toMatch(/mana|arcane|mystical/i);
        expect(attr.description).not.toMatch(/magic|spell|supernatural/i);
      });
    });
  });
});