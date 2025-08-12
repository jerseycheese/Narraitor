'use client';

import React, { useState } from 'react';
import { useJournalStore } from '@/state/journalStore';
import { EntityID } from '@/types/common.types';
import { JournalEntry } from '@/types/journal.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge/StatusBadge';
import { 
  capitalize, 
  formatRelativeTime, 
  titleCase, 
  truncate,
  formatAIResponse 
} from '@/lib/utils';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: EntityID;
}

// EntryDetail component for displaying complete formatted content
const EntryDetail: React.FC<{ entry: JournalEntry }> = ({ entry }) => (
  <div className="h-full flex flex-col">
    <div className="border-b border-amber-200 pb-4 mb-4">
      <h3 className="text-xl font-bold text-amber-900 mb-2">
        {entry.title || titleCase(entry.type.replace('_', ' '))}
      </h3>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusBadge
          variant="significance"
          state={entry.significance as 'critical' | 'major' | 'minor'}
          label={capitalize(entry.significance)}
        />
        <Badge variant="info" size="sm">
          {titleCase(entry.type.replace('_', ' '))}
        </Badge>
        <span className="text-amber-600">
          {formatRelativeTime(new Date(entry.createdAt))}
        </span>
        {!entry.isRead && (
          <Badge variant="secondary" size="sm">Unread</Badge>
        )}
      </div>
    </div>
    
    <div className="flex-1 overflow-auto">
      <div className="prose prose-amber max-w-none">
        <div className="text-gray-700 leading-relaxed">
          {entry.type === 'discovery' ? (
            <div 
              dangerouslySetInnerHTML={{ 
                __html: formatAIResponse(entry.detailedContent || entry.content, {
                  paragraphSpacing: 'single',
                  outputFormat: 'html'
                })
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
        <div className="mt-6 pt-4 border-t border-amber-200">
          <h4 className="font-semibold text-amber-900 mb-2">Related</h4>
          <div className="flex flex-wrap gap-2">
            {entry.relatedEntities.map((entity, index) => (
              <Badge key={index} variant="outline" size="sm">
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
              <Badge key={index} variant="secondary" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

/**
 * Enhanced JournalModal with list-detail interface for entry selection and viewing
 * Implements Issue #179: Select and view complete journal entry content with formatting
 */
export const JournalModal: React.FC<JournalModalProps> = ({
  isOpen,
  onClose,
  sessionId,
}) => {
  const { getSessionEntries, markAsRead } = useJournalStore();
  const [selectedEntryId, setSelectedEntryId] = useState<EntityID | null>(null);
  
  // Don't render if not open
  if (!isOpen) return null;

  // Get entries for this session
  const entries = getSessionEntries(sessionId);
  const selectedEntry = selectedEntryId ? entries.find(e => e.id === selectedEntryId) : null;

  // Handle entry selection
  const handleEntrySelect = (entry: JournalEntry) => {
    setSelectedEntryId(entry.id);
    if (!entry.isRead) {
      markAsRead(entry.id);
    }
  };

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="journal-modal-title"
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <Card 
        className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg max-w-6xl w-full m-4 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-2 border-amber-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with book-like styling */}
        <div className="flex justify-between items-center p-6 border-b border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100">
          <div className="flex items-center">
            <h2 id="journal-modal-title" className="text-2xl font-bold text-amber-900">Journal</h2>
            {entries.length > 0 && (
              <span className="ml-3 text-sm text-amber-700">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            aria-label="Close journal"
            className="text-amber-700 hover:text-amber-900 hover:bg-amber-200"
          >
            ✕
          </Button>
        </div>

        {/* Content with responsive list-detail layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
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
              <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-amber-200 flex flex-col ${
                selectedEntry ? 'hidden md:flex' : 'flex'
              }`}>
                <div className="p-4 border-b border-amber-200 bg-amber-50 flex items-center justify-between">
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
                <div className="flex-1 overflow-auto p-4 space-y-2">
                  {entries.map(entry => (
                    <Card 
                      key={entry.id} 
                      className={`p-3 border cursor-pointer transition-all duration-200 ${
                        selectedEntryId === entry.id
                          ? 'bg-amber-100 border-amber-300 shadow-md'
                          : 'bg-white border-amber-200 hover:bg-amber-50 hover:border-amber-300'
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
                        <h4 className="font-medium text-amber-900 text-sm leading-tight">
                          {entry.title || titleCase(entry.type.replace('_', ' '))}
                        </h4>
                        {!entry.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-xs leading-relaxed mb-2">
                        {truncate(entry.content, 60)}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <StatusBadge
                          variant="significance"
                          state={entry.significance as 'critical' | 'major' | 'minor'}
                          label={capitalize(entry.significance)}
                        />
                        <span className="text-xs text-amber-600">
                          {formatRelativeTime(new Date(entry.createdAt))}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Entry Detail - Full width when selected on mobile, always visible on desktop */}
              <div className={`flex-1 bg-white ${
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
                    <div className="text-center text-amber-600">
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
      </Card>
    </div>
  );
};