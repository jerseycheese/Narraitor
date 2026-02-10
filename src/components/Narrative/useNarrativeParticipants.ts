import React from 'react';
import { NarrativeSegment } from '@/types/narrative.types';
import { safeTrim } from '@/lib/utils';

export interface NarrativeParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
}

export const NAME_STOP_WORDS = ['the', 'and', 'but', 'for'];

export const deriveFallbackName = (id: string): string => {
  if (!id) {
    return 'Unknown NPC';
  }

  const cleaned = id
    .replace(/^npc[-_]?/i, '')
    .replace(/[-_]/g, ' ')
    .trim();

  if (cleaned) {
    return `NPC ${cleaned}`;
  }

  return 'Unknown NPC';
};

interface UseNarrativeParticipantsParams {
  segment: NarrativeSegment | null;
  speakerId?: string | null;
  speakerName?: string | null;
  isDialogue: boolean;
  getById: (id: string) => { name?: string; avatarUrl?: string } | undefined;
}

export interface NarrativeParticipantsResult {
  participants: NarrativeParticipant[];
  highlightTerms: string[];
}

export function useNarrativeParticipants({
  segment,
  speakerId,
  speakerName,
  isDialogue,
  getById,
}: UseNarrativeParticipantsParams): NarrativeParticipantsResult {
  const participants = React.useMemo(() => {
    if (!segment) {
      return [] as NarrativeParticipant[];
    }

    const normalizedIds = new Map<string, string>();

    const addId = (value?: string | null) => {
      if (!value || typeof value !== 'string') {
        return;
      }

      const trimmed = safeTrim(value);
      if (!trimmed) {
        return;
      }

      const canonical = trimmed.toLowerCase();
      if (!normalizedIds.has(canonical)) {
        normalizedIds.set(canonical, trimmed);
      }
    };

    segment.metadata?.characterIds?.forEach(addId);
    segment.characterIds?.forEach(addId);
    addId(speakerId);

    return Array.from(normalizedIds.values())
      .filter((id) => !(isDialogue && speakerId && id === speakerId))
      .map((id) => {
        const npc = getById(id);
        return {
          id,
          name: npc?.name ?? deriveFallbackName(id),
          avatarUrl: npc?.avatarUrl,
        };
      });
  }, [segment, getById, speakerId, isDialogue]);

  const highlightTerms = React.useMemo(() => {
    const terms = new Set<string>();
    const participantIdSet = new Set(participants.map((participant) => participant.id.toLowerCase()));

    const addName = (value?: string | null, idHint?: string | null) => {
      if (!value) {
        return;
      }

      const normalized = safeTrim(value).replace(/\s+/g, ' ');
      if (!normalized) {
        return;
      }

      terms.add(normalized);

      const tokens = normalized.split(/\s+/).filter(Boolean);
      tokens.forEach((token) => {
        const cleanedToken = safeTrim(token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ''));
        if (
          cleanedToken.length >= 3 &&
          !NAME_STOP_WORDS.includes(cleanedToken.toLowerCase())
        ) {
          terms.add(cleanedToken);
        }
      });

      const leadingSegment = safeTrim(normalized.split(',')[0]).replace(/\s+/g, ' ');
      if (
        leadingSegment &&
        leadingSegment.length >= 3 &&
        (leadingSegment !== normalized || (idHint && idHint.includes('-')))
      ) {
        terms.add(leadingSegment);
      }
    };

    participants.forEach((participant) => addName(participant.name, participant.id));
    addName(speakerName, speakerId ?? null);

    segment?.metadata?.characters?.forEach((character) => {
      if (!character?.id || !character.name) {
        return;
      }
      if (!participantIdSet.has(character.id.toLowerCase())) {
        return;
      }
      addName(character.name, character.id);
    });

    return Array.from(terms);
  }, [participants, speakerId, speakerName, segment?.metadata?.characters]);

  return {
    participants,
    highlightTerms,
  };
}
