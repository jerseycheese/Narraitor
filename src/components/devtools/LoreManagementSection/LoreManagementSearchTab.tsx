import React from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { LoreCategory, LoreFact } from '@/types/lore.types';
import type { EntityID } from '@/types/common.types';

interface LoreManagementSearchTabProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  categoryFilter: LoreCategory | '';
  onCategoryFilterChange: (value: LoreCategory | '') => void;
  sessionFilter: 'all' | 'current' | EntityID;
  onSessionFilterChange: (value: 'all' | 'current' | EntityID) => void;
  currentSessionId?: EntityID;
  currentSessionWorldId?: EntityID;
  selectedWorldId: EntityID;
  sessionOptions: EntityID[];
  facts: LoreFact[];
  categoryColors: Record<LoreCategory, string>;
  onSelectFact: (id: EntityID) => void;
}

export const LoreManagementSearchTab: React.FC<LoreManagementSearchTabProps> = ({
  searchQuery,
  onSearchQueryChange,
  categoryFilter,
  onCategoryFilterChange,
  sessionFilter,
  onSessionFilterChange,
  currentSessionId,
  currentSessionWorldId,
  selectedWorldId,
  sessionOptions,
  facts,
  categoryColors,
  onSelectFact,
}) => (
  <div >
    <div >
      <Input
        placeholder="Search facts..."
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        
      />
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
    </div>

    {searchQuery && (
      <div >Found {facts.length} result(s) for &quot;{searchQuery}&quot;</div>
    )}

    <div >
      {facts.map((fact) => {
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
          <span >NO IMPORTANCE</span>
        );

        return (
          <div
            key={fact.id}
            
            onClick={() => onSelectFact(fact.id)}
          >
            <div >
              <span className={`${categoryColors[fact.category]}`}>{fact.category}</span>
              {importanceBadge}
              <span >{fact.key}</span>
            </div>
            <div >{fact.value}</div>
            {fact.metadata?.description && <div >{fact.metadata.description}</div>}
          </div>
        );
      })}
    </div>
  </div>
);
