'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JournalEntry } from '@/types/journal.types';
import {
  capitalize,
  formatRelativeTime,
  titleCase,
  formatAIResponse,
} from '@/lib/utils';
import { formatSessionDuration } from '@/lib/utils/sessionUtils';
import { Play, Square, Settings } from 'lucide-react';
import { getSignificanceBadgeVariant } from './journalUtils';
import { JournalEntryImage } from './JournalEntryImage';

interface JournalEntryDetailProps {
  entry: JournalEntry;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const JournalEntryDetail: React.FC<JournalEntryDetailProps> = ({
  entry,
  onBack,
  showBackButton = false,
}) => {
  // Detect system events (Issue #176)
  const isSystemEvent =
    entry.metadata.automaticEntry &&
    (entry.type === 'session_start' || entry.type === 'session_end');

  return (
    <div className="journal-entry-detail">
      {showBackButton && onBack && (
        <div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            &larr; Back to Entries
          </Button>
        </div>
      )}

      <div className="journal-entry-header">
        <h3>
          {isSystemEvent && (
            <span aria-label="System event">
              {entry.type === 'session_start' && <Play aria-hidden="true" />}
              {entry.type === 'session_end' && <Square aria-hidden="true" />}
              {entry.type !== 'session_start' &&
                entry.type !== 'session_end' && <Settings aria-hidden="true" />}
            </span>
          )}
          {entry.title || titleCase(entry.type.replace('_', ' '))}
        </h3>
        <div>
          <Badge
            variant={getSignificanceBadgeVariant(entry.significance)}
            size="sm"
          >
            {capitalize(entry.significance)}
          </Badge>
          <span>
            {formatRelativeTime(new Date(entry.createdAt))}
          </span>
          {!entry.isRead && (
            <Badge variant="secondary-static" size="sm">
              Unread
            </Badge>
          )}
          {/* Show session duration for session_end events */}
          {entry.type === 'session_end' && entry.metadata.sessionDuration && (
            <Badge variant="outline" size="sm">
              Duration: {formatSessionDuration(entry.metadata.sessionDuration)}
            </Badge>
          )}
        </div>
      </div>

      <div className="journal-entry-content">
        <div>
          <p>
            {entry.type === 'discovery'
              ? formatAIResponse(entry.detailedContent || entry.content, {
                  paragraphSpacing: 'single',
                  outputFormat: 'text',
                })
              : entry.detailedContent || entry.content}
          </p>
        </div>

        {!isSystemEvent && <JournalEntryImage entry={entry} />}

        {entry.relatedEntities && entry.relatedEntities.length > 0 && (
          <div>
            <h4>Related</h4>
            <div>
              {entry.relatedEntities.map((entity, index) => (
                <Badge key={index} variant="outline" size="sm">
                  {titleCase(entity.type)}: {entity.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {entry.metadata.tags && entry.metadata.tags.length > 0 && (
          <div>
            <h4>Tags</h4>
            <div>
              {entry.metadata.tags.map((tag, index) => (
                <Badge key={index} variant="secondary-static" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
