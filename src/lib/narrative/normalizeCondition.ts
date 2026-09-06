// src/lib/narrative/normalizeCondition.ts

interface BodyPartDef {
  part: string;
  region: 'lower_limb' | 'upper_limb' | 'head_neck' | 'torso';
  isGeneralRegion?: boolean;
  patterns: RegExp[];
}

const BODY_PARTS: BodyPartDef[] = [
  // Lower limb
  { part: 'ankle', region: 'lower_limb', patterns: [/\bankles?\b/i] },
  { part: 'foot', region: 'lower_limb', patterns: [/\b(?:feet|foot|heels?|toes?)\b/i] },
  { part: 'knee', region: 'lower_limb', patterns: [/\b(?:knees?|kneecaps?)\b/i] },
  { part: 'thigh', region: 'lower_limb', patterns: [/\b(?:thighs?|hamstrings?)\b/i] },
  { part: 'shin_calf', region: 'lower_limb', patterns: [/\b(?:shins?|cal(?:f|ves))\b/i] },
  { part: 'hip', region: 'lower_limb', patterns: [/\b(?:hips?|pelvis|groin)\b/i] },
  { part: 'leg', region: 'lower_limb', isGeneralRegion: true, patterns: [/\b(?:legs?|lower\s+limbs?)\b/i] },

  // Upper limb
  { part: 'wrist', region: 'upper_limb', patterns: [/\bwrists?\b/i] },
  { part: 'hand', region: 'upper_limb', patterns: [/\b(?:hands?|palms?|fingers?|thumbs?)\b/i] },
  { part: 'forearm', region: 'upper_limb', patterns: [/\bforearms?\b/i] },
  { part: 'elbow', region: 'upper_limb', patterns: [/\belbows?\b/i] },
  { part: 'shoulder', region: 'upper_limb', patterns: [/\bshoulders?\b/i] },
  { part: 'arm', region: 'upper_limb', isGeneralRegion: true, patterns: [/\b(?:arms?|biceps?|upper\s+limbs?)\b/i] },

  // General limb
  { part: 'limb', region: 'lower_limb', isGeneralRegion: true, patterns: [/\blimbs?\b/i] },

  // Head & Neck
  { part: 'eye', region: 'head_neck', patterns: [/\beyes?\b/i] },
  { part: 'ear', region: 'head_neck', patterns: [/\bears?\b/i] },
  { part: 'nose', region: 'head_neck', patterns: [/\bnoses?\b/i] },
  { part: 'jaw', region: 'head_neck', patterns: [/\b(?:jaws?|chin|teeth|tooth|mouth|lips?)\b/i] },
  { part: 'neck', region: 'head_neck', patterns: [/\b(?:necks?|throats?)\b/i] },
  { part: 'head', region: 'head_neck', isGeneralRegion: true, patterns: [/\b(?:heads?|skulls?|scalp|foreheads?|brows?|temples?|faces?)\b/i] },

  // Torso
  { part: 'ribs', region: 'torso', patterns: [/\bribs?\b/i] },
  { part: 'chest', region: 'torso', patterns: [/\b(?:chest|sternum)\b/i] },
  { part: 'abdomen', region: 'torso', patterns: [/\b(?:abdomen|stomach|belly|gut)\b/i] },
  { part: 'back', region: 'torso', patterns: [/\b(?:back|spine|vertebrae|lumbar)\b/i] },
  { part: 'flank', region: 'torso', patterns: [/\b(?:flanks?|sides?)\b/i] },
  { part: 'torso', region: 'torso', isGeneralRegion: true, patterns: [/\btorso\b/i] },
];

