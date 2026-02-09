/**
 * ExportImportControls component
 * Provides UI for manual game state export and import functionality
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay/ErrorDisplay';
import { ExportService } from '@/lib/storage/exportService';

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
    <div className={`${className}`}>
      <div >
        <Button
          onClick={handleExport}
          disabled={isLoading}
          variant=""
          
        >
          {isExporting ? 'Exporting...' : 'Export Game Data'}
        </Button>

        <div >
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
            variant=""
            
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

      <div >
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