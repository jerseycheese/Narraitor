'use client';

import React from 'react';
import { CategorizedList } from '../shared/CategorizedList';

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

export function CharacterAttributeDisplay({ attributes, showCategories = false }: CharacterAttributeDisplayProps) {
  return (
    <CategorizedList
      items={attributes}
      emptyMessage="No attributes assigned to this character."
      showCategories={showCategories}
      renderItem={(attr) => <AttributeItem attribute={attr} />}
      itemKeyPrefix="attr"
    />
  );
}

function AttributeItem({ attribute }: { attribute: CharacterAttribute }) {
  return (
    <div className="bg-muted rounded-lg p-4 border">
      <div className="text-sm font-medium text-muted-foreground mb-1">
        {attribute.name}
      </div>
      <div className="text-2xl font-bold">
        {attribute.modifiedValue}
      </div>
      {attribute.baseValue !== attribute.modifiedValue && (
        <div className="text-xs text-muted-foreground mb-2">
          Base: {attribute.baseValue}
        </div>
      )}
      {attribute.description && (
        <p className="text-xs text-muted-foreground">{attribute.description}</p>
      )}
    </div>
  );
}
