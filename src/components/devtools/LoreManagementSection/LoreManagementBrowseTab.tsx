import React from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import type { LoreCategory, LoreFact } from '@/types/lore.types';
import type { EntityID } from '@/types/common.types';

interface LoreManagementBrowseTabProps {
  categoryFilter: LoreCategory | '';
  onCategoryFilterChange: (value: LoreCategory | '') => void;
  sessionFilter: 'all' | 'current' | EntityID;
  onSessionFilterChange: (value: 'all' | 'current' | EntityID) => void;
  visibilityFilter: 'all' | 'session-private' | 'world-shared';
  onVisibilityFilterChange: (value: 'all' | 'session-private' | 'world-shared') => void;
  currentSessionId?: EntityID;
  currentSessionWorldId?: EntityID;
  selectedWorldId: EntityID;
  sessionOptions: EntityID[];
  facts: LoreFact[];
  factsByCategory: Record<LoreCategory, LoreFact[]>;
  categoryColors: Record<LoreCategory, string>;
  visibilityStats: {
    total: number;
    worldShared: number;
    sessionPrivate: number;
    narrativeWorldShared: number;
    narrativeSessionPrivate: number;
  };
  onSelectFact: (id: EntityID) => void;
  onDeleteFact: (id: EntityID) => void;
}

export const LoreManagementBrowseTab: React.FC<LoreManagementBrowseTabProps> = ({
  categoryFilter,
  onCategoryFilterChange,
  sessionFilter,
  onSessionFilterChange,
  visibilityFilter,
  onVisibilityFilterChange,
  currentSessionId,
  currentSessionWorldId,
  selectedWorldId,
  sessionOptions,
  facts,
  factsByCategory,
  categoryColors,
  visibilityStats,
  onSelectFact,
  onDeleteFact,
}) => (
  <div >
    <div >
      <Select
        
        value={categoryFilter}
        onChange={(e) => onCategoryFilterChange(e.target.value as LoreCategory | '')}
      >
        <option value="">All Categories</option>
        <option value="characters">Characters</option>
        <option value="locations">Locations</option>
        <option value="events">Events</option>
        <option value="rules">Rules</option>
      </Select>
      <Select
        
        value={sessionFilter}
        onChange={(e) => onSessionFilterChange(e.target.value as typeof sessionFilter)}
      >
        <option value="all">All Sessions</option>
        {currentSessionId && currentSessionWorldId === selectedWorldId && (
          <option value="current">Current Session ({currentSessionId})</option>
        )}
        {sessionOptions
          .filter((id) => id !== currentSessionId)
          .map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
      </Select>
      <Select
        
        value={visibilityFilter}
        onChange={(e) => onVisibilityFilterChange(e.target.value as typeof visibilityFilter)}
      >
        <option value="all">All Visibility</option>
        <option value="session-private">Session Private Only</option>
        <option value="world-shared">World Shared Only</option>
      </Select>
      <div >
        Total facts: {facts.length}
      </div>
    </div>

    <div >
      <div>
        Visibility totals (world): {visibilityStats.total} total • {visibilityStats.worldShared} world-shared •{''}
        {visibilityStats.sessionPrivate} session-private
      </div>
      <div>
        Narrative facts: {visibilityStats.narrativeWorldShared} world-shared • {visibilityStats.narrativeSessionPrivate}{''}
        session-private
      </div>
      <div>Note: AI-extracted lore uses session-private visibility when a session is active.</div>
    </div>

    <div >
      {(Object.keys(factsByCategory) as LoreCategory[]).map((category) => {
        const categoryFacts = factsByCategory[category];
        if (!categoryFilter && categoryFacts.length === 0) return null;

        return (
          <div key={category} >
            <h3 className={`${categoryColors[category]}`}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </h3>
            <div >
              {categoryFacts.map((fact) => {
                const importance = fact.metadata?.importance;
                const importanceBadge = importance ? (
                  <span
                    className={`${
                      importance === 'high'
                        ? ''
                        : importance === 'medium'
                          ? ''
                          : importance === 'low'
                            ? ''
                            : ''
                    }`}
                  >
                    {importance.toUpperCase()}
                  </span>
                ) : (
                  <span >
                    NO IMPORTANCE
                  </span>
                );

                const visibilityBadge = (
                  <span
                    className={`${
                      fact.visibility === 'session-private'
                        ? ''
                        : ''
                    }`}
                  >
                    {fact.visibility === 'session-private' ? 'Session Private' : 'World Shared'}
                  </span>
                );

                return (
                  <div
                    key={fact.id}
                    
                    onClick={() => onSelectFact(fact.id)}
                  >
                    <div >
                      {importanceBadge}
                      {visibilityBadge}
                      <span>{fact.value}</span>
                    </div>
                    <div >
                      <Button
                        size="sm"
                        variant=""
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFact(fact.id);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFact(fact.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
