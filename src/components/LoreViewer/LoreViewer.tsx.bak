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
    characters: 'bg-lore-characters-bg border-lore-characters-border text-lore-characters-text',
    locations: 'bg-lore-locations-bg border-lore-locations-border text-lore-locations-text',
    events: 'bg-lore-events-bg border-lore-events-border text-lore-events-text',
    rules: 'bg-lore-rules-bg border-lore-rules-border text-lore-rules-text'
  };

  if (facts.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        <p>No lore facts recorded yet.</p>
        <p className="text-sm mt-2">Facts will appear here as the story unfolds.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-lg font-semibold text-foreground">Established Lore</h3>
      
      {(Object.keys(categoryLabels) as LoreCategory[]).map(category => {
        const categoryFacts = factsByCategory[category];
        if (!categoryFacts || categoryFacts.length === 0) return null;

        return (
          <div key={category} className={`rounded-lg border p-4 ${categoryColors[category]}`}>
            <h4 className="font-medium mb-3">{categoryLabels[category]}</h4>
            <ul className="space-y-2">
              {categoryFacts.map(fact => (
                <li key={fact.id} className="text-sm">
                  <span className="font-medium">{fact.value}</span>
                  {fact.aliases && fact.aliases.length > 0 && (
                    <span className="text-muted-foreground text-xs ml-2">
                      (also: {fact.aliases.join(', ')})
                    </span>
                  )}
                  {fact.metadata?.description && (
                    <p className="text-muted-foreground text-xs mt-1">
                      {fact.metadata.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      
      <div className="text-xs text-muted-foreground mt-4">
        Total facts: {facts.length}
      </div>
    </div>
  );
};
