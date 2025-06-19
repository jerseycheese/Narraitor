'use client';

import React, { useState, useEffect } from 'react';
import { JournalModal } from '@/components/GameSession/JournalModal';
import { JournalFloatingButton } from '@/components/GameSession/JournalFloatingButton';
import { useJournalStore } from '@/state/journalStore';
import { useJournalShortcuts } from '@/hooks/useKeyboardShortcuts';
import { JournalEntry } from '@/types/journal.types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Test Harness for Issue #562: Enhanced Journal UI
 * Comprehensive testing environment for book-like journal interface
 * 
 * MVP Features to Test:
 * - Book-like visual design with amber theme
 * - Clean entry list with visual polish
 * - Floating action button with unread indicators
 * - Mobile-responsive design
 * - Keyboard shortcuts (J key)
 * - Visual significance indicators
 */
export default function EnhancedJournalTestPage() {
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [sessionId] = useState('enhanced-test-session');
  
  const { addEntry, reset, getSessionEntries } = useJournalStore();
  const entries = getSessionEntries(sessionId);
  
  // Setup keyboard shortcuts
  useJournalShortcuts(() => setIsJournalOpen(true), true);

  // Setup mock data
  useEffect(() => {
    reset();
    
    const mockEntries: Omit<JournalEntry, 'id' | 'sessionId' | 'createdAt'>[] = [
      {
        worldId: 'enhanced-world-1',
        characterId: 'enhanced-char-1',
        type: 'character_event',
        title: '',
        content: 'Had a meaningful conversation with Elder Thorne about the ancient prophecy and missing artifacts. He spoke of dark times ahead and the need for chosen heroes to rise up and defend the realm.',
        significance: 'critical',
        isRead: false,
        relatedEntities: [
          { type: 'character', id: 'elder-thorne', name: 'Elder Thorne' },
          { type: 'location', id: 'temple', name: 'Ancient Temple' }
        ],
        metadata: {
          tags: ['prophecy', 'elder'],
          automaticEntry: true,
          narrativeSegmentId: 'segment-1'
        },
        updatedAt: '2023-01-01T12:00:00Z',
      },
      {
        worldId: 'enhanced-world-1',
        characterId: 'enhanced-char-1',
        type: 'discovery',
        title: '',
        content: 'Discovered a concealed entrance behind the Crystal Waterfall leading deep into the mountain. The passage seems ancient and untouched by time, with strange runes carved into the stone walls.',
        significance: 'major',
        isRead: false,
        relatedEntities: [
          { type: 'location', id: 'waterfall', name: 'Crystal Waterfall' },
          { type: 'location', id: 'passage', name: 'Hidden Passage' }
        ],
        metadata: {
          tags: ['discovery', 'waterfall'],
          automaticEntry: true,
          narrativeSegmentId: 'segment-2'
        },
        updatedAt: '2023-01-01T12:15:00Z',
      },
      {
        worldId: 'enhanced-world-1',
        characterId: 'enhanced-char-1',
        type: 'combat',
        title: '',
        content: 'Defeated a group of bandits who attacked our caravan on the trade route. During the battle, they mentioned working for someone called "The Shadow" and carried strange coins with unknown markings.',
        significance: 'minor',
        isRead: false,
        relatedEntities: [
          { type: 'character', id: 'shadow', name: 'The Shadow' },
          { type: 'event', id: 'bandit-fight', name: 'Bandit Ambush' }
        ],
        metadata: {
          tags: ['combat', 'bandits'],
          automaticEntry: true,
          narrativeSegmentId: 'segment-3'
        },
        updatedAt: '2023-01-01T12:30:00Z',
      },
      {
        worldId: 'enhanced-world-1',
        characterId: 'enhanced-char-1',
        type: 'relationship_change',
        title: '',
        content: 'Helped Maya the merchant recover her stolen goods from the bandits and gained her trust. She offered valuable information about safe trade routes and hidden havens throughout the region.',
        significance: 'minor',
        isRead: false,
        relatedEntities: [
          { type: 'character', id: 'maya', name: 'Maya the Merchant' }
        ],
        metadata: {
          tags: ['relationship', 'merchant'],
          automaticEntry: true,
          narrativeSegmentId: 'segment-4'
        },
        updatedAt: '2023-01-01T12:45:00Z',
      },
      {
        worldId: 'enhanced-world-1',
        characterId: 'enhanced-char-1',
        type: 'achievement',
        title: '',
        content: 'Successfully completed the first major quest objective by retrieving the legendary Crystal of Ages from the depths of the Forgotten Temple. The crystal pulses with ancient magic and seems to respond to my presence.',
        significance: 'critical',
        isRead: false,
        relatedEntities: [
          { type: 'item', id: 'crystal-ages', name: 'Crystal of Ages' },
          { type: 'location', id: 'forgotten-temple', name: 'Forgotten Temple' }
        ],
        metadata: {
          tags: ['achievement', 'crystal'],
          automaticEntry: true,
          narrativeSegmentId: 'segment-5'
        },
        updatedAt: '2023-01-01T13:00:00Z',
      },
      {
        worldId: 'enhanced-world-1',
        characterId: 'enhanced-char-1',
        type: 'world_event',
        title: '',
        content: 'Witnessed the great awakening as ancient magic began to stir throughout the land, causing strange phenomena and awakening long-dormant creatures. The very fabric of reality seems to be changing.',
        significance: 'critical',
        isRead: false,
        relatedEntities: [],
        metadata: {
          tags: ['world-event', 'magic'],
          automaticEntry: true,
          narrativeSegmentId: 'segment-6'
        },
        updatedAt: '2023-01-01T13:15:00Z',
      }
    ];

    mockEntries.forEach(entry => {
      addEntry(sessionId, entry);
    });
  }, [addEntry, reset, sessionId]);

  const addTestEntry = () => {
    const testEntries = [
      {
        worldId: 'enhanced-world-1',
        characterId: 'enhanced-char-1',
        type: 'dialogue' as const,
        title: 'Conversation with the Oracle',
        content: 'Spoke with the mysterious Oracle who revealed cryptic clues about the Shadow\'s true identity and the location of the remaining artifacts.',
        significance: 'major' as const,
        isRead: false,
        relatedEntities: [],
        metadata: {
          tags: ['dialogue', 'oracle'],
          automaticEntry: true
        },
        updatedAt: '2023-01-01T14:00:00Z',
      },
      {
        worldId: 'enhanced-world-1',
        characterId: 'enhanced-char-1',
        type: 'discovery' as const,
        title: 'Ancient Library',
        content: 'Found a hidden library containing ancient texts about the lost civilization and their magical practices.',
        significance: 'minor' as const,
        isRead: false,
        relatedEntities: [],
        metadata: {
          tags: ['discovery', 'library'],
          automaticEntry: true
        },
        updatedAt: '2023-01-01T14:15:00Z',
      }
    ];
    
    const randomEntry = testEntries[Math.floor(Math.random() * testEntries.length)];
    addEntry(sessionId, randomEntry);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-2 border-amber-200">
        <div className="max-w-7xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-amber-900 mb-2">
            📖 Enhanced Journal UI Test Harness
          </h1>
          <p className="text-amber-700 mb-4">
            Issue #562: Complete testing environment for the enhanced book-like journal interface
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <Card className="p-3 bg-amber-50 border-amber-200">
              <div className="text-2xl font-bold text-amber-800">{entries.length}</div>
              <div className="text-sm text-amber-600">Journal Entries</div>
            </Card>
            <Card className="p-3 bg-orange-50 border-orange-200">
              <div className="text-2xl font-bold text-orange-800">
                {entries.filter(e => e.significance === 'critical').length}
              </div>
              <div className="text-sm text-orange-600">Critical Events</div>
            </Card>
            <Card className="p-3 bg-yellow-50 border-yellow-200">
              <div className="text-2xl font-bold text-yellow-800">
                {entries.filter(e => e.significance === 'major').length}
              </div>
              <div className="text-sm text-yellow-600">Major Events</div>
            </Card>
            <Card className="p-3 bg-blue-50 border-blue-200">
              <div className="text-2xl font-bold text-blue-800">
                {entries.filter(e => e.isRead === false).length}
              </div>
              <div className="text-sm text-blue-600">Unread Entries</div>
            </Card>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-6 mb-6 bg-white border-2 border-amber-200 shadow-lg">
          <h2 className="text-xl font-semibold text-amber-900 mb-4">🎮 Interactive Test Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Journal Controls */}
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Journal Actions</h3>
              <div className="space-y-2">
                <Button 
                  onClick={() => setIsJournalOpen(true)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Open Journal Modal
                </Button>
                <Button 
                  onClick={addTestEntry}
                  variant="outline"
                  className="w-full border-green-300 text-green-700 hover:bg-green-50"
                >
                  Add Random Entry
                </Button>
              </div>
            </div>

            {/* FAB Controls */}
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Floating Button</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Floating action button provides quick access to journal
                </p>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Keyboard Shortcuts</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Open Journal:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">J</code>
                </div>
                <div className="flex justify-between">
                  <span>Close Modal:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Esc</code>
                </div>
                <p className="text-xs mt-2">
                  Press &apos;J&apos; anywhere on this page to open the journal
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Feature Testing Guide */}
        <Card className="p-6 mb-6 bg-blue-50 border-2 border-blue-200">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">✅ Feature Testing Checklist</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-blue-800 mb-3">Visual Design Features</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500">🎨</span>
                  <span>Book-like amber theme with gradient backgrounds</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500">📋</span>
                  <span>Clean entry list layout without timestamps</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500">🏷️</span>
                  <span>Visual significance indicators (Critical/Major/Minor)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500">📱</span>
                  <span>Mobile-responsive design with touch-friendly controls</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500">✨</span>
                  <span>Smooth fade-in animations for modal transitions</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-blue-800 mb-3">Functional Features</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500">🎯</span>
                  <span>Floating action button with unread indicators</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500">⌨️</span>
                  <span>Keyboard shortcuts for quick access (J key)</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Testing Instructions */}
        <Card className="p-6 bg-green-50 border-2 border-green-200">
          <h2 className="text-xl font-semibold text-green-900 mb-4">🧪 Step-by-Step Testing Guide</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-green-800 mb-3">Manual Testing Steps</h3>
              <ol className="space-y-2 text-sm text-green-700 list-decimal list-inside">
                <li>Click the floating action button to open the journal</li>
                <li>Press &apos;J&apos; key to test keyboard shortcuts</li>
                <li>Add new entries and verify they appear correctly</li>
                <li>Test on mobile device for responsive design</li>
                <li>Verify accessibility with screen readers</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium text-green-800 mb-3">Expected Behaviors</h3>
              <ul className="space-y-2 text-sm text-green-700">
                <li>• Entries display in clean list format</li>
                <li>• Floating button shows/hides unread indicator</li>
                <li>• Keyboard shortcuts work from anywhere on page</li>
                <li>• Smooth animations enhance user experience</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Floating Action Button */}
      <JournalFloatingButton
        onClick={() => setIsJournalOpen(true)}
      />

      {/* Journal Modal */}
      <JournalModal
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        sessionId={sessionId}
      />

    </div>
  );
}