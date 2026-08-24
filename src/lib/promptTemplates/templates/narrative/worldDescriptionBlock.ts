import { truncate } from '@/lib/utils';

/**
 * The world's own founding description, carried into the per-turn scene
 * prompt. initialSceneTemplate already renders it in full, once, for the
 * opening scene — by turn 20 that context is gone unless lore extraction
 * happened to capture it, so anything the description states but the story
 * never narrates (a deadline, a standing threat) is lost. This is that same
 * text, reaching every turn instead of just the first.
 *
 * Unlike the opening scene, this block pays its cost every turn, so it is
 * trimmed to WORLD_DESCRIPTION_CHAR_LIMIT (word boundary, "...") rather than
 * rendered in full — a description can run to whatever length its author
 * wrote, with no upstream cap.
 *
 * Rendered only when the WORLD_DESCRIPTION_IN_SCENE flag is on (see
 * sceneTemplate.ts). EXPERIMENT (#1865): whether this changes play at all is
 * unmeasured — see narraitor-prompt-template-governance/eval-logs/
 * 1865-world-description-in-scene.md.
 */
const WORLD_DESCRIPTION_CHAR_LIMIT = 400;

export const worldDescriptionBlock = (worldDescription?: string): string => {
  const trimmed = worldDescription?.trim();
  if (!trimmed) return '';

  return `
WORLD DESCRIPTION (established at creation — the pressures this world was built around):
${truncate(trimmed, WORLD_DESCRIPTION_CHAR_LIMIT)}
`;
};