const STATUS_CATEGORIES: Array<{ category: string; pattern: RegExp }> = [
  { category: 'shaken', pattern: /\b(?:shaken|trembling|tremor|terrified|frightened|panick?(?:ed|ing)?|fear|dread|spooked|rattled)\b/i },
  { category: 'exhausted', pattern: /\b(?:exhaust(?:ed|ion)|wear(?:y|iness)|fatigue[d]?|tired|drained|spent|collapse)\b/i },
  { category: 'dazed', pattern: /\b(?:dazed|stunned|disorient(?:ed|ation)|dizz(?:y|iness)|lightheaded|concuss(?:ed|ion)|groggy)\b/i },
  { category: 'hoarse', pattern: /\b(?:hoarse(?:ness)?|rasping|voiceless|raspy)\b/i },
  { category: 'poisoned', pattern: /\b(?:poison(?:ed)?|venom(?:ed|ous)?|toxic(?:ity)?|nausea(?:ted)?|fever(?:ish)?)\b/i },
  { category: 'blinded', pattern: /\b(?:blind(?:ed|ing)?|loss of sight)\b/i },
  { category: 'deafened', pattern: /\b(?:deafen(?:ed)?|ringing ears|loss of hearing)\b/i },
  { category: 'discredited', pattern: /\b(?:discredit(?:ed)?|disgrace[d]?|shame[d]?|dishonor(?:ed)?|humiliat(?:ed|ion))\b/i },
  { category: 'wanted', pattern: /\b(?:wanted|hunted|fugitive|pursued|outlawed)\b/i },
  { category: 'restrained', pattern: /\b(?:restrain(?:ed)?|bound|tied|trapped|pinned)\b/i },
];

const SENSATION_PREFIXES: RegExp[] = [
  /^(?:a\s+|an\s+)?(?:fresh\s+|sudden\s+|sharp\s+|dull\s+|throbbing\s+|searing\s+|blinding\s+|stabbing\s+|intense\s+|persistent\s+|lingering\s+)*(?:wave|waves|spasm|spasms|jolt|jolts|pang|pangs|flash|flashes|bout|bouts|surge|surges|fit|fits)\s+of\s+(?:(?:sharp|dull|throbbing|searing|blinding|stabbing|intense)\s+)?(?:pain|agony|discomfort|ache|aches)\s+(?:through(?:out)?|in|into|down|across|from)\s+/i,
  /^(?:a\s+|an\s+)?(?:fresh\s+|sudden\s+|sharp\s+|dull\s+|throbbing\s+|searing\s+|blinding\s+|stabbing\s+|intense\s+|constant\s+|lingering\s+|persistent\s+)+(?:pain|agony|discomfort|ache|aches|throbbing)\s+(?:through(?:out)?|in|into|down|across|from)\s+/i,
  /^(?:a\s+|an\s+)?(?:feeling|sensation|wave|waves|bout|bouts|state|sense)\s+of\s+/i,
  /^(?:the|a|an)\s+/i,
];

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'over', 'after', 'before', 'between',
  'through', 'during', 'without', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now',
  'fresh', 'wave', 'waves', 'pain', 'pains', 'ache', 'aching', 'sharp', 'dull',
]);

const INJURY_TYPES: Array<{ type: string; pattern: RegExp }> = [
  { type: 'burn', pattern: /\b(?:burned?|burns?|scal(?:d|ded|ding)|scorched?|charred?)\b/i },
  { type: 'fracture', pattern: /\b(?:fractur(?:ed?|es?)|broken|breaks?|shattered?|crushed?)\b/i },
  { type: 'laceration', pattern: /\b(?:gash(?:ed?|es?)?|cut[s]?|slash(?:ed?|es?)?|lacerat(?:ed?|ions?)?|bleeding|wound(?:ed|s)?)\b/i },
  { type: 'sprain', pattern: /\b(?:sprain(?:ed?|s?)?|twist(?:ed?|s?)?|strain(?:ed?|s?)?|wrenched?)\b/i },
  { type: 'frostbite', pattern: /\b(?:frostbit(?:e|ten)|froz(?:e|en))\b/i },
];

interface ParsedCondition {
  normalized: string;
  laterality?: 'left' | 'right' | 'bilateral';
  region?: 'lower_limb' | 'upper_limb' | 'head_neck' | 'torso';
  bodyPart?: string;
  isGeneralRegion?: boolean;
  injuryType?: string;
  statusCategory?: string;
  tokens: Set<string>;
}

