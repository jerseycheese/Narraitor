'use client';

import { useEffect, useState, type CSSProperties } from 'react';

import { toPlate, type Plate, type PlateBox } from '@/lib/plates/plate';

type PlateResult = Plate | 'blank' | null;

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
interface CacheEntry {
  source: string;
  result: PlateResult;
}

const MAX_CACHE_ENTRIES = 30;
const cache = new Map<string, CacheEntry>();

function getCached(key: string, source: string): PlateResult | undefined {
  const entry = cache.get(key);
  if (!entry || entry.source !== source) return undefined;
  cache.delete(key);
  cache.set(key, entry);
  return entry.result;
}

function setCached(key: string, source: string, value: PlateResult): void {
  if (cache.has(key)) {
    cache.delete(key);
  } else if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  cache.set(key, { source, result: value });
}

function hashSource(source: string): string {
  if (source.length <= 128) return source;

  let hash = 0x811c9dc5;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `h${(hash >>> 0).toString(36)}_${source.length}`;
}

function cacheKey(source: string, { width, height, dpr = 2 }: PlateBox): string {
  return `${width}x${height}@${dpr}|${hashSource(source)}`;
}

interface Settled {
  key: string;
  source: string;
  result: PlateResult;
}

export interface PlateState {
  /** The plate, or null when there is none (yet, or at all). */
  plate: Plate | null;
  /** True while a plate for the current art and size is still being made. */
  pending: boolean;
  /** True when the art carries no tonal range, so there is nothing to show. */
  blank: boolean;
}

/**
 * Renders the ink-treatment plate for a piece of world art.
 *
 * Callers fall back to the art itself when `plate` is null, so a server render,
 * a failed decode, or a browser with no canvas degrades to the untreated image
 * rather than to a gap. Flat art reports `blank` instead, so callers can show
 * their empty state rather than a solid slab. On a resize the previous plate for the same art keeps
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

  const [settled, setSettled] = useState<Settled | null>(() => {
    if (!key || !source) return null;
    const cached = getCached(key, source);
    return cached !== undefined ? { key, source, result: cached } : null;
  });

  useEffect(() => {
    if (!key || !source) return;

    const cached = getCached(key, source);
    if (cached !== undefined) {
      setSettled({ key, source, result: cached });
      return;
    }

    let active = true;

    toPlate(source, { width, height, dpr })
      .then((result) => {
        setCached(key, source, result);
        if (!active) return;
        setSettled({ key, source, result });
      })
      .catch(() => {
        // A plate is an enhancement; failing to make one must not break the
        // surface that asked for it.
        setCached(key, source, null);
        if (!active) return;
        setSettled({ key, source, result: null });
      });

    return () => {
      active = false;
    };
  }, [key, source, width, height, dpr]);

  const result = source && settled?.source === source ? settled.result : null;

  return {
    plate: result === 'blank' ? null : result,
    pending: Boolean(source) && settled?.key !== key,
    blank: result === 'blank',
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
