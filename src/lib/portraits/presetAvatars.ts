/**
 * Preset avatar library.
 *
 * Every avatar is drawn here as an inline SVG data URI rather than shipped as a
 * binary asset: there is no third-party licensing to track, nothing to write to
 * disk (Vercel's image disk is ephemeral), and the whole set costs a few KB.
 */

export type PresetAvatarCategory =
  | 'fantasy'
  | 'modern'
  | 'sci-fi'
  | 'western'
  | 'horror'
  | 'abstract';

export interface PresetAvatar {
  id: string;
  name: string;
  category: PresetAvatarCategory;
  keywords: string[];
  url: string;
}

export const PRESET_AVATAR_CATEGORIES: Array<{
  id: PresetAvatarCategory;
  label: string;
}> = [
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'modern', label: 'Modern' },
  { id: 'sci-fi', label: 'Sci-fi' },
  { id: 'western', label: 'Western' },
  { id: 'horror', label: 'Horror' },
  { id: 'abstract', label: 'Abstract' },
];

interface AvatarPalette {
  wash: string;
  ink: string;
  accent: string;
}

/**
 * Colors are literal here because an SVG loaded through a data URI is an
 * isolated document — it can't read the page's CSS custom properties, so a
 * var(--token) reference would resolve to nothing. These values track the DS3
 * parchment-and-ink palette by hand.
 */
/* eslint-disable design-tokens/no-hardcoded-colors */
const PALETTES: AvatarPalette[] = [
  { wash: '#efe9dd', ink: '#2f2a24', accent: '#c2b49a' },
  { wash: '#e6e2d7', ink: '#3a332a', accent: '#a3b0a1' },
  { wash: '#f2ece0', ink: '#28323a', accent: '#9db0bd' },
  { wash: '#eae4d8', ink: '#3c2f2f', accent: '#c99f88' },
  { wash: '#e9e6df', ink: '#2b2b33', accent: '#aea4c0' },
  { wash: '#f0ebe1', ink: '#33382b', accent: '#b3bd9a' },
];
/* eslint-enable design-tokens/no-hardcoded-colors */

type OrnamentBuilder = (palette: AvatarPalette) => string;

const CORNER_MARKS = (ink: string) =>
  `<path d="M10 20V10h10M76 10h10v10M86 76v10h-10M20 86H10v-10" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linecap="square" opacity=".55"/>`;

const HEAD = (accent: string, ink: string) =>
  `<circle cx="48" cy="40" r="15" fill="${accent}" stroke="${ink}" stroke-width="1.5"/>`;

const SHOULDERS = (ink: string) =>
  `<path d="M23 86c0-14 11-23 25-23s25 9 25 23z" fill="${ink}"/>`;

const ORNAMENTS: Record<string, OrnamentBuilder> = {
  hood: ({ ink }) =>
    `<path d="M30 40c0-13 8-21 18-21s18 8 18 21c-4-8-10-12-18-12s-14 4-18 12z" fill="${ink}"/>`,
  crown: ({ ink }) =>
    `<path d="M33 27l5-11 10 8 10-8 5 11z" fill="${ink}"/>`,
  horns: ({ ink }) =>
    `<path d="M34 29c-6-3-9-8-9-14 6 1 11 5 13 11zM62 29c6-3 9-8 9-14-6 1-11 5-13 11z" fill="${ink}"/>`,
  circlet: ({ ink }) =>
    `<path d="M34 31h28M48 22l4 9h-8z" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
  lute: ({ ink }) =>
    `<path d="M64 66c6 0 10 4 10 9s-4 9-10 9-10-4-10-9 4-9 10-9zM70 66l6-14" fill="none" stroke="${ink}" stroke-width="2.5"/>`,
  collar: ({ wash }) =>
    `<path d="M39 65l9 13 9-13" fill="none" stroke="${wash}" stroke-width="3.5" stroke-linejoin="round"/>`,
  glasses: ({ ink }) =>
    `<path d="M36 40h8v6h-8zM52 40h8v6h-8zM44 43h8M30 40h6M60 40h6" fill="none" stroke="${ink}" stroke-width="1.8"/>`,
  cap: ({ ink }) =>
    `<path d="M31 32c0-10 8-16 17-16s17 6 17 16zM65 32l12 3-12 4z" fill="${ink}"/>`,
  cross: ({ wash }) =>
    `<path d="M48 66v14M41 73h14" fill="none" stroke="${wash}" stroke-width="3.5"/>`,
  scarf: ({ accent, ink }) =>
    `<path d="M33 62h30l-4 8H37z" fill="${accent}" stroke="${ink}" stroke-width="1.2"/>`,
  visor: ({ ink }) =>
    `<rect x="32" y="36" width="32" height="8" rx="4" fill="${ink}"/>`,
  antenna: ({ ink }) =>
    `<path d="M48 25V13M44 11h8" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`,
  circuit: ({ wash }) =>
    `<path d="M36 70h10v8h14M36 78h6" fill="none" stroke="${wash}" stroke-width="2.2"/>`,
  helm: ({ ink }) =>
    `<path d="M30 40a18 18 0 0 1 36 0h-8a10 10 0 0 0-20 0z" fill="${ink}"/>`,
  orbit: ({ ink }) =>
    `<ellipse cx="48" cy="40" rx="24" ry="9" fill="none" stroke="${ink}" stroke-width="1.8" opacity=".7"/>`,
  brim: ({ ink }) =>
    `<path d="M24 32h48" stroke="${ink}" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M37 32c0-9 5-13 11-13s11 4 11 13z" fill="${ink}"/>`,
  bandana: ({ accent, ink }) =>
    `<path d="M34 44h28l-14 12z" fill="${accent}" stroke="${ink}" stroke-width="1.2"/>`,
  star: ({ wash }) =>
    `<path d="M48 64l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="${wash}"/>`,
  pick: ({ ink }) =>
    `<path d="M62 82L78 62M72 58l8 8" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`,
  shroud: ({ ink }) =>
    `<path d="M48 20a18 18 0 0 0-18 18c0 5 3 8 3 8h30s3-3 3-8a18 18 0 0 0-18-18z" fill="${ink}"/><path d="M41 39h4M51 39h4" stroke="${ink}" stroke-width="2.5" opacity=".4" fill="none"/>`,
  lantern: ({ accent, ink }) =>
    `<rect x="66" y="60" width="14" height="16" rx="2" fill="${accent}" stroke="${ink}" stroke-width="1.5"/><path d="M73 60v-8" stroke="${ink}" stroke-width="1.8" fill="none"/>`,
  sigil: ({ ink }) =>
    `<path d="M48 24l18 32H30z" fill="none" stroke="${ink}" stroke-width="2"/><circle cx="48" cy="46" r="4" fill="${ink}"/>`,
};

