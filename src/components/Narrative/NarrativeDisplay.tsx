import React from 'react';
import { NarrativeSegment } from '@/types/narrative.types';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatAIResponse, FormattingOptions } from '@/lib/utils/textFormatter';
import { parseNarrativeContent, safeTrim } from '@/lib/utils';
import { FormattedNarrativeContent } from './FormattedNarrativeContent';
import { NarrativeCharacterAvatar } from './NarrativeCharacterAvatar';
import { useNPCStore } from '@/state/npcStore';

const NAME_STOP_WORDS = ['the', 'and', 'but', 'for'];

const deriveFallbackName = (id: string): string => {
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

interface NarrativeDisplayProps {
  segment: NarrativeSegment | null;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({
  segment,
  isLoading = false,
  error,
  onRetry
}) => {
  // Use selector to avoid subscribing to entire store
  const getById = useNPCStore((state) => state.getById);

  const getSegmentStyles = (type: string) => {
    switch (type) {
      case 'dialogue':
        return {
          container: 'border-l-4 border-blue-500 bg-blue-50',
          text: 'italic text-gray-700',
          label: 'text-xs uppercase text-blue-700 font-semibold mb-2'
        };
      case 'action':
        return {
          container: 'border-2 border-amber-300 bg-amber-50',
          text: 'font-medium text-gray-900',
          label: 'text-xs uppercase text-amber-500 font-semibold mb-2'
        };
      case 'decision':
        return {
          container: 'border-2 border-blue-300 bg-blue-50',
          text: 'font-medium text-gray-900',
          label: 'text-xs uppercase text-blue-700 font-semibold mb-2'
        };
      case 'combat':
        return {
          container: 'border-2 border-red-300 bg-red-200',
          text: 'font-bold text-gray-900',
          label: 'text-xs uppercase text-red-500 font-semibold mb-2'
        };
      case 'exploration':
        return {
          container: 'border-2 border-green-300 bg-green-50',
          text: 'text-gray-700',
          label: 'text-xs uppercase text-green-500 font-semibold mb-2'
        };
      case 'resolution':
        return {
          container: 'border-2 border-blue-300 bg-blue-50',
          text: 'text-gray-700',
          label: 'text-xs uppercase text-blue-700 font-semibold mb-2'
        };
      case 'character_interaction':
        return {
          container: 'border-2 border-blue-300 bg-blue-50',
          text: 'text-gray-700',
          label: 'text-xs uppercase text-blue-700 font-semibold mb-2'
        };
      case 'revelation':
        return {
          container: 'border-2 border-red-300 bg-red-50',
          text: 'font-medium italic text-gray-900',
          label: 'text-xs uppercase text-red-500 font-semibold mb-2'
        };
      case 'transition':
        return {
          container: 'bg-gray-100 border border-gray-300',
          text: 'text-gray-700 text-sm italic',
          label: 'text-xs uppercase text-gray-500 font-semibold mb-2'
        };
      case 'scene':
      default:
        return {
          container: 'bg-white border border-gray-200',
          text: 'text-gray-900',
          label: 'text-xs uppercase text-gray-700 font-semibold mb-2'
        };
    }
  };


  const getFormattingOptions = (type: string): FormattingOptions => {
    switch (type) {
      case 'dialogue':
        return { formatDialogue: true };
      case 'scene':
        return { formatDialogue: true, paragraphSpacing: 'double' };
      case 'transition':
        return { preserveLineBreaks: true };
      case 'action':
      default:
        return {}; // Use all defaults
    }
  };

  const resolvedSegment = segment ?? null;
  const segmentType = resolvedSegment?.type ?? 'scene';
  const isDialogue = segmentType === 'dialogue';

  const styles = getSegmentStyles(segmentType);
  const formattingOptions = getFormattingOptions(segmentType);
  const parsedContent = React.useMemo(
    () => (resolvedSegment ? parseNarrativeContent(resolvedSegment.content) : ''),
    [resolvedSegment]
  );
  const formattedContent = React.useMemo(
    () => formatAIResponse(parsedContent, formattingOptions),
    [parsedContent, formattingOptions]
  );

  const speakerId = resolvedSegment?.metadata?.speakerId;
  const speakerRecord = speakerId ? getById(speakerId) : null;
  const speakerName = speakerId
    ? (speakerRecord?.name ?? deriveFallbackName(speakerId))
    : null;

  const participantDetails = React.useMemo(() => {
    if (!resolvedSegment) {
      return [];
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

    resolvedSegment.metadata?.characterIds?.forEach(addId);
    resolvedSegment.characterIds?.forEach(addId);
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
  }, [resolvedSegment, getById, speakerId, isDialogue]);

  const highlightTerms = React.useMemo(() => {
    if (!resolvedSegment) {
      return [];
    }

    const participantIdSet = new Set<string>();
    participantDetails.forEach((participant) => {
      participantIdSet.add(participant.id.toLowerCase());
    });
    if (speakerId) {
      participantIdSet.add(speakerId.toLowerCase());
    }

    const terms = new Set<string>();

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

    participantDetails.forEach((participant) => addName(participant.name, participant.id));
    addName(speakerName, speakerId ?? null);
    resolvedSegment.metadata?.characters?.forEach((character) => {
      if (!character?.id || !character.name) {
        return;
      }
      if (!participantIdSet.has(character.id.toLowerCase())) {
        return;
      }
      addName(character.name, character.id);
    });

    return Array.from(terms);
  }, [participantDetails, speakerName, resolvedSegment, speakerId]);

  if (isLoading) {
    return (
      <div className="p-8 snap-center">
        <LoadingState message="Writing your story..." theme="light" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="snap-center">
        <ErrorDisplay
          variant="section"
          severity="error"
          title="Unable to Generate Narrative"
          message={error}
          showRetry={!!onRetry}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (!resolvedSegment) {
    return null;
  }

  return (
    <div className="space-y-3 snap-center">
      <div className={`narrative-segment p-6 rounded-lg ${styles.container}`}>
        <p className={styles.label}>{resolvedSegment.type}</p>

        {participantDetails.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Characters Present
            </p>
            <div
              className="mt-2 flex flex-wrap gap-2"
              role="list"
              aria-label="Characters present in this scene"
            >
              {participantDetails.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1"
                  role="listitem"
                >
                  <NarrativeCharacterAvatar
                    name={participant.name}
                    avatarUrl={participant.avatarUrl}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    {participant.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isDialogue && speakerId && speakerName && (
          <div className="mb-3 flex items-center gap-2">
            <NarrativeCharacterAvatar
              name={speakerName}
              avatarUrl={speakerRecord?.avatarUrl}
              size="sm"
            />
            <span className="text-sm font-semibold text-blue-700">
              {speakerName}
            </span>
          </div>
        )}

        <FormattedNarrativeContent
          content={formattedContent}
          className={`text-lg narrative-content readable ${resolvedSegment.type === 'scene' ? 'scene-spacing' : ''} ${resolvedSegment.type === 'dialogue' ? 'dialogue-segment' : ''} ${resolvedSegment.type === 'transition' ? 'preserve-breaks' : ''} ${styles.text}`}
          highlightTerms={highlightTerms}
        />
        {resolvedSegment.metadata?.location && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {resolvedSegment.metadata?.location}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
