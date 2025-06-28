/**
 * ExportImportControls component
 * Provides UI for manual game state export and import functionality
 */

import React, { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { ExportService } from '../../lib/storage/exportService';

interface ExportImportControlsProps {
  className?: string;
}

export function ExportImportControls({ className = '' }: ExportImportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportService = new ExportService();

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    
    // Clear message after 5 seconds
    setTimeout(() => {
      setMessage(null);
    }, 5000);
  };

  const handleExport = async () => {
    if (isExporting || isImporting) return;

    setIsExporting(true);
    
    try {
      await exportService.downloadGameState();
      showMessage('Export completed successfully', 'success');
    } catch {
      showMessage('Export failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const result = await exportService.importFromFile(file);
      
      if (result.success) {
        showMessage(result.message || 'Import successful', 'success');
      } else {
        showMessage(result.error || 'Import failed', 'error');
      }
    } catch {
      showMessage('Import failed. Please check the file format.', 'error');
    } finally {
      setIsImporting(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isLoading = isExporting || isImporting;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleExport}
          disabled={isLoading}
          variant="outline"
          className="flex-1"
        >
          {isExporting ? 'Exporting...' : 'Export Game Data'}
        </Button>

        <div className="flex-1">
          <label htmlFor="import-file" className="sr-only">
            Import Game Data
          </label>
          <input
            id="import-file"
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={isLoading}
            className="hidden"
            aria-label="Import game data from file"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isImporting ? 'Importing...' : 'Import Game Data'}
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            messageType === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
          role="alert"
        >
          {message}
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>
          <strong>Export:</strong> Creates a backup file of your complete game state including worlds, characters, and progress.
        </p>
        <p>
          <strong>Import:</strong> Restores game state from a previously exported backup file. This will replace your current data.
        </p>
      </div>
    </div>
  );
}