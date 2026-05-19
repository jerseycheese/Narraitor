// src/lib/ai/worldImageGenerator.ts

import { World } from '../../types/world.types';
import { GeneratedImage } from '../../types/common.types';
import { getTimestamp } from '@/lib/utils';

function buildPrompt(world: World): string {
  const styleModifiers = 'Wide-angle high-detail photograph of';

  let subject: string;
  if (world.description && world.description.trim()) {
    subject = world.description.trim();
  } else {
    subject = `a ${world.genre} world environment`;
  }

  const genreLC = world.genre.toLowerCase();
  let genreContext = '';

  if (genreLC.includes('fantasy')) {
    genreContext = 'in epic fantasy style, magical atmosphere, mystical lighting';
  } else if (genreLC.includes('sci-fi') || genreLC.includes('science fiction')) {
    genreContext = 'in science fiction style, futuristic aesthetic, advanced technology';
  } else if (genreLC.includes('horror')) {
    genreContext = 'in horror style, dark ominous atmosphere, dramatic shadows';
  } else if (genreLC.includes('western')) {
    genreContext = 'in western style, rugged frontier aesthetic, dusty atmosphere';
  } else if (genreLC.includes('cyberpunk')) {
    genreContext = 'in cyberpunk style, neon-lit urban environment, high-tech aesthetic';
  } else if (genreLC.includes('post-apocalyptic')) {
    genreContext = 'in post-apocalyptic style, desolate ruins, abandoned structures';
  } else if (genreLC.includes('historical')) {
    genreContext = 'in historical style, period-accurate details, authentic atmosphere';
  } else if (genreLC.includes('steampunk')) {
    genreContext = 'in steampunk style, brass machinery, steam-powered technology';
  } else if (genreLC.includes('medieval')) {
    genreContext = 'in medieval style, historical architecture, period atmosphere';
  } else if (genreLC.includes('modern') || genreLC.includes('comedy') || genreLC.includes('workplace') || genreLC.includes('crime') || genreLC.includes('drama') || genreLC.includes('contemporary')) {
    genreContext = 'in modern realistic style, contemporary setting, real-world environment, no fantasy or magical elements';
  } else {
    genreContext = `in ${world.genre} style`;
  }

  const technicalDetails = 'cinematic composition, professional lighting, environmental storytelling, no people visible, 4K quality';

  return `${styleModifiers} ${subject} ${genreContext}, ${technicalDetails}`;
}

export async function generateWorldImage(world: World, customPrompt?: string): Promise<GeneratedImage> {
  try {
    const prompt = customPrompt || buildPrompt(world);

    const isStorybook = typeof window !== 'undefined' && window.location.port === '6006';

    if (isStorybook) {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockImages: Record<string, string> = {
        fantasy: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ic2t5IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM4N0NFRkE7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I0ZGRTREMjtzdG9wLW9wYWNpdHk6MSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI3NreSkiLz4KICA8ZWxsaXBzZSBjeD0iNDAwIiBjeT0iMzUwIiByeD0iNDAwIiByeT0iMTAwIiBmaWxsPSIjMjI4QjIyIiBvcGFjaXR5PSIwLjgiLz4KICA8cmVjdCB4PSIxMDAiIHk9IjIwMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzY5Njk2OSIvPgogIDxyZWN0IHg9IjMwMCIgeT0iMTUwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE3MCIgZmlsbD0iIzgwODA4MCIvPgogIDxyZWN0IHg9IjU1MCIgeT0iMTgwIiB3aWR0aD0iNzAiIGhlaWdodD0iMTQwIiBmaWxsPSIjNzA3MDcwIi8+CiAgPGNpcmNsZSBjeD0iNzAwIiBjeT0iODAiIHI9IjQwIiBmaWxsPSIjRkZGRjAwIiBvcGFjaXR5PSIwLjkiLz4KICA8dGV4dCB4PSI0MDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjM2IiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBvcGFjaXR5PSIwLjMiPkZBTlRBU1kgV09STEQ8L3RleHQ+Cjwvc3ZnPg==',
        cyberpunk: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFhMWEyZSIvPgogIDxyZWN0IHg9IjUwIiB5PSIxMDAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjMTYyMTNlIi8+CiAgPHJlY3QgeD0iMjAwIiB5PSI1MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzBmNDM5MiIvPgogIDxyZWN0IHg9IjM1MCIgeT0iODAiIHdpZHRoPSIxMjAiIGhlaWdodD0iMjcwIiBmaWxsPSIjZmY2YjZiIiBvcGFjaXR5PSIwLjciLz4KICA8cmVjdCB4PSI1NTAiIHk9IjEyMCIgd2lkdGg9IjkwIiBoZWlnaHQ9IjIzMCIgZmlsbD0iIzQ4YmZlMyIgb3BhY2l0eT0iMC42Ii8+CiAgPHRleHQgeD0iNDAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0OCIgZmlsbD0iI2ZmMDA3MyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q1lCRVJQVU5LPC90ZXh0Pgo8L3N2Zz4=',
        default: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiPgogICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzg3Q0VGQSIvPgogICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRkZFNEQyIi8+CiAgPC9saW5lYXJHcmFkaWVudD4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNncmFkKSIvPgogIDxjaXJjbGUgY3g9IjcwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iI0ZGRkYwMCIgb3BhY2l0eT0iMC45Ii8+CiAgPHRleHQgeD0iNDAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0OCIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgb3BhY2l0eT0iMC4zIj5XT1JMRDwvdGV4dD4KPC9zdmc+'
      };

      const genreLC = world.genre.toLowerCase();
      let mockImage = mockImages.default;
      if (genreLC.includes('fantasy')) {
        mockImage = mockImages.fantasy;
      } else if (genreLC.includes('cyberpunk')) {
        mockImage = mockImages.cyberpunk;
      }

      return {
        type: 'ai-generated',
        url: mockImage,
        generatedAt: getTimestamp(),
        prompt: prompt
      };
    }

    const response = await fetch('/api/generate-world-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ world, customPrompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate world image');
    }

    const data = await response.json();

    return {
      type: data.aiGenerated ? 'ai-generated' : 'placeholder',
      url: data.imageUrl,
      generatedAt: getTimestamp(),
      prompt: data.prompt || prompt
    };
  } catch (error) {
    console.error('World image generation error:', error);
    throw error;
  }
}
