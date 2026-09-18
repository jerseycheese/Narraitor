'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';
import { plateInkStyle, usePlate } from '@/hooks/usePlate';

/**
 * How the art is printed.
 *
 * `ink` is the rule: a normalised greyscale plate the theme colours, screened
 * or continuous depending on how large it is reproduced. `colour` is the art as
 * generated, and is reserved for the world detail hero, the one surface where
 * seeing the generated colour is the point.
 */
export type HeroTreatment = 'ink' | 'colour';

/**
 * Measured sizes are bucketed before a plate is rendered.
 *
 * A plate is keyed by its display size, so reacting to every pixel of a drag
 * would render a new one per frame and fill the cache with near-duplicates.
 */
const SIZE_BUCKET_PX = 32;

function bucket(value: number): number {
  return Math.max(SIZE_BUCKET_PX, Math.round(value / SIZE_BUCKET_PX) * SIZE_BUCKET_PX);
}

interface HeroProps {
  /** The title to display over the image. Omit (with no subtitle/badge) to
   * render a purely decorative banner — detail pages do this so the entity
   * name isn't repeated below the page-level h1. */
  title?: string;
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
  /** How the art is printed. See {@link HeroTreatment}. */
  treatment?: HeroTreatment;
}

/**
 * Hero - Display a large hero section with image or themed background
 *
 * Creates a hero section with either an image background or a themed gradient
 * background when no image is provided. Includes a gradient overlay containing
 * the title, optional subtitle, and badge content.
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
 * @example The colour exception
 * <Hero image={{ url, alt }} treatment="colour" />
 */
export const Hero: React.FC<HeroProps> = ({
  title,
  image,
  subtitle,
  badge,
  titleTestId,
  titleElement: TitleElement = 'h1',
  treatment = 'ink',
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);

  const inked = treatment === 'ink';

  useEffect(() => {
    if (!inked) return;

    const measure = () => {
      const frame = frameRef.current;
      if (!frame) return;

      const { width, height } = frame.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;

      setBox((current) => {
        const next = { width: bucket(width), height: bucket(height) };
        if (current?.width === next.width && current?.height === next.height) {
          return current;
        }
        return next;
      });
    };

    // Observe the frame, not the window. A card's size often settles after
    // mount (fonts, sibling content, grid tracks), and a plate made for the
    // first measurement would otherwise stick at the wrong size and treatment.
    // No initial-fire guard is needed: the callback only stores a bucketed
    // size, and swapping the plate never resizes the frame.
    const frame = frameRef.current;
    if (!frame) return;

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);

    return () => observer.disconnect();
  }, [inked]);

  const { plate, pending } = usePlate(inked ? image?.url : undefined, {
    width: box?.width ?? 0,
    height: box?.height ?? 0,
  });

  // Until a plate exists the art renders as it is, so the banner is never a
  // gap and a browser with no canvas simply keeps the original.
  const showPlate = inked && Boolean(plate);
  const displayed = showPlate && plate ? plate.source : image?.url;

  return (
    <div
      ref={frameRef}
      className={clsx('component-hero', showPlate && 'plate-inked')}
      style={showPlate ? plateInkStyle(plate) : undefined}
      data-plate={pending ? 'pending' : undefined}
    >
      {image && displayed && (
        <Image
          className="component-hero-image"
          src={displayed}
          alt={image.alt}
          width={800}
          height={400}

          // Skip Next's optimization proxy for data URLs and under Playwright.
          // The on-demand optimizer cold-starts slowly on CI and leaves the
          // banner blank past the visual-test image wait; serving the raw file
          // keeps the banner deterministic in tests. A plate is always a data
          // URL, so it never goes through the optimizer either.
          unoptimized={
            isPlaywrightEnv() ||
            (typeof displayed === 'string' && displayed.startsWith('data:'))
          }
        />
      )}

      {/* Title overlay with gradient background; skipped entirely when the
          hero is decorative so no empty bar renders over the image */}
      {(title || subtitle || badge) && (
        <div className="component-hero-overlay">
          <div className="component-hero-content">
            {title && (
              <TitleElement
                className="component-hero-title"
                data-testid={titleTestId}
              >
                {title}
              </TitleElement>
            )}

            {subtitle && (
              <p className="component-hero-subtitle">
                {subtitle}
              </p>
            )}

            {badge && <div className="component-hero-badge">{badge}</div>}
          </div>
        </div>
      )}
    </div>
  );
};
