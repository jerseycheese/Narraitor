'use client';

import Link from 'next/link';
import { PageLayout } from '@/components/shared/PageLayout';
import { ExportImportControls } from '@/components/shared/ExportImportControls';
import { DarkModeToggle } from '@/components/Navigation/DarkModeToggle';

/**
 * SettingsPage - Application settings and configuration
 *
 * Provides access to application-wide settings including generation provider
 * connection, appearance color mode, and data management backup/restore.
 *
 * Rendered as open document-like sections with dotted heading dividers per
 * DS3 Mechanical Manuscript and the one-border-deep rule.
 */
export default function SettingsPage() {
  return (
    <PageLayout
      title="Settings"
      description="Manage your settings and back up your game data."
    >
      <div className="settings-page">
        <section className="settings-section">
          <h2>Providers</h2>
          <p className="settings-section-description">
            Connect the provider key used to generate your stories. It stays
            in this browser, encrypted, and is only ever used to make your
            own requests.
          </p>
          <div className="settings-section-actions">
            <Link
              href="/settings/providers"
              className="button button-default button-size-default"
            >
              Manage providers
            </Link>
          </div>
        </section>

        <section className="settings-section">
          <h2>Appearance</h2>
          <p className="settings-section-description">
            Choose light, dark, or system mode. Your choice is saved in this
            browser and applies across the app.
          </p>
          <div className="settings-appearance-row">
            <DarkModeToggle showLabels />
          </div>
        </section>

        <section className="settings-section">
          <h2>Data Management</h2>
          <p className="settings-section-description">
            Backup and restore your worlds, characters, and game progress.
          </p>
          <ExportImportControls />
        </section>
      </div>
    </PageLayout>
  );
}
