/**
 * Genre-based style guidance for AI image generation
 *
 * Provides consistent style guidance across different image generation contexts
 * (world images, ending images, portraits, etc.)
 */

export type ImageContext = 'landscape' | 'ending' | 'portrait';

/**
 * Get style guidance based on genre and image context
 *
 * @param genre - The world genre (e.g., 'fantasy', 'sci-fi', 'horror')
 * @param context - The type of image being generated
 * @returns Style guidance string for AI image generation
 */
export function getGenreStyleGuidance(
  genre: string,
  context: ImageContext = 'landscape'
): string {
  const normalizedGenre = genre?.toLowerCase() || 'fantasy';

  switch(normalizedGenre) {
    case 'fantasy':
      return context === 'landscape'
        ? 'Epic fantasy landscape with magical elements, mystical lighting, ancient architecture, floating islands or magical forests. Style: high fantasy art, detailed digital painting, dramatic lighting.'
        : context === 'ending'
        ? 'Epic fantasy setting with magical elements, ancient architecture, mystical lighting. Style: high fantasy art, detailed digital painting, cinematic composition.'
        : 'Epic fantasy setting with magical elements. Style: high fantasy art, detailed digital painting.';

    case 'sci-fi':
    case 'science fiction':
      return context === 'landscape'
        ? 'Futuristic sci-fi landscape with advanced technology, space stations, alien worlds, or cybernetic cities. Style: concept art, sleek futuristic design, neon lighting, technological elements.'
        : context === 'ending'
        ? 'Futuristic sci-fi setting with advanced technology, space stations, alien worlds. Style: concept art, sleek futuristic design, cinematic sci-fi aesthetic.'
        : 'Futuristic sci-fi setting with advanced technology. Style: concept art, sleek futuristic design.';

    case 'horror':
      return context === 'landscape'
        ? 'Dark, ominous landscape with gothic architecture, twisted trees, fog, abandoned buildings, eerie atmosphere. Style: dark gothic art, horror atmosphere, dim lighting, unsettling mood.'
        : context === 'ending'
        ? 'Gothic horror setting with dark atmosphere, but ending-appropriate mood. Style: atmospheric horror art, dramatic shadows, emotional depth.'
        : 'Gothic horror setting with dark atmosphere. Style: atmospheric horror art, dramatic shadows.';

    case 'western':
      return context === 'landscape'
        ? 'Wild west landscape with desert mesas, old towns, saloons, dusty trails, canyon landscapes. Style: classic western film aesthetic, warm desert colors, vintage atmosphere.'
        : context === 'ending'
        ? 'Wild west setting with desert landscapes, frontier towns, classic western imagery. Style: classic western film aesthetic, warm desert colors, cinematic composition.'
        : 'Wild west setting with classic western imagery. Style: classic western film aesthetic, warm desert colors.';

    case 'cyberpunk':
      return context === 'landscape'
        ? 'Neon-lit cyberpunk cityscape with towering skyscrapers, flying vehicles, holographic advertisements, rain-soaked streets. Style: cyberpunk aesthetic, neon colors, urban decay, high-tech low-life.'
        : context === 'ending'
        ? 'Cyberpunk cityscape with neon lighting, urban environment, high-tech elements. Style: cyberpunk aesthetic, dramatic neon lighting, urban atmosphere.'
        : 'Cyberpunk cityscape with neon lighting. Style: cyberpunk aesthetic, dramatic neon lighting.';

    case 'steampunk':
      return context === 'landscape'
        ? 'Victorian-era landscape with steam-powered machinery, brass and copper elements, airships, clockwork mechanisms. Style: steampunk aesthetic, brass and bronze tones, mechanical details.'
        : context === 'ending'
        ? 'Victorian steampunk setting with brass machinery, clockwork elements, industrial atmosphere. Style: steampunk aesthetic, warm brass tones, mechanical details.'
        : 'Victorian steampunk setting with brass machinery. Style: steampunk aesthetic, warm brass tones.';

    case 'post-apocalyptic':
      return context === 'landscape'
        ? 'Desolate post-apocalyptic landscape with ruined cities, overgrown vegetation, abandoned vehicles, wasteland atmosphere. Style: post-apocalyptic art, muted colors, decay and reclamation by nature.'
        : context === 'ending'
        ? 'Post-apocalyptic landscape with ruins and reclaimed nature, but showing the ending\'s emotional tone. Style: post-apocalyptic art, atmospheric depth.'
        : 'Post-apocalyptic setting with ruins and reclaimed nature. Style: post-apocalyptic art, atmospheric depth.';

    case 'biopunk':
    case 'gothic horror':
    case 'biopunk/gothic horror':
      return context === 'landscape'
        ? 'Bio-organic gothic landscape with mutated flora, twisted architecture, bio-mechanical elements, perpetual twilight atmosphere. Style: bio-horror aesthetic, organic and mechanical fusion, dark atmospheric lighting.'
        : 'Bio-organic gothic setting with mutated elements, twisted architecture, bio-mechanical fusion. Style: bio-horror aesthetic, dark atmospheric lighting.';

    default:
      return context === 'landscape'
        ? 'Epic landscape with dramatic lighting and detailed environment. Style: high-quality digital art, cinematic composition, professional concept art.'
        : context === 'ending'
        ? 'Epic setting with dramatic lighting and detailed environment. Style: high-quality digital art, cinematic composition.'
        : 'Epic setting with dramatic lighting. Style: high-quality digital art.';
  }
}

/**
 * Get fallback placeholder image based on genre and tone
 *
 * @param genre - The world genre
 * @param seed - Unique seed for consistent placeholder generation
 * @param tone - Optional tone for ending-specific placeholders
 * @returns URL for placeholder image
 */
export function getGenreFallbackImage(
  genre: string,
  seed: string,
  tone?: string
): string {
  const normalizedGenre = genre?.toLowerCase() || 'fantasy';

  // If tone is provided, use tone-based fallback
  if (tone) {
    switch(tone) {
      case 'triumphant':
        return `https://picsum.photos/seed/${seed}/800/600?sepia`;
      case 'mysterious':
        return `https://picsum.photos/seed/${seed}/800/600?grayscale&blur=2`;
      case 'tragic':
        return `https://picsum.photos/seed/${seed}/800/600?grayscale`;
      case 'hopeful':
        return `https://picsum.photos/seed/${seed}/800/600`;
      default:
        return `https://picsum.photos/seed/${seed}/800/600`;
    }
  }

  // Otherwise use genre-based fallback
  switch(normalizedGenre) {
    case 'fantasy':
      return `https://picsum.photos/seed/${seed}/800/600?blur=1`;
    case 'sci-fi':
    case 'science fiction':
      return `https://picsum.photos/seed/${seed}/800/600?grayscale`;
    case 'horror':
    case 'biopunk':
    case 'gothic horror':
    case 'biopunk/gothic horror':
      return `https://picsum.photos/seed/${seed}/800/600?blur=2`;
    case 'western':
      return `https://picsum.photos/seed/${seed}/800/600?sepia`;
    case 'cyberpunk':
      return `https://picsum.photos/seed/${seed}/800/600`;
    case 'post-apocalyptic':
      return `https://picsum.photos/seed/${seed}/800/600?grayscale&blur=1`;
    default:
      return `https://picsum.photos/seed/${seed}/800/600`;
  }
}
