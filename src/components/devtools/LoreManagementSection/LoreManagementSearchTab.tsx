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
  <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search facts..."
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        className="flex-1 min-w-[12rem]"
      />
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
    </div>

    {searchQuery && (
      <div className="text-sm text-gray-700">Found {facts.length} result(s) for &quot;{searchQuery}&quot;</div>
    )}

    <div className="space-y-2">
      {facts.map((fact) => {
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
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-200 text-gray-600">NO IMPORTANCE</span>
        );

        return (
          <div
            key={fact.id}
            className="p-3 border rounded-lg hover:bg-gray-100 cursor-pointer"
            onClick={() => onSelectFact(fact.id)}
          >
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${categoryColors[fact.category]}`}>{fact.category}</span>
              {importanceBadge}
              <span className="font-mono text-sm">{fact.key}</span>
            </div>
            <div className="mt-1">{fact.value}</div>
            {fact.metadata?.description && <div className="text-sm text-gray-700 mt-1">{fact.metadata.description}</div>}
          </div>
        );
      })}
    </div>
  </div>
);
