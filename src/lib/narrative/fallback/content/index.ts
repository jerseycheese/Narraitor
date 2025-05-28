import { FallbackContent } from '../types';
import { fantasyContent } from './fantasy';
import { scifiContent } from './scifi';
import { westernContent } from './western';
import { sitcomContent } from './sitcom';
import { genericContent } from './generic';

/**
 * Main fallback content repository
 * Content is organized by theme and can be extended with new themes
 */
export const fallbackContentRepository: FallbackContent[] = [
  ...fantasyContent,
  ...scifiContent,
  ...westernContent,
  ...sitcomContent,
  ...genericContent
];

// Export theme-specific content for targeted access
export { fantasyContent, scifiContent, westernContent, sitcomContent, genericContent };