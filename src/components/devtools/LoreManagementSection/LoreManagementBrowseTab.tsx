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
  <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Select
        className="w-full sm:w-48"
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
        className="w-full sm:w-56"
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
        className="w-full sm:w-48"
        value={visibilityFilter}
        onChange={(e) => onVisibilityFilterChange(e.target.value as typeof visibilityFilter)}
      >
        <option value="all">All Visibility</option>
        <option value="session-private">Session Private Only</option>
        <option value="world-shared">World Shared Only</option>
      </Select>
      <div className="w-full sm:w-auto sm:ml-auto text-sm text-gray-700">
        Total facts: {facts.length}
      </div>
    </div>

    <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <div>
        Visibility totals (world): {visibilityStats.total} total • {visibilityStats.worldShared} world-shared •{' '}
        {visibilityStats.sessionPrivate} session-private
      </div>
      <div>
        Narrative facts: {visibilityStats.narrativeWorldShared} world-shared • {visibilityStats.narrativeSessionPrivate}{' '}
        session-private
      </div>
      <div>Note: AI-extracted lore uses session-private visibility when a session is active.</div>
    </div>

    <div className="space-y-4">
      {(Object.keys(factsByCategory) as LoreCategory[]).map((category) => {
        const categoryFacts = factsByCategory[category];
        if (!categoryFilter && categoryFacts.length === 0) return null;

        return (
          <div key={category} className="border rounded-lg p-4">
            <h3 className={`font-semibold mb-2 capitalize ${categoryColors[category]}`}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </h3>
            <div className="space-y-2">
              {categoryFacts.map((fact) => {
                const importance = fact.metadata?.importance;
                const importanceBadge = importance ? (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      importance === 'high'
                        ? 'bg-red-100 text-red-800'
                        : importance === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : importance === 'low'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {importance.toUpperCase()}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-200 text-gray-600">
                    NO IMPORTANCE
                  </span>
                );

                const visibilityBadge = (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      fact.visibility === 'session-private'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {fact.visibility === 'session-private' ? 'Session Private' : 'World Shared'}
                  </span>
                );

                return (
                  <div
                    key={fact.id}
                    className="flex items-center justify-between p-2 bg-gray-100 rounded hover:bg-gray-100 cursor-pointer"
                    onClick={() => onSelectFact(fact.id)}
                  >
                    <div className="flex-1 flex items-center gap-2">
                      {importanceBadge}
                      {visibilityBadge}
                      <span>{fact.value}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
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
