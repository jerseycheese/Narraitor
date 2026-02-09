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
  /** Background color theme when no image is provided - uses genre values */
  theme?: 'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'horror' | 'mystery' | 'western' | 'cyberpunk' | 'other' | 'default';
  /** Border radius style - 'all' for all corners, 'top' for top only, 'none' for no radius */
  borderRadius?: 'all' | 'top' | 'none';
  /** Optional actions to render anchored at bottom-right of the hero */
  actions?: React.ReactNode;
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
 *   height=""
 * />
 *
 * @example With themed background (no image)
 * <Hero
 *   title="Fantasy World"
 *   subtitle="A magical realm"
 *   theme="fantasy"
 *   height=""
 * />
 */
export const Hero: React.FC<HeroProps> = ({
  title,
  image,
  subtitle,
  badge,
  height = '',
  titleTestId,
  titleElement: TitleElement = 'h1',
  theme = 'default',
  borderRadius = 'all',
  actions,
}) => {
  // Genre-based background gradients using design system colors only
  const getThemeBackground = (theme: string) => {
    switch (theme) {
      case 'fantasy':
        return '';
      case 'sci-fi':
      case 'cyberpunk':
        return '';
      case 'western':
        return '';
      case 'modern':
      case 'historical':
        return '';
      case 'horror':
        return '';
      case 'mystery':
        return '';
      case 'other':
        return '';
      default:
        return '';
    }
  };

  // Get border radius classes based on borderRadius prop
  const getBorderRadiusClass = (borderRadius: string) => {
    switch (borderRadius) {
      case 'top':
        return '';
      case 'none':
        return '';
      case 'all':
      default:
        return '';
    }
  };

  return (
    <div
      className={`${height} ${getBorderRadiusClass(borderRadius)} ${
        image ? '' : getThemeBackground(theme)
      }`}
    >
      {image && (
        <Image
          src={image.url}
          alt={image.alt}
          width={800}
          height={400}
          
          // Use unoptimized for data URLs and tests to avoid Next optimization proxy
          unoptimized={typeof image.url === 'string' && image.url.startsWith('data:')}
        />
      )}

      {/* Title overlay with gradient background */}
      <div>
        <div className={`${
          image 
            ? '' 
            : ''
        }`}>
          <TitleElement
            
            data-testid={titleTestId}
          >
            {title}
          </TitleElement>

          {subtitle && (
            <p>
              {subtitle}
            </p>
          )}

          {badge && <div>{badge}</div>}
        </div>
      </div>

      {actions && (
        <div>
          {actions}
        </div>
      )}
    </div>
  );
};
