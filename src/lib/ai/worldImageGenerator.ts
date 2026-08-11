// src/lib/ai/worldImageGenerator.ts

import { World } from '../../types/world.types';
import { GeneratedImage } from '../../types/common.types';
import { getTimestamp } from '@/lib/utils';

import Logger from '@/lib/utils/logger';
import { aiFetch } from './aiFetch';
const logger = new Logger('WorldImageGenerator');

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

    const response = await aiFetch('/api/generate-world-image', {
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
    logger.error('World image generation error:', error);
    throw error;
  }
}
