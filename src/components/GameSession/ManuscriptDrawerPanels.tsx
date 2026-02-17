'use client';

import React from 'react';
import CharacterSummary from './CharacterSummary';
import { InventoryList } from '@/components/inventory/InventoryList';
import { StorySummarySection } from './StorySummarySection';
import { ChoiceHistorySection } from './ChoiceHistorySection';
import { useJournalStore } from '@/state/journalStore';
import { useShallow } from 'zustand/react/shallow';
import { EntityID } from '@/types/common.types';
import { Character } from '@/state/characterStore';
import { titleCase, capitalize } from '@/lib/utils';

interface CharacterDrawerContentProps {
  character: Character;
}

export const CharacterDrawerContent: React.FC<CharacterDrawerContentProps> = ({ character }) => {
  return (
    <div className="manuscript-drawer-panel-section">
      <CharacterSummary character={character} variant="drawer" />
    </div>
  );
};

interface InventoryDrawerContentProps {
  characterId: EntityID;
}

export const InventoryDrawerContent: React.FC<InventoryDrawerContentProps> = ({ characterId }) => {
  return (
    <div className="manuscript-drawer-panel-section">
      <InventoryList characterId={characterId} />
    </div>
  );
};

interface StorySummaryDrawerContentProps {
  worldId: string;
  sessionId: string;
  characterId?: string;
}

export const StorySummaryDrawerContent: React.FC<StorySummaryDrawerContentProps> = ({
  worldId,
  sessionId,
  characterId,
}) => {
  return (
    <div className="manuscript-drawer-panel-section">
      <StorySummarySection
        worldId={worldId}
        sessionId={sessionId}
        characterId={characterId}
      />
    </div>
  );
};

interface ChoiceHistoryDrawerContentProps {
  sessionId: string;
}

export const ChoiceHistoryDrawerContent: React.FC<ChoiceHistoryDrawerContentProps> = ({
  sessionId,
}) => {
  return (
    <div className="manuscript-drawer-panel-section">
      <ChoiceHistorySection sessionId={sessionId} />
    </div>
  );
};

interface JournalSnapshotDrawerContentProps {
  sessionId: string;
}

const JOURNAL_SNAPSHOT_LIMIT = 5;

const formatEntryHeading = (title: string, type: string): string => {
  if (title.trim().length > 0) {
    return title;
  }
  return titleCase(type.replace(/_/g, ' '));
};

const formatEntryTimestamp = (createdAt: string): string => {
  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return createdAt;
  }
  return parsedDate.toLocaleString();
};

export const JournalSnapshotDrawerContent: React.FC<JournalSnapshotDrawerContentProps> = ({
  sessionId,
}) => {
  const entries = useJournalStore(useShallow((state) => state.getSessionEntries(sessionId)));
  const snapshotEntries = entries.slice(0, JOURNAL_SNAPSHOT_LIMIT);

  return (
    <div className="manuscript-drawer-panel-section">
      {snapshotEntries.length === 0 ? (
        <p className="manuscript-journal-snapshot-empty">
          No journal entries found for this session.
        </p>
      ) : (
        <div className="manuscript-journal-snapshot-list">
          {snapshotEntries.map((entry) => {
            const relatedLabel = entry.relatedEntities
              .map((entity) => entity.name)
              .filter(Boolean)
              .join(', ');

            return (
              <article key={entry.id} className="manuscript-journal-snapshot-entry">
                <div className="manuscript-journal-snapshot-header">
                  <h4 className="manuscript-journal-snapshot-title">
                    {formatEntryHeading(entry.title, entry.type)}
                  </h4>
                  <div className="manuscript-journal-snapshot-badges">
                    {!entry.isRead && (
                      <span className="manuscript-journal-snapshot-badge manuscript-journal-snapshot-badge-new">
                        New
                      </span>
                    )}
                    <span className="manuscript-journal-snapshot-badge">
                      {capitalize(entry.significance)}
                    </span>
                  </div>
                </div>
                <p className="manuscript-journal-snapshot-content">{entry.content}</p>
                <div className="manuscript-journal-snapshot-meta">
                  <span>{formatEntryTimestamp(entry.createdAt)}</span>
                  {relatedLabel && <span>{relatedLabel}</span>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

type DrawerType =
  | 'character'
  | 'inventory'
  | 'story-summary'
  | 'choice-history'
  | 'journal';

interface ToolsMenuPanelContentProps {
  activeDrawer: DrawerType | null;
  onOpenDrawer: (drawerType: DrawerType) => void;
  onClosePanel: () => void;
  onOpenJournalRoute: () => void;
}

export const ToolsMenuPanelContent: React.FC<ToolsMenuPanelContentProps> = ({
  activeDrawer,
  onOpenDrawer,
  onClosePanel,
  onOpenJournalRoute,
}) => {
  const drawerButtons: Array<{
    id: DrawerType;
    label: string;
  }> = [
    { id: 'character', label: 'Character Details' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'story-summary', label: 'Story So Far' },
    { id: 'choice-history', label: 'Choice History' },
    { id: 'journal', label: 'Journal Snapshot' },
  ];

  return (
    <>
      <div className="manuscript-hud-panel-title">Tools</div>

      <div className="manuscript-tools-menu-items">
        {drawerButtons.map((button) => (
          <button
            key={button.id}
            className={`manuscript-tools-menu-item ${
              activeDrawer === button.id ? 'manuscript-tools-menu-item-active' : ''
            }`}
            onClick={() => {
              onOpenDrawer(button.id);
            }}
            aria-pressed={activeDrawer === button.id}
          >
            {button.label}
          </button>
        ))}

        <button
          className="manuscript-tools-menu-item manuscript-tools-menu-item-secondary"
          onClick={() => {
            onClosePanel();
            onOpenJournalRoute();
          }}
        >
          Open Journal
        </button>
      </div>
    </>
  );
};
