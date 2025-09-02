import React from 'react';
import Image from 'next/image';

interface HeroProps {
  /** The title to display over the image */
  title: string;
  /** The image to display (optional) */
  image?: {
    url: string;
    alt: string;
  };
  /** Optional subtitle to display under the title */
  subtitle?: string;
  /** Optional badge content to display */
  badge?: React.ReactNode;
  /** Height class for the hero section */
  height?: string;
  /** Optional test ID for the title */
  titleTestId?: string;
  /** Optional title element type (h1, h2, etc.) */
  titleElement?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Background color theme when no image is provided */
  theme?: 'fantasy' | 'sci-fi' | 'western' | 'modern' | 'horror' | 'default';
}

/**
 * Hero - Display a large hero section with image or themed background
 *
 * Creates a hero section with either an image background or a themed gradient 
 * background when no image is provided. Includes a gradient overlay containing 
 * the title, optional subtitle, and badge content.
 *
 * Features:
 * - Optional responsive image display
 * - Themed background colors for different genres
 * - Gradient overlay for text readability
 * - Optional subtitle and badge support
 * - Configurable height
 *
 * @param props - Hero configuration
 * @returns A hero section with overlaid content
 *
 * @example With image
 * <Hero
 *   title="My World"
 *   image={{ url: "/world-image.jpg", alt: "My World" }}
 *   subtitle="Fantasy Adventure"
 *   height="h-64 md:h-96"
 * />
 *
 * @example With themed background (no image)
 * <Hero
 *   title="Fantasy World"
 *   subtitle="A magical realm"
 *   theme="fantasy"
 *   height="h-64 md:h-96"
 * />
 */
export const Hero: React.FC<HeroProps> = ({
  title,
  image,
  subtitle,
  badge,
  height = 'h-64 md:h-96',
  titleTestId,
  titleElement: TitleElement = 'h1',
  theme = 'default',
}) => {
  // Theme-based background gradients
  const getThemeBackground = (theme: string) => {
    switch (theme) {
      case 'fantasy':
        return 'bg-gradient-to-br from-purple-700 via-blue-800 to-indigo-900';
      case 'sci-fi':
        return 'bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-900';
      case 'western':
        return 'bg-gradient-to-br from-orange-600 via-red-700 to-amber-800';
      case 'modern':
        return 'bg-gradient-to-br from-gray-600 via-slate-700 to-gray-900';
      case 'horror':
        return 'bg-gradient-to-br from-red-900 via-gray-900 to-black';
      default:
        return 'bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800';
    }
  };

  return (
    <div
      className={`${height} overflow-hidden rounded-lg shadow-lg relative ${
        image ? 'bg-gray-100' : getThemeBackground(theme)
      }`}
    >
      {image && (
        <Image
          src={image.url}
          alt={image.alt}
          width={800}
          height={400}
          className="w-full h-full object-cover"
        />
      )}

      {/* Title overlay with gradient background */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className={`px-4 py-4 ${
          image 
            ? 'bg-gradient-to-t from-black/80 to-transparent' 
            : 'bg-gradient-to-t from-black/40 to-transparent'
        }`}>
          <TitleElement
            className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight text-white"
            data-testid={titleTestId}
          >
            {title}
          </TitleElement>

          {subtitle && (
            <p className="text-gray-300 mt-1 text-sm sm:text-base">
              {subtitle}
            </p>
          )}

          {badge && <div className="mt-2">{badge}</div>}
        </div>
      </div>
    </div>
  );
};