/**
 * Normalizes free-form condition prose into a clean, stable player-readable label.
 * Strips sensation wrappers and narrative filler so restatements don't bloat stored state.
 */
export function normalizeConditionLabel(raw: string): string {
  let text = raw.trim().toLowerCase().replace(/[.,!;]+$/, '').trim();

  for (const prefix of SENSATION_PREFIXES) {
    if (prefix.test(text)) {
      text = text.replace(prefix, '').trim();
    }
  }

  return text.replace(/\s+/g, ' ').trim();
}

function parseCondition(raw: string, normalized: string): ParsedCondition {
  let laterality: 'left' | 'right' | 'bilateral' | undefined;
  if (/\b(?:both|bilateral)\b/i.test(raw)) {
    laterality = 'bilateral';
  } else if (/\bleft\b/i.test(raw)) {
    laterality = 'left';
  } else if (/\bright\b/i.test(raw)) {
    laterality = 'right';
  }

  let region: 'lower_limb' | 'upper_limb' | 'head_neck' | 'torso' | undefined;
  let bodyPart: string | undefined;
  let isGeneralRegion = false;

  for (const bp of BODY_PARTS) {
    if (bp.patterns.some((pattern) => pattern.test(raw))) {
      bodyPart = bp.part;
      region = bp.region;
      isGeneralRegion = Boolean(bp.isGeneralRegion);
      break;
    }
  }

  let injuryType: string | undefined;
  for (const it of INJURY_TYPES) {
    if (it.pattern.test(raw)) {
      injuryType = it.type;
      break;
    }
  }

  let statusCategory: string | undefined;
  for (const sc of STATUS_CATEGORIES) {
    if (sc.pattern.test(raw)) {
      statusCategory = sc.category;
      break;
    }
  }

  const words = normalized.match(/[a-z0-9]+/g) ?? [];
  const tokens = new Set(words.filter((w) => w.length > 2 && !STOP_WORDS.has(w)));

  return {
    normalized,
    laterality,
    region,
    bodyPart,
    isGeneralRegion,
    injuryType,
    statusCategory,
    tokens,
  };
}

/**
 * Checks if two condition strings refer to the same underlying harm,
 * allowing evolving descriptions to update/replace existing state.
 */
export function isSameCondition(a: string, b: string): boolean {
  const normA = normalizeConditionLabel(a);
  const normB = normalizeConditionLabel(b);

  if (normA === normB) {
    return true;
  }

  const parsedA = parseCondition(a, normA);
  const parsedB = parseCondition(b, normB);

  // If explicit lateralities differ (e.g. blinded left eye vs blinded right eye),
  // they cannot be the same condition regardless of status or body part.
  if (parsedA.laterality && parsedB.laterality && parsedA.laterality !== parsedB.laterality) {
    return false;
  }

  // Physical injury comparison
  if (parsedA.region && parsedB.region) {
    if (parsedA.region !== parsedB.region) {
      return false;
    }

    // If both have different explicit injury types on the same body part
    // (e.g. "burned left hand" vs "broken left hand"), they are separate injuries.
    if (parsedA.injuryType && parsedB.injuryType && parsedA.injuryType !== parsedB.injuryType) {
      return false;
    }

    if (parsedA.bodyPart && parsedB.bodyPart && parsedA.bodyPart === parsedB.bodyPart) {
      return true;
    }

    if (parsedA.isGeneralRegion || parsedB.isGeneralRegion) {
      return true;
    }

    return false;
  }

  // Status/emotional states (e.g. "shaken" vs "badly shaken")
  if (parsedA.statusCategory && parsedB.statusCategory) {
    return parsedA.statusCategory === parsedB.statusCategory;
  }

  // Direct elaboration containment for non-physical states (e.g. "shaken by explosions" vs "shaken by explosions again")
  if (
    normA.startsWith(normB + ' ') ||
    normB.startsWith(normA + ' ') ||
    normA.endsWith(' ' + normB) ||
    normB.endsWith(' ' + normA)
  ) {
    return true;
  }

  return false;
}
