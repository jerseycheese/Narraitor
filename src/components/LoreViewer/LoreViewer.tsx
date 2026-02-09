/**
 * Read-Only Lore Viewer Component
 * Displays established facts for player reference
 */

import React from 'react';
import { useLoreStore } from '@/state/loreStore';
import type { LoreCategory } from '@/types';

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
    characters: 'bg-lore-characters-bg',
    locations: 'bg-lore-locations-bg',
    events: 'bg-lore-events-bg',
    rules: 'bg-lore-rules-bg'
  };

  if (facts.length === 0) {
    return (
      <div className={`${className}`}>
        <p>No lore facts recorded yet.</p>
        <p>Facts will appear here as the story unfolds.</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <h3>Established Lore</h3>
      
      {(Object.keys(categoryLabels) as LoreCategory[]).map(category => {
        const categoryFacts = factsByCategory[category];
        if (!categoryFacts || categoryFacts.length === 0) return null;

        return (
          <div key={category} className={`${categoryColors[category]}`}>
            <h4>{categoryLabels[category]}</h4>
            <ul>
              {categoryFacts.map(fact => (
                <li key={fact.id} >
                  <span>{fact.value}</span>
                  {fact.aliases && fact.aliases.length > 0 && (
                    <span>
                      (also: {fact.aliases.join(',')})
                    </span>
                  )}
                  {fact.metadata?.description && (
                    <p>
                      {fact.metadata.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      
      <div>
        Total facts: {facts.length}
      </div>
    </div>
  );
};
