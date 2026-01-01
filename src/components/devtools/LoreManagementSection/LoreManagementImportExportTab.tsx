import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface LoreManagementImportExportTabProps {
  exportedData: string | null;
  showImportDialog: boolean;
  importData: string;
  onExport: () => void;
  onImport: () => void;
  onShowImportDialog: (value: boolean) => void;
  onImportDataChange: (value: string) => void;
}

export const LoreManagementImportExportTab: React.FC<LoreManagementImportExportTabProps> = ({
  exportedData,
  showImportDialog,
  importData,
  onExport,
  onImport,
  onShowImportDialog,
  onImportDataChange,
}) => (
  <div className="space-y-4">
    <div>
      <h3 className="font-semibold mb-2">Export Facts</h3>
      <Button onClick={onExport}>Export to JSON</Button>
      {exportedData && (
        <div className="mt-2">
          <div className="text-sm text-gray-700 mb-1">Exported data (copied to clipboard):</div>
          <pre className="p-2 bg-gray-100 rounded text-xs overflow-auto max-h-48">{exportedData}</pre>
        </div>
      )}
    </div>

    <div>
      <h3 className="font-semibold mb-2">Import Facts</h3>
      {!showImportDialog ? (
        <Button onClick={() => onShowImportDialog(true)}>Import from JSON</Button>
      ) : (
        <div className="space-y-2">
          <Textarea
            className="w-full h-48 font-mono text-sm"
            placeholder="Paste JSON data here..."
            value={importData}
            onChange={(e) => onImportDataChange(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={onImport}>Confirm Import</Button>
            <Button
              variant="outline"
              onClick={() => {
                onShowImportDialog(false);
                onImportDataChange('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  </div>
);
