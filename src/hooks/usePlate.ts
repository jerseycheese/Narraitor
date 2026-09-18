'use client';

import { useEffect, useState, type CSSProperties } from 'react';

import { toPlate, type Plate, type PlateBox } from '@/lib/plates/plate';

/**
 * Plates are derived, not stored.
 *
 * World art lives in IndexedDB as a base64 data URL, so keeping a plate beside
 * it would mean a second blob per image, forever, on a product whose whole data
 * model is browser-local. Deriving on demand also means worlds created before
 * the ink treatment existed get plates with no backfill.
 *
 * The cache is per session and keyed by art and display size, so each plate is
 * rendered once however many surfaces ask for it.
 */
const cache = new Map<string, Plate | null>();

function cacheKey(source: string, { width, height, dpr = 2 }: PlateBox): string {
  return `${width}x${height}@${dpr}|${source}`;
}

interface Settled {
  key: string;
  source: string;
  plate: Plate | null;
}

export interface PlateState {
  /** The plate, or null when there is none (yet, or at all). */
  plate: Plate | null;
  /** True while a plate for the current art and size is still being made. */
  pending: boolean;
}

/**
 * Renders the ink-treatment plate for a piece of world art.
 *
 * Callers fall back to the art itself when `plate` is null, so a server render,
 * a failed decode, or a browser with no canvas degrades to the untreated image
 * rather than to a gap. On a resize the previous plate for the same art keeps
 * showing until the new one lands, so the surface never flashes back to colour.
 *
 * @param source - The art, as a URL or data URL.
 * @param box - Where the plate will be displayed. A zero size means not yet
 * measured, and counts as pending.
 */
export function usePlate(source: string | undefined, box: PlateBox): PlateState {
  const { width, height, dpr = 2 } = box;
  const measured = width > 0 && height > 0;
  const key = source && measured ? cacheKey(source, { width, height, dpr }) : null;

  const [settled, setSettled] = useState<Settled | null>(() =>
    key && source && cache.has(key)
      ? { key, source, plate: cache.get(key) ?? null }
      : null
  );

  useEffect(() => {
    if (!key || !source) return;

    if (cache.has(key)) {
      setSettled({ key, source, plate: cache.get(key) ?? null });
      return;
    }

    let active = true;

    toPlate(source, { width, height, dpr })
      .then((result) => {
        cache.set(key, result);
        if (!active) return;
        setSettled({ key, source, plate: result });
      })
      .catch(() => {
        // A plate is an enhancement; failing to make one must not break the
        // surface that asked for it.
        cache.set(key, null);
        if (!active) return;
        setSettled({ key, source, plate: null });
      });

    return () => {
      active = false;
    };
  }, [key, source, width, height, dpr]);

  return {
    plate: source && settled?.source === source ? settled.plate : null,
    pending: Boolean(source) && settled?.key !== key,
  };
}

/**
 * The per-world ink custom properties for a plate's frame.
 *
 * @returns Inline style carrying `--plate-ink` and `--plate-ink-dark`, or
 * undefined when the art has no usable hue and the theme's own ink applies.
 */
export function plateInkStyle(plate: Plate | null): CSSProperties | undefined {
  if (!plate?.ink) return undefined;

  return {
    '--plate-ink': plate.ink.light,
    '--plate-ink-dark': plate.ink.dark,
  } as CSSProperties;
}
