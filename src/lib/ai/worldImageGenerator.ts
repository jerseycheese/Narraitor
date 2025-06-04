// src/lib/ai/worldImageGenerator.ts

import { World, WorldImage } from '../../types/world.types';
import { AIClient } from './types';

export class WorldImageGenerator {
  constructor(private aiClient: AIClient) {}

  /**
   * Generate a prompt for a world environment image
   */
  private buildPrompt(world: World): string {
    // Following Google's recommended structure: [Lens type] [Quality modifier] photo of [subject] in [style/context], [additional specific details]
    
    // 1. Photography/Style Modifiers (Google recommends lens types and quality)
    const styleModifiers = 'Wide-angle high-detail photograph of';
    
    // 2. Subject (core description from the world)
    let subject: string;
    if (world.description && world.description.trim()) {
      subject = world.description.trim();
    } else {
      subject = `a ${world.theme} world environment`;
    }

    // 3. Context/Style based on theme (Google recommends specific style instructions)
    const themeLC = world.theme.toLowerCase();
    let themeContext = '';
    
    if (themeLC.includes('fantasy')) {
      themeContext = 'in epic fantasy style, magical atmosphere, mystical lighting';
    } else if (themeLC.includes('sci-fi') || themeLC.includes('science fiction')) {
      themeContext = 'in science fiction style, futuristic aesthetic, advanced technology';
    } else if (themeLC.includes('horror')) {
      themeContext = 'in horror style, dark ominous atmosphere, dramatic shadows';
    } else if (themeLC.includes('western')) {
      themeContext = 'in western style, rugged frontier aesthetic, dusty atmosphere';
    } else if (themeLC.includes('cyberpunk')) {
      themeContext = 'in cyberpunk style, neon-lit urban environment, high-tech aesthetic';
    } else if (themeLC.includes('post-apocalyptic')) {
      themeContext = 'in post-apocalyptic style, desolate ruins, abandoned structures';
    } else if (themeLC.includes('historical')) {
      themeContext = 'in historical style, period-accurate details, authentic atmosphere';
    } else if (themeLC.includes('steampunk')) {
      themeContext = 'in steampunk style, brass machinery, steam-powered technology';
    } else if (themeLC.includes('medieval')) {
      themeContext = 'in medieval style, historical architecture, period atmosphere';
    } else if (themeLC.includes('modern') || themeLC.includes('comedy') || themeLC.includes('workplace') || themeLC.includes('crime') || themeLC.includes('drama') || themeLC.includes('contemporary')) {
      themeContext = 'in modern realistic style, contemporary setting, real-world environment, no fantasy or magical elements';
    } else {
      themeContext = `in ${world.theme} style`;
    }

    // 4. Additional technical details (Google recommends these for quality)
    const technicalDetails = 'cinematic composition, professional lighting, environmental storytelling, no people visible, 4K quality';

    // Combine following Google's structure
    return `${styleModifiers} ${subject} ${themeContext}, ${technicalDetails}`;
  }

  /**
   * Generate an image for a world
   * @param world - The world to generate an image for
   * @param customPrompt - Optional custom prompt to override the auto-generated one
   */
  async generateWorldImage(world: World, customPrompt?: string): Promise<WorldImage> {
    try {
      const prompt = customPrompt || this.buildPrompt(world);
      
      // Check if we're in Storybook environment
      const isStorybook = typeof window !== 'undefined' && window.location.port === '6006';
      
      if (isStorybook) {
        // Use mock data in Storybook
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
        
        const mockImages: Record<string, string> = {
          fantasy: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ic2t5IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM4N0NFRkE7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I0ZGRTREMjtzdG9wLW9wYWNpdHk6MSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI3NreSkiLz4KICA8ZWxsaXBzZSBjeD0iNDAwIiBjeT0iMzUwIiByeD0iNDAwIiByeT0iMTAwIiBmaWxsPSIjMjI4QjIyIiBvcGFjaXR5PSIwLjgiLz4KICA8cmVjdCB4PSIxMDAiIHk9IjIwMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzY5Njk2OSIvPgogIDxyZWN0IHg9IjMwMCIgeT0iMTUwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE3MCIgZmlsbD0iIzgwODA4MCIvPgogIDxyZWN0IHg9IjU1MCIgeT0iMTgwIiB3aWR0aD0iNzAiIGhlaWdodD0iMTQwIiBmaWxsPSIjNzA3MDcwIi8+CiAgPGNpcmNsZSBjeD0iNzAwIiBjeT0iODAiIHI9IjQwIiBmaWxsPSIjRkZGRjAwIiBvcGFjaXR5PSIwLjkiLz4KICA8dGV4dCB4PSI0MDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjM2IiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBvcGFjaXR5PSIwLjMiPkZBTlRBU1kgV09STEQ8L3RleHQ+Cjwvc3ZnPg==',
          cyberpunk: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFhMWEyZSIvPgogIDxyZWN0IHg9IjUwIiB5PSIxMDAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjMTYyMTNlIi8+CiAgPHJlY3QgeD0iMjAwIiB5PSI1MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzBmNDM5MiIvPgogIDxyZWN0IHg9IjM1MCIgeT0iODAiIHdpZHRoPSIxMjAiIGhlaWdodD0iMjcwIiBmaWxsPSIjZmY2YjZiIiBvcGFjaXR5PSIwLjciLz4KICA8cmVjdCB4PSI1NTAiIHk9IjEyMCIgd2lkdGg9IjkwIiBoZWlnaHQ9IjIzMCIgZmlsbD0iIzQ4YmZlMyIgb3BhY2l0eT0iMC42Ii8+CiAgPHRleHQgeD0iNDAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0OCIgZmlsbD0iI2ZmMDA3MyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q1lCRVJQVU5LPC90ZXh0Pgo8L3N2Zz4=',
          default: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiPgogICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzg3Q0VGQSIvPgogICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRkZFNEQyIi8+CiAgPC9saW5lYXJHcmFkaWVudD4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNncmFkKSIvPgogIDxjaXJjbGUgY3g9IjcwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iI0ZGRkYwMCIgb3BhY2l0eT0iMC45Ii8+CiAgPHRleHQgeD0iNDAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0OCIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgb3BhY2l0eT0iMC4zIj5XT1JMRDwvdGV4dD4KPC9zdmc+'
        };
        
        const themeLC = world.theme.toLowerCase();
        let mockImage = mockImages.default;
        if (themeLC.includes('fantasy')) {
          mockImage = mockImages.fantasy;
        } else if (themeLC.includes('cyberpunk')) {
          mockImage = mockImages.cyberpunk;
        }
        
        return {
          type: 'ai-generated',
          url: mockImage,
          generatedAt: new Date().toISOString(),
          prompt: prompt
        };
      }
      
      // Make the API call through our dedicated world image generation endpoint
      const response = await fetch('/api/generate-world-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ world }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate world image');
      }

      const data = await response.json();
      
      return {
        type: data.aiGenerated ? 'ai-generated' : 'placeholder',
        url: data.imageUrl,
        generatedAt: new Date().toISOString(),
        prompt: data.prompt || prompt
      };
    } catch (error) {
      console.error('World image generation error:', error);
      throw error;
    }
  }
}