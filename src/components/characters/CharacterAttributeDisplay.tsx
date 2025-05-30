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
      <div className="text-gray-500 text-center py-4">
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
            <h4 className="text-lg font-semibold mb-3 text-gray-700 capitalize">
              {category} Attributes
            </h4>
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
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="text-sm font-medium text-gray-600 mb-1">
        {attribute.name}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {attribute.modifiedValue}
      </div>
      {attribute.baseValue !== attribute.modifiedValue && (
        <div className="text-xs text-gray-500">
          Base: {attribute.baseValue}
        </div>
      )}
    </div>
  );
}