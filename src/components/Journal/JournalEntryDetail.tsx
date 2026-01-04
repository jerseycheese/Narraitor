'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JournalEntry } from '@/types/journal.types';
import {
  capitalize,
  formatRelativeTime,
  titleCase,
  formatAIResponse
} from '@/lib/utils';
import { formatSessionDuration } from '@/lib/utils/sessionUtils';
import { Play, Square, Settings } from 'lucide-react';
import { getSignificanceBadgeVariant, sanitizeFormattedContent } from './journalUtils';

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
  const isSystemEvent = entry.metadata.automaticEntry &&
    (entry.type === 'session_start' || entry.type === 'session_end');

  return (
    <div className="journal-entry-detail h-full flex flex-col">
      {showBackButton && onBack && (
        <div className="mb-4 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-amber-700 hover:text-amber-900"
          >
            &larr; Back to Entries
          </Button>
        </div>
      )}

      <div className={`border-b pb-4 mb-4 ${
        isSystemEvent
          ? 'border-gray-300 bg-gray-100 rounded-t p-4 -m-4 mb-4'
          : 'border-amber-500'
      }`}>
        <h3 className={`text-xl font-bold mb-2 ${
          isSystemEvent ? 'text-gray-700' : 'text-amber-900'
        }`}>
          {isSystemEvent && (
            <span className="mr-2 inline-flex items-center" aria-label="System event">
              {entry.type === 'session_start' && <Play className="w-4 h-4" aria-hidden="true" />}
              {entry.type === 'session_end' && <Square className="w-4 h-4" aria-hidden="true" />}
              {entry.type !== 'session_start' && entry.type !== 'session_end' && (
                <Settings className="w-4 h-4" aria-hidden="true" />
              )}
            </span>
          )}
          {entry.title || titleCase(entry.type.replace('_', ' '))}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge
            variant={getSignificanceBadgeVariant(entry.significance)}
            size="sm"
          >
            {capitalize(entry.significance)}
          </Badge>
          <Badge
            variant={isSystemEvent ? 'secondary-static' : 'info-static'}
            size="sm"
            className={isSystemEvent ? 'bg-gray-200 text-gray-700' : ''}
          >
            {isSystemEvent && 'System: '}
            {titleCase(entry.type.replace('_', ' '))}
          </Badge>
          <span className={isSystemEvent ? 'text-gray-700' : 'text-amber-500'}>
            {formatRelativeTime(new Date(entry.createdAt))}
          </span>
          {!entry.isRead && (
            <Badge variant="secondary-static" size="sm">Unread</Badge>
          )}
          {/* Show session duration for session_end events */}
          {entry.type === 'session_end' && entry.metadata.sessionDuration && (
            <Badge variant="outline-static" size="sm" className="text-gray-700 border-gray-300">
              Duration: {formatSessionDuration(entry.metadata.sessionDuration)}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="prose prose-gray max-w-none dark:prose-invert">
          <div>
            {entry.type === 'discovery' ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: sanitizeFormattedContent(formatAIResponse(entry.detailedContent || entry.content, {
                    paragraphSpacing: 'single',
                    outputFormat: 'html'
                  }))
                }}
              />
            ) : (
              <p className="whitespace-pre-wrap">
                {entry.detailedContent || entry.content}
              </p>
            )}
          </div>
        </div>

        {entry.relatedEntities && entry.relatedEntities.length > 0 && (
          <div className="mt-6 pt-4 border-t border-amber-500">
            <h4 className="font-semibold text-amber-900 mb-2">Related</h4>
            <div className="flex flex-wrap gap-2">
              {entry.relatedEntities.map((entity, index) => (
                <Badge key={index} variant="outline-static" size="sm">
                  {titleCase(entity.type)}: {entity.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {entry.metadata.tags && entry.metadata.tags.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-amber-900 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
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
