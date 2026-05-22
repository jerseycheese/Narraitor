import type { ChoiceAlignment } from '../../types/narrative.types';
import type { ChoiceTypePreference } from '../../types/personalization.types';

/**
 * Maps a choice's alignment to the choice-type preference recorded for the player.
 * Choices without an alignment are treated as neutral.
 */
export const mapAlignmentToChoiceType = (alignment?: ChoiceAlignment): ChoiceTypePreference => {
  switch (alignment) {
    case 'lawful': return 'diplomatic';
    case 'chaotic': return 'aggressive';
    case 'neutral':
    default: return 'neutral';
  }
};
