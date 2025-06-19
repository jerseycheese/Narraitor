'use client';

import React, { useState, useMemo } from 'react';
import { useJournalStore } from '@/state/journalStore';
import { EntityID } from '@/types/common.types';
import { JournalEntry } from '@/types/journal.types';
import { EntityBadge } from '@/components/shared/cards/EntityBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { SharePreview } from './SharePreview';
import { exportJournalAsMarkdownFile, exportJournalAsTextFile } from '@/lib/utils/journalExport';
import { cn } from '@/lib/utils/cn';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: EntityID;
}

/**
 * Enhanced JournalModal with book-like interface and sharing capabilities
 * Implements all features from Issue #562 for enhanced journal UI
 */
export const JournalModal: React.FC<JournalModalProps> = ({
  isOpen,
  onClose,
  sessionId,
}) => {
  const { getSessionEntries } = useJournalStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState<'markdown' | 'text'>('markdown');
  
  // Don't render if not open
  if (!isOpen) return null;

  // Get entries for this session
  const entries = getSessionEntries(sessionId);
  
  // Filter entries based on search term
  const filteredEntries = useMemo(() => {
    if (!searchTerm) return entries;
    
    return entries.filter(entry => 
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [entries, searchTerm]);
  
  // Group entries by date for better organization
  const groupedEntries = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    
    filteredEntries.forEach(entry => {
      const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });
    
    return groups;
  }, [filteredEntries]);
  
  const handleExport = () => {
    const storyTitle = `Session ${sessionId} - Journal`;
    
    if (selectedExportFormat === 'markdown') {
      exportJournalAsMarkdownFile(entries, storyTitle);
    } else {
      exportJournalAsTextFile(entries, storyTitle);
    }
  };
  
  const handleShare = () => {
    setShowSharePreview(true);
  };
  
  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'major': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'minor': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      {/* Enhanced Modal with book-like design */}
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
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 id="journal-modal-title" className="text-2xl font-bold text-amber-900">My Adventure Journal</h2>
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
          
          {/* Search and Actions Bar */}
          <div className="p-4 border-b border-amber-200 bg-amber-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border-amber-200 focus:border-amber-400"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Export
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Content with enhanced book-like styling */}
          <div className="flex-1 overflow-auto p-6">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 mx-auto bg-amber-200 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-amber-700 text-lg">Your journal awaits your first entry</p>
                <p className="text-amber-600 text-sm">Stories will appear here as your adventure unfolds</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedEntries).map(([date, dateEntries]) => (
                  <div key={date} className="border-l-4 border-amber-300 pl-4">
                    <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      {date}
                    </h3>
                    <div className="space-y-4">
                      {dateEntries.map(entry => (
                        <Card 
                          key={entry.id} 
                          className="p-4 bg-white border border-amber-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          {entry.title && (
                            <h4 className="font-semibold text-amber-900 mb-2">{entry.title}</h4>
                          )}
                          <p className="text-gray-700 leading-relaxed mb-3">{entry.content}</p>
                          
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className={cn(
                              'px-2 py-1 rounded-full text-xs font-medium border',
                              getSignificanceColor(entry.significance)
                            )}>
                              {entry.significance.charAt(0).toUpperCase() + entry.significance.slice(1)}
                            </span>
                            <EntityBadge 
                              text={entry.type.replace('_', ' ')}
                              variant="info"
                              size="sm"
                            />
                            <span className="text-amber-600 text-xs">
                              {new Date(entry.createdAt).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                            {entry.metadata.tags.length > 0 && (
                              <div className="flex gap-1 ml-auto">
                                {entry.metadata.tags.map(tag => (
                                  <span 
                                    key={tag}
                                    className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Share Preview Modal */}
      <SharePreview
        entries={entries}
        storyTitle={`Session ${sessionId} - Adventure Journal`}
        isOpen={showSharePreview}
        onClose={() => setShowSharePreview(false)}
      />
    </>
  );
};