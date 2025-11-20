'use client';

import * as React from 'react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { Button } from '@/components/ui/button';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { useStoryCheckpointManager } from './hooks/useStoryCheckpointManager';
import { formatRelativeTime } from '@/lib/utils';
import { WorldStateMajorEvent } from '@/types/world-state.types';

interface StorySummarySectionProps {
  worldId: string;
  sessionId: string;
  characterId?: string;
}

const EventList = ({
  title,
  events,
  emptyLabel,
  accent,
  characterNames,
}: {
  title: string;
  events: WorldStateMajorEvent[];
  emptyLabel: string;
  accent?: 'pending' | 'default';
  characterNames: Record<string, string | undefined>;
}) => (
  <div>
    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    {events.length === 0 ? (
      <p className="text-sm text-gray-500 mt-1">{emptyLabel}</p>
    ) : (
      <ul className="mt-2 space-y-2">
        {events.map((event) => (
          <li
            key={event.id}
            className={`rounded-lg border px-3 py-2 text-sm ${
              accent === 'pending'
                ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
                : 'border-gray-200 bg-white text-gray-800'
            }`}
          >
            <p className="font-medium">{event.description}</p>
            <p className="text-xs text-gray-500">
              {formatRelativeTime(event.timestamp)}
              {event.characterId
                ? ` • ${characterNames[event.characterId] ?? `Character ${event.characterId}`}`
                : ''}
            </p>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export const StorySummarySection: React.FC<StorySummarySectionProps> = ({ worldId, sessionId, characterId }) => {
  const {
    status,
    error,
    latestCheckpoint,
    pendingEvents,
    recentEvents,
    createCheckpoint,
    hasPendingEvents,
    characterNameLookup,
  } = useStoryCheckpointManager({ worldId, sessionId, characterId });

  const isLoading = status === 'loading';
  const lastUpdatedLabel = latestCheckpoint?.createdAt
    ? formatRelativeTime(latestCheckpoint.createdAt)
    : null;

  return (
    <section className="mt-6" data-testid="story-summary-section">
      <CollapsibleSection title="The Story So Far" initialCollapsed>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Current Checkpoint</h3>
              {lastUpdatedLabel && <span className="text-xs text-gray-500">Updated {lastUpdatedLabel}</span>}
            </div>
            {latestCheckpoint ? (
              <p className="mt-2 text-sm text-gray-800 leading-relaxed">{latestCheckpoint.summary}</p>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                No checkpoints yet. Capture a summary once you experience at least one major event.
              </p>
            )}
          </div>

          {pendingEvents.length > 0 && (
            <EventList
              title="New major events ready for the next checkpoint"
              events={pendingEvents}
              emptyLabel="No pending events."
              accent="pending"
              characterNames={characterNameLookup}
            />
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={createCheckpoint}
              disabled={!hasPendingEvents || isLoading}
              className="sm:w-auto"
            >
              {isLoading ? 'Creating checkpoint…' : 'Create Checkpoint'}
            </Button>
            <p className="text-xs text-gray-500">
              {hasPendingEvents
                ? `${pendingEvents.length} new event${pendingEvents.length === 1 ? '' : 's'} will be summarized.`
                : 'No new major events since the last checkpoint.'}
            </p>
          </div>

          {error && (
            <ErrorDisplay
              variant="section"
              message={error}
              className="mt-2"
            />
          )}
        </div>
      </CollapsibleSection>
    </section>
  );
};
