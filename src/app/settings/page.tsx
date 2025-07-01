'use client';

import { PageLayout } from '@/components/shared/PageLayout';
import { ExportImportControls } from '@/components/shared/ExportImportControls';

/**
 * SettingsPage - Application settings and configuration
 * 
 * Provides access to application-wide settings including data management
 * through export/import functionality for backing up and restoring game data.
 * 
 * Features:
 * - Data export/import for backup and restore
 * - Clear user guidance on backup functionality
 * - Accessible and responsive design
 * 
 * @returns Settings page with data management controls
 */
export default function SettingsPage() {
  return (
    <PageLayout
      title="Settings"
      description="Manage your application settings and backup your game data. Export creates a downloadable backup file, and import restores your data from a previously exported file."
    >
      {/* Data Management Section */}
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Management</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Backup & Restore</h3>
              <p className="text-gray-600 text-sm mb-4">
                Create backups of your worlds, characters, and game progress. 
                Export generates a downloadable JSON file containing all your data, 
                and import restores from a previously exported backup file.
              </p>
            </div>
            
            <ExportImportControls className="max-w-none" />
          </div>
        </section>
      </div>
    </PageLayout>
  );
}