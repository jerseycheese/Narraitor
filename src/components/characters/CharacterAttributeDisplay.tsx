'use client';

import React from 'react';

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
  if (attributes.length === 0) {
    return (
      <div >
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
      <div >
        {Object.entries(categorizedAttributes).map(([category, attrs]) => (
          <div key={category}>
            <h3 >
              {category}
            </h3>
            <div >
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
    <div >
      {attributes.map((attr, index) => (
        <AttributeItem key={attr.id || `attr-${index}`} attribute={attr} />
      ))}
    </div>
  );
}

function AttributeItem({ attribute }: { attribute: CharacterAttribute }) {
  return (
    <div >
      <div >
        {attribute.name}
      </div>
      <div >
        {attribute.modifiedValue}
      </div>
      {attribute.baseValue !== attribute.modifiedValue && (
        <div >
          Base: {attribute.baseValue}
        </div>
      )}
      {attribute.description && (
        <p >{attribute.description}</p>
      )}
    </div>
  );
}
