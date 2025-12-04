'use client';

import React, { useState } from 'react';
import { useJournalStore } from '@/state/journalStore';
import { EntityID } from '@/types/common.types';
import { JournalEntry } from '@/types/journal.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { 
  capitalize, 
  formatRelativeTime, 
  titleCase, 
  truncate,
  formatAIResponse 
} from '@/lib/utils';
import { formatSessionDuration } from '@/lib/utils/sessionUtils';
import { Play, Square, Settings } from 'lucide-react';

/**
 * Sanitizes HTML content to only allow safe formatting tags from formatAIResponse
 * Addresses security concern: XSS prevention for HTML rendering
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML with only allowed tags
 */
const sanitizeFormattedContent = (html: string): string => {
  // Allow only the specific tags that formatAIResponse generates: p, br, em
  // Remove any other HTML tags while preserving the allowed ones and their content
  return html
    // Remove any script, style, or other potentially dangerous tags completely
    .replace(/<(script|style|object|embed|form|input|button)[^>]*>.*?<\/\1>/gi, '')
    // Remove any attributes from allowed tags (keep only the tag itself)
    .replace(/<(p|br|em)([^>]*?)>/gi, '<$1>')
    // Remove any other HTML tags while preserving their text content
    .replace(/<(?!\/?(?:p|br|em)\b)[^>]*>/gi, '');
};

/**
 * Maps journal entry significance levels to badge variants
 */
const getSignificanceBadgeVariant = (significance: string): 'destructive' | 'warning' | 'secondary' => {
  switch (significance) {
    case 'critical':
      return 'destructive';
    case 'major':
      return 'warning';
    case 'minor':
    default:
      return 'secondary';
  }
};

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: EntityID;
  characterId?: EntityID | null;
}

// EntryDetail component for displaying complete formatted content
const EntryDetail: React.FC<{ entry: JournalEntry }> = ({ entry }) => {
  // Detect system events (Issue #176)
  const isSystemEvent = entry.metadata.automaticEntry && 
    (entry.type === 'session_start' || entry.type === 'session_end');

  return (
    <div className="h-full flex flex-col">
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
            variant={isSystemEvent ? "secondary" : "info"} 
            size="sm"
            className={isSystemEvent ? "bg-gray-200 text-gray-700" : ""}
          >
            {isSystemEvent && "System: "}
            {titleCase(entry.type.replace('_', ' '))}
          </Badge>
          <span className={isSystemEvent ? "text-gray-700" : "text-amber-500"}>
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

/**
 * Enhanced JournalModal with list-detail interface for entry selection and viewing
 * Implements Issue #179: Select and view complete journal entry content with formatting
 */
export const JournalModal: React.FC<JournalModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  characterId,
}) => {
  const { getSessionEntriesWithCharacter, markAsRead } = useJournalStore();
  const [selectedEntryId, setSelectedEntryId] = useState<EntityID | null>(null);
  
  // Get entries for this session
  const entries = getSessionEntriesWithCharacter(sessionId, characterId);
  const selectedEntry = selectedEntryId ? entries.find(e => e.id === selectedEntryId) : null;

  // Handle entry selection
  const handleEntrySelect = (entry: JournalEntry) => {
    setSelectedEntryId(entry.id);
    if (!entry.isRead) {
      markAsRead(entry.id);
    }
  };

  const entrySummary = entries.length
    ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`
    : 'No entries yet';

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Journal"
      tone="warning"
      description={entrySummary}
      className="max-w-6xl"
      contentClassName="!p-0"
    >
      {/* Content with responsive list-detail layout */}
      <div className="flex h-full min-h-0 flex-col gap-6 px-6 pb-6 pt-6">
        <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-warning/30 bg-background dark:bg-white flex flex-col md:flex-row">
          {entries.length === 0 ? (
            <div className="flex-1 p-6">
              <EmptyState
                title="This journal awaits its first entry"
                description="Updates will appear here as things unfold"
                variant="centered"
                className="text-amber-700"
              />
            </div>
          ) : (
            <>
              {/* Entry List - Full width on mobile, sidebar on desktop */}
              <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-amber-500 flex min-h-0 flex-col ${
                selectedEntry ? 'hidden md:flex' : 'flex'
              }`}>
                <div className="p-4 border-b border-amber-500 bg-amber-50 flex items-center justify-between">
                  <h3 className="font-semibold text-amber-900">Entries</h3>
                  {selectedEntry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEntryId(null)}
                      className="md:hidden text-amber-700 hover:text-amber-900"
                    >
                      Back to List
                    </Button>
                  )}
                </div>
                <div className="flex-1 min-h-0 overflow-auto p-4 space-y-2">
                  {entries.map(entry => {
                    // Detect system events for list styling (Issue #176)
                    const isSystemEvent = entry.metadata.automaticEntry && 
                      (entry.type === 'session_start' || entry.type === 'session_end');

                    return (
                      <Card 
                        key={entry.id} 
                        className={`p-3 border cursor-pointer transition-all duration-200 ${
                          isSystemEvent
                            ? selectedEntryId === entry.id
                              ? 'bg-gray-100 border-gray-300 shadow-md'
                              : 'bg-gray-100 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                            : selectedEntryId === entry.id
                              ? 'bg-amber-100 border-amber-300 shadow-md'
                              : 'bg-white border-amber-500 hover:bg-amber-50 hover:border-amber-300'
                        }`}
                        onClick={() => handleEntrySelect(entry)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleEntrySelect(entry);
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
              </div>

              {/* Entry Detail - Full width when selected on mobile, always visible on desktop */}
              <div className={`flex-1 min-h-0 bg-white md:w-[28rem] xl:w-[32rem] ${
                selectedEntry ? 'flex flex-col' : 'hidden md:flex md:flex-col'
              }`}>
                {selectedEntry ? (
                  <div className="p-4 md:p-6 h-full">
                    <div className="md:hidden mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEntryId(null)}
                        className="text-amber-700 hover:text-amber-900"
                      >
                        ← Back to Entries
                      </Button>
                    </div>
                    <EntryDetail entry={selectedEntry} />
                  </div>
                ) : (
                  <div className="p-6 h-full flex items-center justify-center">
                    <div className="text-center text-amber-500">
                      <div className="text-4xl mb-4">📖</div>
                      <h3 className="text-lg font-medium mb-2">Select an Entry</h3>
                      <p className="text-sm">
                        Choose an entry from the list to view its complete content
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </SimpleModal>
  );
};
