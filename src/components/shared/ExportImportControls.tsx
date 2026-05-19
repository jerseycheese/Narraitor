/**
 * ExportImportControls component
 * Provides UI for manual game state export and import functionality
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay/ErrorDisplay';
import { downloadGameState, importFromFile } from '@/lib/storage/exportService';

// Bound how big an import file can be before we even try to parse it.
// Game state saves are JSON and small; anything past 25 MB is almost certainly
// the wrong file (or hostile) and we shouldn't load it into memory.
const MAX_IMPORT_FILE_SIZE_BYTES = 25 * 1024 * 1024;

interface ExportImportControlsProps {
  className?: string;
}

export function ExportImportControls({ className = '' }: ExportImportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      await downloadGameState();
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

    const clearInput = () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    // The accept=".json" attribute is a UI hint only; users can still pick
    // anything via "All Files". Validate at the boundary before reading.
    if (!file.name.toLowerCase().endsWith('.json')) {
      showMessage('Import failed. Please choose a .json file.', 'error');
      clearInput();
      return;
    }

    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      const limitMb = Math.round(MAX_IMPORT_FILE_SIZE_BYTES / (1024 * 1024));
      showMessage(`Import failed. File exceeds ${limitMb} MB limit.`, 'error');
      clearInput();
      return;
    }

    setIsImporting(true);

    try {
      const result = await importFromFile(file);

      if (result.success) {
        showMessage(result.message || 'Import successful', 'success');
      } else {
        showMessage(result.error || 'Import failed', 'error');
      }
    } catch {
      showMessage('Import failed. Please check the file format.', 'error');
    } finally {
      setIsImporting(false);
      clearInput();
    }
  };

  const isLoading = isExporting || isImporting;

  return (
    <div className={`settings-export-import ${className}`.trim()}>
      <div className="settings-export-import-actions">
        <Button
          onClick={handleExport}
          disabled={isLoading}
          variant="outline"

        >
          {isExporting ? 'Exporting...' : 'Export Game Data'}
        </Button>

        <div className="settings-export-import-files">
          <label htmlFor="import-file" >
            Import Game Data
          </label>
          <input
            id="import-file"
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={isLoading}

            aria-label="Import game data from file"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            variant="outline"

          >
            {isImporting ? 'Importing...' : 'Import Game Data'}
          </Button>
        </div>
      </div>

      {message && (
        <ErrorDisplay
          variant="section"
          severity={messageType === 'success' ? 'info' : 'error'}
          message={message}
          showDismiss={true}
          onDismiss={() => setMessage(null)}
        />
      )}

      <div className="settings-export-import-help">
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