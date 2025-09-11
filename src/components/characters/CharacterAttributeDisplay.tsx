'use client';

import React from 'react';

interface CharacterAttribute {
  id: string;
  characterId: string;
  name: string;
  baseValue: number;
  modifiedValue: number;
  category?: string;
}

interface CharacterAttributeDisplayProps {
  attributes: CharacterAttribute[];
  showCategories?: boolean;
}

export function CharacterAttributeDisplay({ attributes, showCategories = false }: CharacterAttributeDisplayProps) {
  if (attributes.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-4">
        No attributes assigned to this character.
      </div>
    );
  }

  if (showCategories) {
    // Group attributes by category
    const categorizedAttributes = attributes.reduce((acc, attr) => {
      const category = attr.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(attr);
      return acc;
    }, {} as Record<string, CharacterAttribute[]>);

    return (
      <div className="space-y-6">
        {Object.entries(categorizedAttributes).map(([category, attrs]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-3 text-foreground capitalize">
              {category} Attributes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {attrs.map((attr, index) => (
                <AttributeItem key={attr.id || `attr-${category}-${index}`} attribute={attr} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {attributes.map((attr, index) => (
        <AttributeItem key={attr.id || `attr-${index}`} attribute={attr} />
      ))}
    </div>
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
        <div className="text-xs text-muted-foreground">
          Base: {attribute.baseValue}
        </div>
      )}
    </div>
  );
}
