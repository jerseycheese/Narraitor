'use client';

import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry } from '@/types/journal.types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { exportJournalToMarkdown, exportJournalToText, copyJournalToClipboard } from '@/lib/utils/journalExport';
import { cn } from '@/lib/utils/classNames';

interface SharePreviewProps {
  entries: JournalEntry[];
  storyTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Component for previewing and sharing journal stories
 * Provides formatted preview and sharing options for completed stories
 */
export const SharePreview: React.FC<SharePreviewProps> = ({
  entries,
  storyTitle,
  isOpen,
  onClose,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<'markdown' | 'text'>('text');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleCopyToClipboard = async () => {
    try {
      await copyJournalToClipboard(entries, storyTitle, previewFormat);
      setCopySuccess(true);
      
      // Clear existing timeout if any
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout and store reference
      timeoutRef.current = setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const previewContent = previewFormat === 'markdown' 
    ? exportJournalToMarkdown(entries, storyTitle)
    : exportJournalToText(entries, storyTitle);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <Card 
        className="bg-white rounded-lg max-w-4xl w-full m-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-preview-title"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 id="share-preview-title" className="text-2xl font-bold text-gray-800">
            Share Your Story
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            aria-label="Close share preview"
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
        </div>

        {/* Format Toggle */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex gap-2">
            <Button
              onClick={() => setPreviewFormat('text')}
              variant={previewFormat === 'text' ? 'default' : 'outline'}
              size="sm"
            >
              Plain Text
            </Button>
            <Button
              onClick={() => setPreviewFormat('markdown')}
              variant={previewFormat === 'markdown' ? 'default' : 'outline'}
              size="sm"
            >
              Markdown
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-gray-50 rounded-lg p-4 border">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
              {previewContent}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
          <Button
            onClick={handleCopyToClipboard}
            variant="outline"
            className={cn(
              'transition-colors',
              copySuccess && 'bg-green-50 border-green-200 text-green-700'
            )}
          >
            {copySuccess ? '✓ Copied!' : 'Copy to Clipboard'}
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Copy Success Message */}
        {copySuccess && (
          <div className="absolute top-4 right-4 bg-green-100 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
            Copied to clipboard!
          </div>
        )}
      </Card>
    </div>
  );
};