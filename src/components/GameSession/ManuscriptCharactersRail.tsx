'use client';

import React from 'react';
import { NarrativeSegment } from '@/types/narrative.types';
import { useNPCStore } from '@/state/npcStore';
import { useNarrativeParticipants } from '@/components/Narrative/useNarrativeParticipants';
import { NarrativeCharacterAvatar } from '@/components/Narrative/NarrativeCharacterAvatar';

interface ManuscriptCharactersRailProps {
  segment: NarrativeSegment | null;
}

export const ManuscriptCharactersRail: React.FC<ManuscriptCharactersRailProps> = ({
  segment,
}) => {
  const getById = useNPCStore((state) => state.getById);

  const { participants } = useNarrativeParticipants({
    segment,
    isDialogue: false,
    getById,
  });

  // Don't render if no participants
  if (!participants || participants.length === 0) {
    return null;
  }

  return (
    <div className="manuscript-characters-rail-section">
      <p className="manuscript-characters-rail-label">Characters Present</p>
      <div className="manuscript-characters-rail-list">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="manuscript-character-badge"
          >
            {participant.avatarUrl && (
              <NarrativeCharacterAvatar
                name={participant.name}
                avatarUrl={participant.avatarUrl}
                size="sm"
              />
            )}
            <span className="manuscript-character-name">{participant.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
