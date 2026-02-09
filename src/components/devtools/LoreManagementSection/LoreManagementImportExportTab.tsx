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
  <div>
    <div>
      <h3>Export Facts</h3>
      <Button onClick={onExport}>Export to JSON</Button>
      {exportedData && (
        <div>
          <div>Exported data (copied to clipboard):</div>
          <pre>{exportedData}</pre>
        </div>
      )}
    </div>

    <div>
      <h3>Import Facts</h3>
      {!showImportDialog ? (
        <Button onClick={() => onShowImportDialog(true)}>Import from JSON</Button>
      ) : (
        <div>
          <Textarea
            
            placeholder="Paste JSON data here..."
            value={importData}
            onChange={(e) => onImportDataChange(e.target.value)}
          />
          <div>
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
