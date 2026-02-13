'use client';

import React from 'react';
import CharacterSummary from './CharacterSummary';
import { InventoryList } from '@/components/inventory/InventoryList';
import { EntityID } from '@/types/common.types';
import { Character } from '@/state/characterStore';

interface CharacterDrawerContentProps {
  character: Character;
}

export const CharacterDrawerContent: React.FC<CharacterDrawerContentProps> = ({ character }) => {
  return (
    <div className="space-y-6">
      <CharacterSummary character={character} initialExpanded={true} />
    </div>
  );
};

interface InventoryDrawerContentProps {
  characterId: EntityID;
}

export const InventoryDrawerContent: React.FC<InventoryDrawerContentProps> = ({ characterId }) => {
  return (
    <div className="space-y-6">
      <InventoryList characterId={characterId} />
    </div>
  );
};
