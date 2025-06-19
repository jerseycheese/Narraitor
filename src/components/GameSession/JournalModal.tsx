'use client';

import React from 'react';
import { useJournalStore } from '@/state/journalStore';
import { EntityID } from '@/types/common.types';
import { EntityBadge } from '@/components/shared/cards/EntityBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge/StatusBadge';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: EntityID;
}

/**
 * Enhanced JournalModal with book-like interface for MVP
 * Implements core features from Issue #562 for enhanced journal UI
 */
export const JournalModal: React.FC<JournalModalProps> = ({
  isOpen,
  onClose,
  sessionId,
}) => {
  const { getSessionEntries } = useJournalStore();
  
  // Don't render if not open
  if (!isOpen) return null;

  // Get entries for this session
  const entries = getSessionEntries(sessionId);

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="journal-modal-title"
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <Card 
        className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg max-w-4xl w-full m-4 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-2 border-amber-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with book-like styling */}
        <div className="flex justify-between items-center p-6 border-b border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100">
          <div className="flex items-center">
            <h2 id="journal-modal-title" className="text-2xl font-bold text-amber-900">Journal</h2>
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

        {/* Content with enhanced book-like styling */}
        <div className="flex-1 overflow-auto p-6">
          {entries.length === 0 ? (
            <EmptyState
              title="This journal awaits its first entry"
              description="Updates will appear here as things unfold"
              variant="centered"
              className="text-amber-700"
            />
          ) : (
            <div className="space-y-4">
              {entries.map(entry => (
                <Card 
                  key={entry.id} 
                  className="p-4 bg-white border border-amber-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="text-gray-700 leading-relaxed mb-3">{entry.content}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <StatusBadge
                      variant="significance"
                      state={entry.significance as 'critical' | 'major' | 'minor'}
                      label={entry.significance.charAt(0).toUpperCase() + entry.significance.slice(1)}
                    />
                    <EntityBadge 
                      text={entry.type.replace('_', ' ')}
                      variant="info"
                      size="sm"
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};