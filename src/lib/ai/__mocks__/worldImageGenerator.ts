// src/lib/ai/__mocks__/worldImageGenerator.ts

import { World, WorldImage } from '../../../types/world.types';
import { AIClient } from '../types';

// Mock SVG data for different world themes
const mockWorldImages: Record<string, string> = {
  fantasy: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ic2t5IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM4N0NFRkE7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I0ZGRTREMjtzdG9wLW9wYWNpdHk6MSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI3NreSkiLz4KICA8ZWxsaXBzZSBjeD0iNDAwIiBjeT0iMzUwIiByeD0iNDAwIiByeT0iMTAwIiBmaWxsPSIjMjI4QjIyIiBvcGFjaXR5PSIwLjgiLz4KICA8cmVjdCB4PSIxMDAiIHk9IjIwMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzY5Njk2OSIvPgogIDxyZWN0IHg9IjMwMCIgeT0iMTUwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE3MCIgZmlsbD0iIzgwODA4MCIvPgogIDxyZWN0IHg9IjU1MCIgeT0iMTgwIiB3aWR0aD0iNzAiIGhlaWdodD0iMTQwIiBmaWxsPSIjNzA3MDcwIi8+CiAgPGNpcmNsZSBjeD0iNzAwIiBjeT0iODAiIHI9IjQwIiBmaWxsPSIjRkZGRjAwIiBvcGFjaXR5PSIwLjkiLz4KICA8dGV4dCB4PSI0MDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjM2IiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBvcGFjaXR5PSIwLjMiPkZBTlRBU1kgV09STEQ8L3RleHQ+Cjwvc3ZnPg==',
  cyberpunk: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFhMWEyZSIvPgogIDxyZWN0IHg9IjUwIiB5PSIxMDAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjMTYyMTNlIi8+CiAgPHJlY3QgeD0iMjAwIiB5PSI1MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzBmNDM5MiIvPgogIDxyZWN0IHg9IjM1MCIgeT0iODAiIHdpZHRoPSIxMjAiIGhlaWdodD0iMjcwIiBmaWxsPSIjZmY2YjZiIiBvcGFjaXR5PSIwLjciLz4KICA8cmVjdCB4PSI1NTAiIHk9IjEyMCIgd2lkdGg9IjkwIiBoZWlnaHQ9IjIzMCIgZmlsbD0iIzQ4YmZlMyIgb3BhY2l0eT0iMC42Ii8+CiAgPHRleHQgeD0iNDAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0OCIgZmlsbD0iI2ZmMDA3MyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q1lCRVJQVU5LPC90ZXh0Pgo8L3N2Zz4=',
  horror: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzBhMDAwMCIvPgogIDxwYXRoIGQ9Ik0wLDQwMCBMMCwzMDAgQzEwMCwyODAgMjAwLDMyMCAzMDAsMjgwIEM0MDAsMjQwIDUwMCwyODAgNjAwLDI2MCBDNZAMDI0MCA4MDAsMjgwIDgwMCw0MDBaIiBmaWxsPSIjMzMwMDAwIiBvcGFjaXR5PSIwLjgiLz4KICA8Y2lyY2xlIGN4PSI2MDAiIGN5PSI4MCIgcj0iNjAiIGZpbGw9IiNkYzE0M2MiIG9wYWNpdHk9IjAuNSIvPgogIDx0ZXh0IHg9IjQwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQ3JlZXBzdGVyIiBmb250LXNpemU9IjQ4IiBmaWxsPSIjOGIwMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBvcGFjaXR5PSIwLjciPkhPUlJPUjwvdGV4dD4KPC9zdmc+',
  western: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2ZmZGJhNCIvPgogIDxlbGxpcHNlIGN4PSI0MDAiIGN5PSI0MDUiIHJ4PSI2MDAiIHJ5PSIxNTAiIGZpbGw9IiNkMmI0OGMiLz4KICA8cmVjdCB4PSIxNTAiIHk9IjI1MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzhhNGEzZCIvPgogIDxyZWN0IHg9IjU5MCIgeT0iMjMwIiB3aWR0aD0iNjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjOGE0YTNkIi8+CiAgPGNpcmNsZSBjeD0iNzAwIiBjeT0iNjAiIHI9IjUwIiBmaWxsPSIjZmZmZjAwIi8+CiAgPHRleHQgeD0iNDAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0MiIgZmlsbD0iIzhiNDUxMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgb3BhY2l0eT0iMC42Ij5XRVNURVJOPC90ZXh0Pgo8L3N2Zz4=',
  default: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiPgogICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzg3Q0VGQSIvPgogICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRkZFNEQyIi8+CiAgPC9saW5lYXJHcmFkaWVudD4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNncmFkKSIvPgogIDxjaXJjbGUgY3g9IjcwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iI0ZGRkYwMCIgb3BhY2l0eT0iMC45Ii8+CiAgPHRleHQgeD0iNDAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0OCIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgb3BhY2l0eT0iMC4zIj5XT1JMRDwvdGV4dD4KPC9zdmc+'
};

