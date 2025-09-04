/**
 * ExportImportControls component
 * Provides UI for manual game state export and import functionality
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay/ErrorDisplay';
import { ExportService } from '@/lib/storage/exportService';
import { useAsyncOperation } from '@/lib/hooks/useAsyncOperation';

interface ExportImportControlsProps {
  className?: string;
}

export function ExportImportControls({ className = '' }: ExportImportControlsProps) {
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

  // Async operation hook for export
  const exportOperation = useAsyncOperation(
    async () => {
      await exportService.downloadGameState();
      return 'success';
    },
    {
      onSuccess: () => {
        showMessage('Export completed successfully', 'success');
      },
      onError: () => {
        showMessage('Export failed. Please try again.', 'error');
      }
    }
  );

  // Async operation hook for import
  const importOperation = useAsyncOperation(
    async (file: File) => {
      const result = await exportService.importFromFile(file);
      return result;
    },
    {
      onSuccess: (result) => {
        if (result.success) {
          showMessage(result.message || 'Import successful', 'success');
        } else {
          showMessage(result.error || 'Import failed', 'error');
        }
      },
      onError: () => {
        showMessage('Import failed. Please check the file format.', 'error');
      },
      onSettled: () => {
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  );

  const handleExport = () => {
    if (exportOperation.isLoading || importOperation.isLoading) return;
    exportOperation.execute();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    importOperation.execute(file);
  };

  const isLoading = exportOperation.isLoading || importOperation.isLoading;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleExport}
          disabled={isLoading}
          variant="outline"
          className="flex-1"
        >
          {exportOperation.isLoading ? 'Exporting...' : 'Export Game Data'}
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
            {importOperation.isLoading ? 'Importing...' : 'Import Game Data'}
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