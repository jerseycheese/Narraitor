/**
 * Maps an NPC trust value (0..100, default 50) to a player-facing
 * disposition label. Pure helper shared by SceneStatus and anything else
 * that needs to render relationship state.
 */
export type TrustDisposition = 'hostile' | 'wary' | 'neutral' | 'friendly' | 'trusted';

export const getTrustDisposition = (trust: number): TrustDisposition => {
  if (trust < 25) return 'hostile';
  if (trust <= 40) return 'wary';
  if (trust <= 59) return 'neutral';
  if (trust <= 74) return 'friendly';
  return 'trusted';
};

export const formatDisposition = (disposition: TrustDisposition): string =>
  disposition.charAt(0).toUpperCase() + disposition.slice(1);
