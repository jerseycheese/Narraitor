import React from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { DevToolsSection } from '../shared/DevToolsSection';

interface FilterControlsProps {
  scope: 'session' | 'world' | 'all';
  onScopeChange: (scope: 'session' | 'world' | 'all') => void;
  selectedSessionId: string | null;
  onSessionChange: (sessionId: string | null) => void;
  availableSessions: string[];
  selectedWorldId: string | null;
  onWorldChange: (worldId: string | null) => void;
  availableWorlds: string[];
  contextSessionId: string;
  contextWorldId: string;
  worldDisplayName: (worldId: string | null) => string;
  filteredDecisionsCount: number;
  onRefresh: () => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  scope,
  onScopeChange,
  selectedSessionId,
  onSessionChange,
  availableSessions,
  selectedWorldId,
  onWorldChange,
  availableWorlds,
  contextSessionId,
  contextWorldId,
  worldDisplayName,
  filteredDecisionsCount,
  onRefresh,
}) => {
  return (
    <DevToolsSection title="Filters">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-gray-900">
        <div className="flex flex-col space-y-1">
          <label className="font-medium" htmlFor="relevance-scope">
            Scope
          </label>
          <Select
            id="relevance-scope"
            value={scope}
            onChange={(event) => onScopeChange(event.target.value as typeof scope)}
            className="text-xs"
          >
            <option value="session">Active session</option>
            <option value="world">World</option>
            <option value="all">All decisions</option>
          </Select>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="font-medium" htmlFor="relevance-session">
            Session
          </label>
          <Select
            id="relevance-session"
            value={selectedSessionId ?? ''}
            onChange={(event) => onSessionChange(event.target.value || null)}
            disabled={availableSessions.length === 0}
            className="text-xs"
          >
            {availableSessions.length === 0 && <option value="">No sessions</option>}
            {availableSessions.map((sessionId) => (
              <option key={sessionId} value={sessionId}>
                {sessionId}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="font-medium" htmlFor="relevance-world">
            World
          </label>
          <Select
            id="relevance-world"
            value={selectedWorldId ?? ''}
            onChange={(event) => onWorldChange(event.target.value || null)}
            disabled={availableWorlds.length === 0}
            className="text-xs"
          >
            {availableWorlds.length === 0 && <option value="">No worlds</option>}
            {availableWorlds.map((worldId) => (
              <option key={worldId} value={worldId}>
                {worldDisplayName(worldId)}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col space-y-1">
          <span className="font-medium">Context overview</span>
          <div className="text-gray-700">
            Session: {contextSessionId}
            <br />
            World: {worldDisplayName(contextWorldId)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <Button variant="outline" size="sm" className="text-xs" onClick={onRefresh}>
          Refresh decisions
        </Button>
        <div className="text-xs text-gray-700">
          Showing {filteredDecisionsCount} decision
          {filteredDecisionsCount === 1 ? '' : 's'} in scope
        </div>
      </div>
    </DevToolsSection>
  );
};
