// src/types/worldCost.types.ts

import type { EntityID } from './common.types';

/**
 * A cost the world imposed on the character: something they lost or now
 * carry that they did not choose to spend. The player bracing a wall with
 * the shovel is not a cost; the creature taking the shovel is.
 *
 * Two kinds, one writer each. A `condition` is written to the character's
 * `status.conditions` here; an `item` is attribution only, because the scene's
 * `metadata.itemsLost` is already the inventory's writer.
 */
export type WorldCostKind = 'condition' | 'item';

export interface WorldCostEntry {
  kind: WorldCostKind;
  /** Short noun phrase in the character's terms: "gashed left forearm". */
  detail: string;
  /** The open world-clock thread whose landing or move imposed it, when one did. */
  threadId?: EntityID;
}

/** Input to the post-segment extraction's world-cost section. */
export interface WorldCostExtractionInput {
  /** What the character already carries, so the model clears rather than repeats. */
  conditions: string[];
  /** Item names the scene recorded as lost this turn. */
  itemsLost: string[];
}

/** What the extraction returns for the cost channel; both arrays may be empty. */
export interface WorldCostExtractionResult {
  imposed: WorldCostEntry[];
  /** Conditions from the input list the prose plainly ended, verbatim. */
  cleared: string[];
  /**
   * The prose killed the character or left them unable to act. Death is never
   * a condition; it is the one cost the session has to end on.
   */
  fatal: boolean;
}

/**
 * Stamped onto a segment's metadata after the costs are applied, so the
 * playtest harness can count world-took turns off the segment list.
 */
export interface WorldCostSegmentNote {
  imposed: Array<{
    kind: WorldCostKind;
    detail: string;
    /** Summary of the thread it was attributed to, when it was. */
    thread?: string;
  }>;
  cleared: string[];
  /** Set when the extractor read a death or incapacitation in the prose; the segment is tagged fatal-outcome. */
  fatal?: boolean;
}
