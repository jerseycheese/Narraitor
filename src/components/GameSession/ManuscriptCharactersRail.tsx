'use client';

import React from 'react';
import Image from 'next/image';
import { NarrativeSegment } from '@/types/narrative.types';
import { useNPCStore } from '@/state/npcStore';
import { useNarrativeParticipants } from '@/components/Narrative/useNarrativeParticipants';

interface ManuscriptCharactersRailProps {
  segment: NarrativeSegment | null;
  variant?: 'rail' | 'mobile-bar';
}

export const ManuscriptCharactersRail: React.FC<ManuscriptCharactersRailProps> = ({
  segment,
  variant = 'rail',
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

  const participantContent = participants.map((participant) => (
    <span
      key={participant.id}
      className="manuscript-character-badge"
    >
      {participant.avatarUrl && (
        <div className="relative w-5 h-5 rounded-full overflow-hidden manuscript-character-avatar">
          <Image 
            src={participant.avatarUrl} 
            alt={`${participant.name}'s avatar`} 
            fill
            className="object-cover" 
          />
        </div>
      )}
      <span className="manuscript-character-name">{participant.name}</span>
    </span>
  ));

  if (variant === 'mobile-bar') {
    return (
      <div className="manuscript-characters-mobile-bar">
        <p className="manuscript-characters-mobile-label">Characters Present</p>
        <div className="manuscript-characters-mobile-list">
          {participantContent}
        </div>
      </div>
    );
  }

  return (
    <div className="manuscript-characters-rail-section">
      <p className="manuscript-characters-rail-label">Characters Present</p>
      <div className="manuscript-characters-rail-list">
        {participantContent}
      </div>
    </div>
  );
};
