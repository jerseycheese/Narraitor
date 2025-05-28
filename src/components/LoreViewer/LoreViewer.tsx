/**
 * Read-Only Lore Viewer Component
 * Displays established facts for player reference
 */

import React from 'react';
import { useLoreStore } from '../../state/loreStore';
import type { LoreCategory } from '../../types';

interface LoreViewerProps {
  worldId: string;
  sessionId?: string;
  className?: string;
}

export const LoreViewer: React.FC<LoreViewerProps> = ({ 
  worldId, 
  sessionId,
  className = '' 
}) => {
  const { getFacts } = useLoreStore();
  
  // Get facts for this world/session
  const facts = getFacts({ worldId, sessionId });
  
  // Group facts by category
  const factsByCategory = facts.reduce((acc, fact) => {
    if (!acc[fact.category]) {
      acc[fact.category] = [];
    }
    acc[fact.category].push(fact);
    return acc;
  }, {} as Record<LoreCategory, typeof facts>);

  const categoryLabels: Record<LoreCategory, string> = {
    characters: 'Characters',
    locations: 'Locations', 
    events: 'Events',
    rules: 'World Rules'
  };

  const categoryColors: Record<LoreCategory, string> = {
    characters: 'bg-blue-50 border-blue-200',
    locations: 'bg-green-50 border-green-200',
    events: 'bg-purple-50 border-purple-200',
    rules: 'bg-orange-50 border-orange-200'
  };

  if (facts.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>No lore facts recorded yet.</p>
        <p className="text-sm mt-2">Facts will appear here as the story unfolds.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Established Lore</h3>
      
      {(Object.keys(categoryLabels) as LoreCategory[]).map(category => {
        const categoryFacts = factsByCategory[category];
        if (!categoryFacts || categoryFacts.length === 0) return null;

        return (
          <div key={category} className={`rounded-lg border p-4 ${categoryColors[category]}`}>
            <h4 className="font-medium text-gray-900 mb-3">{categoryLabels[category]}</h4>
            <ul className="space-y-2">
              {categoryFacts.map(fact => (
                <li key={fact.id} className="text-sm text-gray-700">
                  <span className="font-medium">{fact.key}:</span> {fact.value}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      
      <div className="text-xs text-gray-500 mt-4">
        Total facts: {facts.length}
      </div>
    </div>
  );
};