const ABSTRACT_MARKS: Record<string, OrnamentBuilder> = {
  rings: ({ ink, accent }) =>
    `<circle cx="48" cy="48" r="26" fill="none" stroke="${ink}" stroke-width="2"/><circle cx="48" cy="48" r="16" fill="${accent}"/><circle cx="48" cy="48" r="6" fill="${ink}"/>`,
  lattice: ({ ink, accent }) =>
    `<rect x="26" y="26" width="44" height="44" fill="${accent}" stroke="${ink}" stroke-width="2"/><path d="M26 48h44M48 26v44" stroke="${ink}" stroke-width="2" fill="none"/>`,
  compass: ({ ink, accent }) =>
    `<path d="M48 22l8 26 26 0-26 8-8 26-8-26-26-8 26 0z" fill="${accent}" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>`,
  waypoint: ({ ink, accent }) =>
    `<path d="M48 24l22 38H26z" fill="${accent}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/><path d="M34 74h28" stroke="${ink}" stroke-width="2.5" fill="none"/>`,
};

function toDataUri(body: string, palette: AvatarPalette): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">` +
    `<rect width="96" height="96" fill="${palette.wash}"/>` +
    CORNER_MARKS(palette.ink) +
    body +
    `</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function bustAvatar(palette: AvatarPalette, ornamentKeys: string[]): string {
  const beforeHead = ornamentKeys
    .filter((key) => key === 'orbit')
    .map((key) => ORNAMENTS[key](palette))
    .join('');
  const afterHead = ornamentKeys
    .filter((key) => key !== 'orbit')
    .map((key) => ORNAMENTS[key](palette))
    .join('');

  return toDataUri(
    beforeHead +
      HEAD(palette.accent, palette.ink) +
      SHOULDERS(palette.ink) +
      afterHead,
    palette
  );
}

interface AvatarSeed {
  id: string;
  name: string;
  category: PresetAvatarCategory;
  keywords: string[];
  ornaments: string[];
}

const SEEDS: AvatarSeed[] = [
  // Fantasy
  { id: 'fantasy-ranger', name: 'Ranger', category: 'fantasy', keywords: ['hood', 'scout', 'archer'], ornaments: ['hood'] },
  { id: 'fantasy-monarch', name: 'Monarch', category: 'fantasy', keywords: ['crown', 'royal', 'noble'], ornaments: ['crown'] },
  { id: 'fantasy-horned', name: 'Horned One', category: 'fantasy', keywords: ['beast', 'demon', 'tiefling'], ornaments: ['horns'] },
  { id: 'fantasy-oracle', name: 'Oracle', category: 'fantasy', keywords: ['circlet', 'seer', 'mystic'], ornaments: ['circlet'] },
  { id: 'fantasy-bard', name: 'Bard', category: 'fantasy', keywords: ['lute', 'minstrel', 'music'], ornaments: ['lute'] },
  { id: 'fantasy-knight', name: 'Knight', category: 'fantasy', keywords: ['helm', 'armor', 'warrior'], ornaments: ['helm'] },

  // Modern
  { id: 'modern-executive', name: 'Executive', category: 'modern', keywords: ['suit', 'collar', 'office'], ornaments: ['collar'] },
  { id: 'modern-scholar', name: 'Scholar', category: 'modern', keywords: ['glasses', 'academic', 'researcher'], ornaments: ['glasses'] },
  { id: 'modern-courier', name: 'Courier', category: 'modern', keywords: ['cap', 'runner', 'delivery'], ornaments: ['cap'] },
  { id: 'modern-medic', name: 'Medic', category: 'modern', keywords: ['doctor', 'nurse', 'first aid'], ornaments: ['cross'] },
  { id: 'modern-traveller', name: 'Traveller', category: 'modern', keywords: ['scarf', 'nomad', 'wanderer'], ornaments: ['scarf'] },

  // Sci-fi
  { id: 'scifi-pilot', name: 'Pilot', category: 'sci-fi', keywords: ['visor', 'flight', 'ace'], ornaments: ['visor'] },
  { id: 'scifi-synth', name: 'Synth', category: 'sci-fi', keywords: ['android', 'robot', 'antenna'], ornaments: ['antenna'] },
  { id: 'scifi-engineer', name: 'Engineer', category: 'sci-fi', keywords: ['circuit', 'tech', 'mechanic'], ornaments: ['circuit'] },
  { id: 'scifi-navigator', name: 'Navigator', category: 'sci-fi', keywords: ['orbit', 'astro', 'starfarer'], ornaments: ['orbit'] },
  { id: 'scifi-trooper', name: 'Trooper', category: 'sci-fi', keywords: ['helm', 'marine', 'soldier'], ornaments: ['helm', 'circuit'] },

  // Western
  { id: 'western-marshal', name: 'Marshal', category: 'western', keywords: ['sheriff', 'star', 'law'], ornaments: ['brim', 'star'] },
  { id: 'western-drifter', name: 'Drifter', category: 'western', keywords: ['hat', 'outlaw', 'gunslinger'], ornaments: ['brim'] },
  { id: 'western-bandit', name: 'Bandit', category: 'western', keywords: ['bandana', 'robber', 'masked'], ornaments: ['bandana'] },
  { id: 'western-prospector', name: 'Prospector', category: 'western', keywords: ['miner', 'pick', 'gold'], ornaments: ['brim', 'pick'] },

  // Horror
  { id: 'horror-shrouded', name: 'Shrouded Figure', category: 'horror', keywords: ['ghost', 'wraith', 'shroud'], ornaments: ['shroud'] },
  { id: 'horror-investigator', name: 'Investigator', category: 'horror', keywords: ['lantern', 'detective', 'night'], ornaments: ['cap', 'lantern'] },
  { id: 'horror-occultist', name: 'Occultist', category: 'horror', keywords: ['sigil', 'cult', 'ritual'], ornaments: ['sigil'] },

  // Abstract
  { id: 'abstract-rings', name: 'Rings', category: 'abstract', keywords: ['circles', 'geometric', 'symbol'], ornaments: ['rings'] },
  { id: 'abstract-lattice', name: 'Lattice', category: 'abstract', keywords: ['grid', 'geometric', 'square'], ornaments: ['lattice'] },
  { id: 'abstract-compass', name: 'Compass', category: 'abstract', keywords: ['star', 'direction', 'geometric'], ornaments: ['compass'] },
  { id: 'abstract-waypoint', name: 'Waypoint', category: 'abstract', keywords: ['marker', 'triangle', 'geometric'], ornaments: ['waypoint'] },
];

export const PRESET_AVATARS: PresetAvatar[] = SEEDS.map((seed, index) => {
  const palette = PALETTES[index % PALETTES.length];
  const isAbstract = seed.category === 'abstract';

  return {
    id: seed.id,
    name: seed.name,
    category: seed.category,
    keywords: seed.keywords,
    url: isAbstract
      ? toDataUri(ABSTRACT_MARKS[seed.ornaments[0]](palette), palette)
      : bustAvatar(palette, seed.ornaments),
  };
});

export function searchPresetAvatars(
  query: string,
  category: PresetAvatarCategory | 'all'
): PresetAvatar[] {
  const term = query.trim().toLowerCase();

  return PRESET_AVATARS.filter((avatar) => {
    if (category !== 'all' && avatar.category !== category) return false;
    if (!term) return true;

    return (
      avatar.name.toLowerCase().includes(term) ||
      avatar.category.toLowerCase().includes(term) ||
      avatar.keywords.some((keyword) => keyword.toLowerCase().includes(term))
    );
  });
}