export class WorldImageGenerator {
  constructor(private aiClient: AIClient) {}

  /**
   * Generate a prompt for a world environment image
   */
  private buildPrompt(world: World): string {
    const subject: string[] = [];
    const context: string[] = [];
    const style: string[] = [];
    const quality: string[] = [];

    // Core subject - environmental shot
    subject.push('Photorealistic landscape photograph');
    subject.push(`${world.theme} themed environment`);

    // Extract key details from description
    if (world.description) {
      // Look for specific environmental features
      const environmentalFeatures = world.description.match(
        /(desert|forest|mountain|ocean|city|village|castle|ruins|space station|alien|dystopian|utopian|medieval|futuristic|cyberpunk|steampunk|magical|wasteland|jungle|arctic|volcanic|underwater|floating|underground)/gi
      );
      
      if (environmentalFeatures) {
        context.push(`featuring ${environmentalFeatures.join(', ')}`);
      }

      // Look for time of day or atmospheric conditions
      const atmosphericConditions = world.description.match(
        /(dawn|dusk|night|day|sunset|sunrise|foggy|misty|stormy|clear|rainy|snowy)/gi
      );
      
      if (atmosphericConditions) {
        context.push(`${atmosphericConditions.join(', ')} atmosphere`);
      }
    }

    // Theme-specific enhancements
    const themeLC = world.theme.toLowerCase();
    
    if (themeLC.includes('fantasy')) {
      context.push('epic fantasy vista');
      context.push('magical atmosphere');
      style.push('fantasy art inspiration');
    } else if (themeLC.includes('sci-fi') || themeLC.includes('science fiction')) {
      context.push('futuristic landscape');
      context.push('advanced technology visible');
      style.push('science fiction concept art style');
    } else if (themeLC.includes('horror')) {
      context.push('ominous and foreboding');
      context.push('dark atmospheric lighting');
      style.push('horror atmosphere');
    } else if (themeLC.includes('western')) {
      context.push('old west frontier');
      context.push('dusty and weathered');
      style.push('western film cinematography');
    } else if (themeLC.includes('cyberpunk')) {
      context.push('neon-lit cityscape');
      context.push('high-tech low-life aesthetic');
      style.push('cyberpunk visual style');
    } else if (themeLC.includes('post-apocalyptic')) {
      context.push('ruined civilization');
      context.push('desolate and abandoned');
      style.push('post-apocalyptic atmosphere');
    } else if (themeLC.includes('historical')) {
      context.push('period-accurate environment');
      context.push('historical authenticity');
      style.push('historical photography style');
    }

    // Quality and technical specifications
    quality.push('ultra high resolution');
    quality.push('8K quality');
    quality.push('professional photography');
    quality.push('cinematic composition');
    quality.push('dramatic lighting');
    quality.push('depth of field');
    quality.push('wide angle lens');
    quality.push('landscape photography');
    quality.push('environmental storytelling');
    quality.push('no people or characters visible');
    quality.push('establishing shot');

    // Combine all parts
    const promptParts = [
      ...subject,
      ...context,
      ...style,
      ...quality
    ];

    return promptParts.join(', ');
  }

  /**
   * Generate an image for a world (mocked version)
   */
  async generateWorldImage(world: World): Promise<WorldImage> {
    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Randomly fail sometimes to test error handling
    if (Math.random() < 0.1) {
      throw new Error('Mock world image generation failed');
    }

    const prompt = this.buildPrompt(world);
    const themeLC = world.theme.toLowerCase();
    
    // Select appropriate mock image based on theme
    let mockImage = mockWorldImages.default;
    if (themeLC.includes('fantasy')) {
      mockImage = mockWorldImages.fantasy;
    } else if (themeLC.includes('cyberpunk')) {
      mockImage = mockWorldImages.cyberpunk;
    } else if (themeLC.includes('horror')) {
      mockImage = mockWorldImages.horror;
    } else if (themeLC.includes('western')) {
      mockImage = mockWorldImages.western;
    }
    
    return {
      type: 'ai-generated',
      url: mockImage,
      generatedAt: new Date().toISOString(),
      prompt: prompt
    };
  }
}