'use client';

import Link from 'next/link';
import { PageLayout } from '@/components/shared/PageLayout';
import { ExportImportControls } from '@/components/shared/ExportImportControls';
import { ThemeMenu } from '@/components/Navigation/ThemeMenu';
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
      {/* Settings Sections */}
      <div className="settings-page">
        <section className="settings-section">
          <h2>Providers</h2>
          <Card className="settings-card">
            <CardHeader>
              <CardTitle>Generation provider</CardTitle>
              <CardDescription>
                Connect the provider key used to generate your stories. It stays
                in this browser, encrypted, and is only ever used to make your
                own requests.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/settings/providers"
                className="button button-default button-size-default"
              >
                Manage providers
              </Link>
            </CardContent>
          </Card>
        </section>

        <section className="settings-section">
          <h2>Appearance</h2>
          <Card className="settings-card">
            <CardHeader>
              <CardTitle>Color mode</CardTitle>
              <CardDescription>
                Choose light, dark, or system mode. Your choice is saved in this
                browser and applies across the app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="settings-appearance-row">
                <span className="settings-appearance-label">Appearance</span>
                <ThemeMenu />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="settings-section">
          <h2>Data Management</h2>
          <Card className="settings-card">
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
