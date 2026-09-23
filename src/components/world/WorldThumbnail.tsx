'use client';

import React from 'react';
import Image from 'next/image';
import { Globe } from 'lucide-react';
import clsx from 'clsx';
import { plateInkStyle, usePlate } from '@/hooks/usePlate';
import { initialOf } from '@/lib/utils';

export interface WorldThumbnailProps {
  url?: string | null;
  name?: string;
  size?: 'sm' | 'lg';
  className?: string;
}

const SIZE_CONFIG = {
  sm: { px: 32, className: 'component-world-table-thumb' },
  lg: { px: 96, className: 'dashboard-recent-world-thumb' },
} as const;

export function WorldThumbnail({
  url,
  name = '',
  size = 'sm',
  className,
}: WorldThumbnailProps) {
  const config = SIZE_CONFIG[size];
  const box = { width: config.px, height: config.px };
  const { plate, pending, blank } = usePlate(url ?? undefined, box);

  // Flat art has no tonal range to print, so it would render as a solid slab.
  // Drop it and let the unprinted fallback take over, matching Hero and Dashboard.
  const printable = Boolean(url) && !blank;

  return (
    <span
      className={clsx(
        'component-world-thumbnail',
        config.className,
        plate && 'plate-inked',
        className
      )}
      style={plateInkStyle(plate)}
      data-plate={pending ? 'pending' : undefined}
      aria-hidden="true"
    >
      {printable && url ? (
        <Image
          src={plate?.source ?? url}
          alt=""
          width={config.px}
          height={config.px}
          unoptimized
        />
      ) : size === 'lg' ? (
        <span className="world-card-plate-initial">
          {initialOf(name)}
        </span>
      ) : (
        <Globe />
      )}
    </span>
  );
}
