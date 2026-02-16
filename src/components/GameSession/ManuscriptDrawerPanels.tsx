'use client';

import React from 'react';
import CharacterSummary from './CharacterSummary';
import { InventoryList } from '@/components/inventory/InventoryList';
import { StorySummarySection } from './StorySummarySection';
import { ChoiceHistorySection } from './ChoiceHistorySection';
import { EntityID } from '@/types/common.types';
import { Character } from '@/state/characterStore';

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

type DrawerType = 'character' | 'inventory' | 'story-summary' | 'choice-history';

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
