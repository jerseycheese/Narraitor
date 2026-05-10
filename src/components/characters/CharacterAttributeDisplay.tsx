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
      <div className="component-character-attribute-display">
        <div className="character-display-empty">
          No attributes assigned to this character.
        </div>
      </div>
    );
  }

  if (showCategories) {
    const categorizedAttributes = attributes.reduce((acc, attr) => {
      const category = attr.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(attr);
      return acc;
    }, {} as Record<string, CharacterAttribute[]>);

    return (
      <div className="component-character-attribute-display">
        <div className="character-attribute-categories">
          {Object.entries(categorizedAttributes).map(([category, attrs]) => (
            <div key={category} className="character-attribute-category">
              <h3 className="character-attribute-category-heading">
                {category}
              </h3>
              <div className="character-attribute-grid">
                {attrs.map((attr, index) => (
                  <AttributeItem key={attr.id || `attr-${category}-${index}`} attribute={attr} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="component-character-attribute-display">
      <div className="character-attribute-grid">
        {attributes.map((attr, index) => (
          <AttributeItem key={attr.id || `attr-${index}`} attribute={attr} />
        ))}
      </div>
    </div>
  );
}

function AttributeItem({ attribute }: { attribute: CharacterAttribute }) {
  return (
    <div className="character-attribute-card">
      <div className="character-attribute-name">
        {attribute.name}
      </div>
      <div className="character-attribute-value">
        {attribute.modifiedValue}
      </div>
      {attribute.baseValue !== attribute.modifiedValue && (
        <div className="character-attribute-base">
          Base: {attribute.baseValue}
        </div>
      )}
      {attribute.description && (
        <p className="character-attribute-description">{attribute.description}</p>
      )}
    </div>
  );
}
