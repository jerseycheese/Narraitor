'use client';

import React from 'react';
import { useJournalStore } from '@/state/journalStore';
import { EntityID } from '@/types/common.types';

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
      aria-labelledby="journal-title"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 id="journal-title" className="text-xl font-bold">Game Journal</h2>
          <button
            onClick={onClose}
            aria-label="Close journal modal"
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {entries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No journal entries yet</p>
          ) : (
            entries.map(entry => (
              <div key={entry.id} className="border-b pb-4">
                <h3 className="font-semibold">{entry.title}</h3>
                <p className="text-gray-700">{entry.content}</p>
                <div className="text-sm text-gray-500 mt-2">
                  {entry.type} • {entry.significance}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};