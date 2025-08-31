import React from 'react';
import Image from 'next/image';

interface HeroProps {
  /** The title to display over the image */
  title: string;
  /** The image to display */
  image: {
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
}

/**
 * Hero - Display a large image with overlaid title and optional content
 *
 * Creates an image hero section with a gradient overlay containing the title,
 * optional subtitle, and badge content. Uses the same overlay styling as
 * WorldCard for consistency.
 *
 * Features:
 * - Responsive image display
 * - Gradient overlay for text readability
 * - Optional subtitle and badge support
 * - Configurable height
 *
 * @param props - Hero configuration
 * @returns A hero section with overlaid content
 *
 * @example Basic usage
 * <Hero
 *   title="My World"
 *   image={{ url: "/world-image.jpg", alt: "My World" }}
 *   subtitle="Fantasy Adventure"
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
}) => {
  return (
    <div
      className={`${height} overflow-hidden rounded-lg shadow-lg bg-gray-100 relative`}
    >
      <Image
        src={image.url}
        alt={image.alt}
        width={800}
        height={400}
        className="w-full h-full object-cover"
      />

      {/* Title overlay with gradient background */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="bg-gradient-to-t from-black/80 to-transparent px-4 py-4">
          <TitleElement
            className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight text-white"
            data-testid={titleTestId}
          >
            {title}
          </TitleElement>

          {subtitle && (
            <p className="text-gray-200 mt-1 text-sm sm:text-base">
              {subtitle}
            </p>
          )}

          {badge && <div className="mt-2">{badge}</div>}
        </div>
      </div>
    </div>
  );
};
