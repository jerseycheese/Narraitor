import React from 'react';
import Image from 'next/image';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';

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
  /** Optional test ID for the title */
  titleTestId?: string;
  /** Optional title element type (h1, h2, etc.) */
  titleElement?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Optional actions to render anchored at bottom-right of the hero */
  actions?: React.ReactNode;
  /** Theme/genre for styling (unused in clean slate) */
  theme?: string;
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
 *
 * @param props - Hero configuration
 * @returns A hero section with overlaid content
 *
 * @example With image
 * <Hero
 *   title="My World"
 *   image={{ url: "/world-image.jpg", alt: "My World" }}
 *   subtitle="Fantasy Adventure"
 * />
 *
 * @example With themed background (no image)
 * <Hero
 *   title="Fantasy World"
 *   subtitle="A magical realm"
 * />
 */
export const Hero: React.FC<HeroProps> = ({
  title,
  image,
  subtitle,
  badge,
  titleTestId,
  titleElement: TitleElement = 'h1',
  actions,
  theme, // Destructure but ignore
}) => {
  return (
    <div className="component-hero">
      {image && (
        <Image
          className="component-hero-image"
          src={image.url}
          alt={image.alt}
          width={800}
          height={400}

          // Skip Next's optimization proxy for data URLs and under Playwright.
          // The on-demand optimizer cold-starts slowly on CI and leaves the
          // banner blank past the visual-test image wait (#1346); serving the
          // raw file keeps the banner deterministic in tests.
          unoptimized={
            isPlaywrightEnv() ||
            (typeof image.url === 'string' && image.url.startsWith('data:'))
          }
        />
      )}

      {/* Title overlay with gradient background */}
      <div className="component-hero-overlay">
        <div className="component-hero-content">
          <TitleElement
            className="component-hero-title"
            data-testid={titleTestId}
          >
            {title}
          </TitleElement>

          {subtitle && (
            <p className="component-hero-subtitle">
              {subtitle}
            </p>
          )}

          {badge && <div className="component-hero-badge">{badge}</div>}
        </div>
      </div>

      {actions && (
        <div className="component-hero-actions">
          {actions}
        </div>
      )}
    </div>
  );
};
