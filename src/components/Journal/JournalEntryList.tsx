'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { JournalEntry } from '@/types/journal.types';
import { EntityID } from '@/types/common.types';
import { capitalize, formatRelativeTime, titleCase, truncate, cn } from '@/lib/utils';
import { Play, Square, Settings } from 'lucide-react';
import { getSignificanceBadgeVariant } from './journalUtils';

interface JournalEntryListProps {
  entries: JournalEntry[];
  selectedEntryId: EntityID | null;
  onEntrySelect: (entry: JournalEntry) => void;
  className?: string;
}

export const JournalEntryList: React.FC<JournalEntryListProps> = ({
  entries,
  selectedEntryId,
  onEntrySelect,
  className,
}) => {
  return (
    <div className={cn('journal-entry-list flex-1 min-h-0 overflow-auto p-4 space-y-2', className)}>
      {entries.map(entry => {
        // Detect system events for list styling (Issue #176)
        const isSystemEvent = entry.metadata.automaticEntry &&
          (entry.type === 'session_start' || entry.type === 'session_end');

        return (
          <Card
            key={entry.id}
            className={`p-3 border cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              isSystemEvent
                ? selectedEntryId === entry.id
                  ? 'bg-gray-100 border-gray-300 shadow-md'
                  : 'bg-gray-100 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                : selectedEntryId === entry.id
                  ? 'bg-amber-100 border-amber-300 shadow-md'
                  : 'bg-white border-amber-500 hover:bg-amber-50 hover:border-amber-300'
            }`}
            onClick={() => onEntrySelect(entry)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onEntrySelect(entry);
              }
            }}
            aria-label={`Select entry: ${entry.title || entry.type}`}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className={`font-medium text-sm leading-tight flex items-center ${
                isSystemEvent ? 'text-gray-700' : 'text-amber-900'
              }`}>
                {isSystemEvent && (
                  <span className="mr-1.5 text-xs inline-flex items-center" aria-label="System event">
                    {entry.type === 'session_start' && <Play className="w-3 h-3" aria-hidden="true" />}
                    {entry.type === 'session_end' && <Square className="w-3 h-3" aria-hidden="true" />}
                    {entry.type !== 'session_start' && entry.type !== 'session_end' && (
                      <Settings className="w-3 h-3" aria-hidden="true" />
                    )}
                  </span>
                )}
                {entry.title || titleCase(entry.type.replace('_', ' '))}
              </h4>
              {!entry.isRead && (
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>
              )}
            </div>

            <p className={`text-xs leading-relaxed mb-2 ${
              isSystemEvent ? 'text-gray-700' : 'text-gray-700'
            }`}>
              {truncate(entry.content, 60)}
            </p>

            <div className="flex items-center justify-between">
              <Badge
                variant={getSignificanceBadgeVariant(entry.significance)}
                size="sm"
              >
                {capitalize(entry.significance)}
              </Badge>
              <span className={`text-xs ${
                isSystemEvent ? 'text-gray-500' : 'text-amber-500'
              }`}>
                {formatRelativeTime(new Date(entry.createdAt))}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
