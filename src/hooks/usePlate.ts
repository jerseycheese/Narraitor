'use client';

import { useEffect, useState } from 'react';

import { toPlate, type Plate, type PlateBox } from '@/lib/plates/plate';

/**
 * Plates are derived, not stored.
 *
 * World art lives in IndexedDB as a base64 data URL, so keeping a plate beside
 * it would mean a second blob per image, forever, on a product whose whole data
 * model is browser-local. Deriving on demand also means worlds created before
 * the ink register existed get plates with no backfill.
 *
 * The cache is per session and keyed by art and display size, so each plate is
 * rendered once however many surfaces ask for it.
 */
const cache = new Map<string, Plate | null>();

function cacheKey(source: string, { width, height, dpr = 2 }: PlateBox): string {
  return `${width}x${height}@${dpr}|${source}`;
}

/**
 * Renders the ink-register plate for a piece of world art.
 *
 * Callers fall back to the art itself when `plate` is null, so a server render,
 * a failed decode, or a browser with no canvas degrades to the untreated image
 * rather than to a gap.
 *
 * @param source - The art, as a URL or data URL.
 * @param box - Where the plate will be displayed.
 * @returns The plate, or null while it renders or when none could be made.
 */
export function usePlate(
  source: string | undefined,
  box: PlateBox
): Plate | null {
  const { width, height, dpr = 2 } = box;
  const key = source ? cacheKey(source, { width, height, dpr }) : null;

  const [plate, setPlate] = useState<Plate | null>(() =>
    key ? cache.get(key) ?? null : null
  );

  useEffect(() => {
    if (!key || !source) {
      setPlate(null);
      return;
    }

    if (cache.has(key)) {
      setPlate(cache.get(key) ?? null);
      return;
    }

    let active = true;

    toPlate(source, { width, height, dpr })
      .then((result) => {
        cache.set(key, result);
        if (!active) return;
        setPlate(result);
      })
      .catch(() => {
        // A plate is an enhancement; failing to make one must not break the
        // surface that asked for it.
        cache.set(key, null);
        if (!active) return;
        setPlate(null);
      });

    return () => {
      active = false;
    };
  }, [key, source, width, height, dpr]);

  return plate;
}
