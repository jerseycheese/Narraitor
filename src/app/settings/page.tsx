'use client';

import { PageLayout } from '@/components/shared/PageLayout';
import { ExportImportControls } from '@/components/shared/ExportImportControls';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

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
      <div>
        <section>
          <h2>Data Management</h2>
          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>
                Create backups of your worlds, characters, and game progress.
                Export generates a downloadable JSON file containing all your
                data, and import restores from a previously exported backup
                file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExportImportControls />
            </CardContent>
          </Card>
        </section>
      </div>
    </PageLayout>
  );
}
