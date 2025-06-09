'use client';

import React from 'react';
import { useJournalStore } from '@/state/journalStore';
import { EntityID } from '@/types/common.types';
import { EntityBadge } from '@/components/shared/cards/EntityBadge';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: EntityID;
  worldId: EntityID;
  characterId: EntityID;
}

/**
 * Minimal JournalModal implementation to pass TDD tests for Issue #278
 * This implements ONLY the functionality required by acceptance criteria
 */
export const JournalModal: React.FC<JournalModalProps> = ({
  isOpen,
  onClose,
  sessionId,
}) => {
  const { getSessionEntries } = useJournalStore();
  
  // AC4: Don't render if not open
  if (!isOpen) return null;

  // Get entries for this session
  const entries = getSessionEntries(sessionId);

  return (
    // AC4: Modal with proper accessibility attributes
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="journal-modal-title"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 id="journal-modal-title" className="text-xl font-bold">Game Journal</h2>
          <button
            onClick={onClose}
            aria-label="Close journal"
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-gray-500">Your journal is empty</p>
              <p className="text-gray-400 text-sm">Entries will appear here as your story unfolds</p>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold mb-4">Character Events</h3>
              {entries.map(entry => (
                <div 
                  key={entry.id} 
                  className="border-b pb-4 p-2 rounded"
                >
                  <div>
                    <p className="text-gray-700">{entry.content}</p>
                    <div className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                      <EntityBadge 
                        text={entry.significance}
                        variant={
                          entry.significance === 'critical' ? 'danger' :
                          entry.significance === 'major' ? 'warning' : 
                          'secondary'
                        }
                        size="sm"
                      />
                      <span>•</span>
                      <EntityBadge 
                        text={entry.type.replace('_', ' ')}
                        variant="info"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};