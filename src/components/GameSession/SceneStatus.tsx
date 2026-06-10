'use client';

import React from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { NarrativeSegment } from '@/types/narrative.types';
import { useNPCStore } from '@/state/npcStore';
import { useWorldStore } from '@/state/worldStore';
import { useNarrativeParticipants } from '@/components/Narrative/useNarrativeParticipants';
import { getTrustDisposition, formatDisposition } from '@/lib/world/relationships/disposition';
import { safeTrim } from '@/lib/utils';

interface SceneStatusProps {
  /** The latest narrative segment whose state the panel reflects. */
  segment: NarrativeSegment | null;
  className?: string;
}

/**
 * Dedicated scene status surface: characters present + current location for the
 * most recent narrative segment. One canon component, themed per DS via CSS
 * (DS1 left rail, DS2 ambient line, DS3 compact bar).
 */
export const SceneStatus: React.FC<SceneStatusProps> = ({ segment, className }) => {
  const getById = useNPCStore((state) => state.getById);
  // Narrow slice on this world's npcRelationships so the panel re-renders
  // when a choice shifts trust, without recomputing getWorldState.
  const npcRelationships = useWorldStore((state) =>
    segment?.worldId ? state.worldStates[segment.worldId]?.npcRelationships : undefined
  );

  const { participants } = useNarrativeParticipants({
    segment,
    isDialogue: false,
    getById,
  });

  const location = segment?.metadata?.location ? safeTrim(segment.metadata.location) : '';
  const hasParticipants = participants.length > 0;

  // Nothing to show yet.
  if (!hasParticipants && !location) {
    return null;
  }

  return (
    <section
      className={clsx('component-scene-status', className)}
      aria-label="Scene status"
    >
      {location && (
        <div className="scene-status-location">
          <span className="scene-status-location-label">Location</span>
          <span className="scene-status-location-value">{location}</span>
        </div>
      )}

      {hasParticipants && (
        <div className="scene-status-participants">
          <p className="manuscript-characters-rail-label scene-status-label">
            Characters Present
          </p>
          <div className="manuscript-characters-rail-list scene-status-list">
            {participants.map((participant) => {
              // Disposition renders only when relationship state exists for
              // this NPC — no data, no label (keeps untouched scenes clean).
              const relationship = npcRelationships?.[participant.id];
              const disposition = relationship
                ? getTrustDisposition(relationship.trust)
                : undefined;

              return (
                <span
                  key={participant.id}
                  className="manuscript-character-badge scene-status-badge"
                >
                  {participant.avatarUrl && (
                    <div className="manuscript-character-avatar scene-status-avatar">
                      <Image
                        src={participant.avatarUrl}
                        alt={`${participant.name}'s avatar`}
                        fill
                        sizes="20px"
                      />
                    </div>
                  )}
                  <span className="manuscript-character-name scene-status-name">
                    {participant.name}
                  </span>
                  {disposition && (
                    <span
                      className="scene-status-disposition"
                      data-disposition={disposition}
                    >
                      {formatDisposition(disposition)}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
