import { isFeatureEnabled } from '@/lib/featureFlags';
import type { NarrativeTemplateContext } from './context';

/** Requires a forward scene cut when the resolver detects stalled staging. */
export function stallBreakerBlock(context: NarrativeTemplateContext): string {
  const quietTurns = context.narrativeContext?.stalledSceneTurns;
  if (!isFeatureEnabled('SCENE_STATE') || !quietTurns) return '';
  return `
FORCED SCENE EXIT OR TIME SKIP:
The scene has stayed unchanged for ${quietTurns} quiet turns without a recorded transition or new completed beat.
This segment MUST exit the current scene or skip time forward, even if no clock thread is due. Open after the cut and carry the player's action and its consequences forward. Do not continue the same exchange or merely promise a later departure.
Report metadata.sceneTransition as an object with to set to the actual destination. For a time skip in the same place, set to to the current established place. If the place is not established, name the concrete place after the cut; never use a placeholder. Omit this field on ordinary stationary turns.
${context.narrativeContext?.isStallRetry ? 'RETRY: The previous response omitted a usable scene transition. Rewrite the segment to begin after a definite departure or forward time skip. You MUST report metadata.sceneTransition with a concrete destination, or the established current place for a time skip. Do not return another stationary exchange.\n' : ''}`;
}
