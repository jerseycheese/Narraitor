'use client';

import React from 'react';
import { CharacterPropertyGrid } from './CharacterPropertyGrid';

interface CharacterAttribute {
  id: string;
  characterId: string;
  name: string;
  baseValue: number;
  modifiedValue: number;
  category?: string;
  description?: string;
}

interface CharacterAttributeDisplayProps {
  attributes: CharacterAttribute[];
  showCategories?: boolean;
}

export function CharacterAttributeDisplay({
  attributes,
  showCategories = false,
}: CharacterAttributeDisplayProps) {
  return (
    <CharacterPropertyGrid
      items={attributes}
      kind="attribute"
      emptyText="No attributes assigned to this character."
      showCategories={showCategories}
      renderItem={(attribute) => (
        <div className="character-attribute-card">
          <div className="character-attribute-name">{attribute.name}</div>
          <div className="character-attribute-value">{attribute.modifiedValue}</div>
          {attribute.baseValue !== attribute.modifiedValue && (
            <div className="character-attribute-base">Base: {attribute.baseValue}</div>
          )}
          {attribute.description && (
            <p className="character-attribute-description">{attribute.description}</p>
          )}
        </div>
      )}
    />
  );
}
