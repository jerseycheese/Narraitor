'use client';

import React from 'react';
import { NarrativeSegment } from '@/types/narrative.types';
import { useNPCStore } from '@/state/npcStore';
import { useNarrativeParticipants } from '@/components/Narrative/useNarrativeParticipants';
import { NarrativeCharacterAvatar } from '@/components/Narrative/NarrativeCharacterAvatar';

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
    <div
      key={participant.id}
      className="manuscript-character-badge"
    >
      {participant.avatarUrl && (
        <img 
          src={participant.avatarUrl} 
          alt="" 
          className="w-5 h-5 rounded-full object-cover" 
          style={{ border: '1px solid var(--color-border)' }} 
        />
      )}
      <span className="manuscript-character-name">{participant.name}</span>
    </div>
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
