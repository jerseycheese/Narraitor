/**
 * Player Sheet Guard
 *
 * The player character's family and past belong to the character sheet. When
 * the prose has an NPC name the player's grandmother, or recall something the
 * player once did, the lore extractor would record it and the ledger would
 * carry it into every later prompt as canon, so the invented name outlives the
 * turn that made it up. This module decides, without an AI call, which
 * extracted entries make that kind of claim and whether the game already
 * vouches for the name.
 *
 * Like `loreContext.ts`, it takes data as parameters and imports no stores.
 */

import type { StructuredLoreExtraction } from '../../types/lore.types';
import { escapeRegExp } from '../utils';

/** Shortest name token worth vouching for as a whole word. */
const MIN_NAME_TOKEN_LENGTH = 3;

const KIN_WORDS = [
  'grandmother', 'grandfather', 'grandparent', 'grandparents', 'grandma', 'grandpa',
  'mother', 'father', 'mom', 'mum', 'dad', 'parent', 'parents',
  'sister', 'brother', 'sibling', 'siblings', 'cousin', 'cousins',
  'aunt', 'uncle', 'niece', 'nephew',
  'wife', 'husband', 'spouse', 'daughter', 'son', 'child', 'children', 'kids',
  'family', 'kin',
];
const KIN = `(?:${KIN_WORDS.join('|')})`;

// How the extractor refers to the player when it is not using the name.
const PLAYER_STANDINS = [
  'the protagonist',
  'protagonist',
  'the player character',
  'player character',
  'the player',
  'player',
];

// Words that sit inside a name without being one: honorifics, descriptors,
// and the kinship terms themselves ("Aunt Carol", "Old Man Rowan").
const NAME_NOISE = new Set([
  'the', 'old', 'young', 'little', 'big', 'man', 'woman',
  'mr', 'mrs', 'ms', 'miss', 'dr', 'sir', 'lady', 'lord', 'madam',
  ...KIN_WORDS,
]);

export interface PlayerSheetCanon {
  /** The sheet's own words, shown to the extraction model: history and personality. */
  sheet: string;
  /** Everything that can vouch for a name: the whole sheet, the world description, the NPC roster. */
  canon: string;
}

export interface PlayerSheetGuardResult {
  extraction: StructuredLoreExtraction;
  /** The entries that went, for the debug log. */
  dropped: string[];
}

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    if (value.trim()) out.push(value.trim());
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, out));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, out));
  }
}

/**
 * The sheet as the model sees it and as the guard vouches with it. Undefined
 * when the sheet has no history or personality text, which turns the guard off:
 * a blank sheet owns nothing.
 *
 * Shows the same two fields the scene prompt shows (`formatPlayerBackground`
 * in sceneTemplate.ts), so the extractor and the narrator read one sheet.
 */
export function buildPlayerSheetCanon(args: {
  background?: unknown;
  worldDescription?: string;
  knownNames?: string[];
}): PlayerSheetCanon | undefined {
  const { background, worldDescription, knownNames } = args;
  const sheetLines: string[] = [];

  if (typeof background === 'string') {
    if (background.trim()) sheetLines.push(background.trim());
  } else if (background && typeof background === 'object') {
    const { history, personality } = background as { history?: unknown; personality?: unknown };
    if (typeof history === 'string' && history.trim()) {
      sheetLines.push(`History: ${history.trim()}`);
    }
    if (typeof personality === 'string' && personality.trim()) {
      sheetLines.push(`Personality: ${personality.trim()}`);
    }
  }
  if (sheetLines.length === 0) return undefined;

  const canon: string[] = [];
  collectStrings(background, canon);
  if (worldDescription?.trim()) canon.push(worldDescription.trim());
  canon.push(...(knownNames ?? []).filter((name) => name?.trim()));

  return { sheet: sheetLines.join('\n'), canon: canon.join('\n') };
}

function playerReferences(playerName?: string): string[] {
  const refs = [...PLAYER_STANDINS];
  const name = playerName?.trim() ?? '';
  if (name.length >= MIN_NAME_TOKEN_LENGTH) refs.push(name);
  const first = name.split(/\s+/)[0] ?? '';
  if (first !== name && first.length >= MIN_NAME_TOKEN_LENGTH) refs.push(first);
  return refs.map(escapeRegExp);
}

/**
 * True when the text ties a relative to the player: "Wren's grandmother",
 * "the protagonist's mother", "your aunt", "grandfather of Wren". Other
 * people's relatives and the player's own actions do not match, which is what
 * keeps real on-screen facts ("Aunt Carol disapproves of Wren's actions") out
 * of the guard's way.
 */
export function claimsPlayerKin(text: string, playerName?: string): boolean {
  const ref = `(?:${playerReferences(playerName).join('|')})`;
  const possessive = new RegExp(`\\b(?:${ref}['’]s?|your)\\s+(?:\\w+\\s+)?${KIN}\\b`, 'i');
  const ofForm = new RegExp(`\\b${KIN}\\s+(?:of|to)\\s+(?:the\\s+)?${ref}\\b`, 'i');
  return possessive.test(text) || ofForm.test(text);
}

function nameTokens(name: string, playerName: string): string[] {
  const playerTokens = new Set(playerName.toLowerCase().split(/\s+/));
  return name
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter(
      (token) =>
        token.length >= MIN_NAME_TOKEN_LENGTH &&
        !NAME_NOISE.has(token) &&
        !playerTokens.has(token)
    );
}

function vouchedFor(token: string, canon: string): boolean {
  return new RegExp(`\\b${escapeRegExp(token)}\\b`, 'i').test(canon);
}

/**
 * Drops what the extraction claims about the player's family that the game
 * does not already vouch for.
 *
 * A character entry tied to the player by kinship stays only when every word
 * of its name appears in the canon (the sheet, the world text, or the NPC
 * roster, which is how an on-screen relative earns their place). An event
 * tied to the player by kinship goes outright: when it restates the sheet it
 * adds nothing, and when it adds a name or a memory it is the invention.
 */
export function guardExtractionAgainstPlayerSheet(
  extraction: StructuredLoreExtraction,
  playerName: string,
  canon: string
): PlayerSheetGuardResult {
  const dropped: string[] = [];

  const characters = extraction.characters.filter((character) => {
    const text = [character.name, character.role, character.description]
      .filter(Boolean)
      .join(' ');
    if (!claimsPlayerKin(text, playerName)) return true;
    const tokens = nameTokens(character.name, playerName);
    const vouched = tokens.length > 0 && tokens.every((token) => vouchedFor(token, canon));
    if (!vouched) dropped.push(text);
    return vouched;
  });

  const events = extraction.events.filter((event) => {
    const text = [event.description, event.continuity?.topic].filter(Boolean).join(' ');
    if (!claimsPlayerKin(text, playerName)) return true;
    dropped.push(text);
    return false;
  });

  return { extraction: { ...extraction, characters, events }, dropped };
}
