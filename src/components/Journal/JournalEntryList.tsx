'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { JournalEntry } from '@/types/journal.types';
import { EntityID } from '@/types/common.types';
import { capitalize, formatRelativeTime, titleCase, truncate, cssClasses } from '@/lib/utils';
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
    <div className={cssClasses('journal-entry-list', className)}>
      {entries.map(entry => {
        // Detect system events for list styling (Issue #176)
        const isSystemEvent = entry.metadata.automaticEntry &&
          (entry.type === 'session_start' || entry.type === 'session_end');

        return (
          <Card
            key={entry.id}
            className={`${
              isSystemEvent
                ? selectedEntryId === entry.id
                  ? ''
                  : ''
                : selectedEntryId === entry.id
                  ? ''
                  : ''
            }`}
            onClick={() => onEntrySelect(entry)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === '') {
                event.preventDefault();
                onEntrySelect(entry);
              }
            }}
            aria-label={`Select entry:${entry.title || entry.type}`}
          >
            <div >
              <h4 className={`${
                isSystemEvent ? '' : ''
              }`}>
                {isSystemEvent && (
                  <span  aria-label="System event">
                    {entry.type === 'session_start' && <Play  aria-hidden="true" />}
                    {entry.type === 'session_end' && <Square  aria-hidden="true" />}
                    {entry.type !== 'session_start' && entry.type !== 'session_end' && (
                      <Settings  aria-hidden="true" />
                    )}
                  </span>
                )}
                {entry.title || titleCase(entry.type.replace('_', ''))}
              </h4>
              {!entry.isRead && (
                <div ></div>
              )}
            </div>

            <p className={`${
              isSystemEvent ? '' : ''
            }`}>
              {truncate(entry.content, 60)}
            </p>

            <div >
              <Badge
                variant={getSignificanceBadgeVariant(entry.significance)}
                size="sm"
              >
                {capitalize(entry.significance)}
              </Badge>
              <span className={`${
                isSystemEvent ? '' : ''
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
