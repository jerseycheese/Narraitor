/**
 * LoreManagementSection Component
 * Issue #182: Store world facts for developer tools and debugging
 * 
 * Provides developer-facing interface for managing world facts
 */

import React, { useState, useMemo } from 'react';
import { useLoreStore } from '@/state/loreStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { DevToolsSection } from '@/components/devtools/shared/DevToolsSection';
import { FactEditor } from './FactEditor';
import { FactInspector } from './FactInspector';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { LoreFact, LoreCategory } from '@/types/lore.types';
import type { EntityID } from '@/types/common.types';

export const LoreManagementSection: React.FC = () => {
  const [selectedWorldId, setSelectedWorldId] = useState<EntityID>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<LoreCategory | ''>('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'session-private' | 'world-shared'>('all');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'current' | EntityID>('all');
  const [selectedFactId, setSelectedFactId] = useState<EntityID | null>(null);
  const [importData, setImportData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [exportedData, setExportedData] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { worlds } = useWorldStore();
  const currentSessionId = useSessionStore((state) => state.id);
  const currentSessionWorldId = useSessionStore((state) => state.worldId);
  const {
    facts: allFacts,
    getFacts,
    searchFacts,
    deleteFact,
    exportFacts,
    importFacts
  } = useLoreStore();

  const sessionOptions = useMemo(() => {
    if (!selectedWorldId) return [];
    const ids = new Set(
      Object.values(allFacts)
        .filter((fact) => fact.worldId === selectedWorldId && fact.sessionId)
        .map((fact) => fact.sessionId as EntityID)
    );
    return Array.from(ids).sort();
  }, [allFacts, selectedWorldId]);

  const effectiveSessionId = useMemo(() => {
    if (sessionFilter === 'current') {
      return currentSessionId || undefined;
    }
    if (sessionFilter === 'all') return undefined;
    return sessionFilter;
  }, [sessionFilter, currentSessionId]);

  // Get facts based on filters
  const facts = useMemo(() => {
    if (!selectedWorldId) return [];

    let filtered = searchQuery
      ? searchFacts(searchQuery, {
          worldId: selectedWorldId,
          category: categoryFilter || undefined,
          sessionId: effectiveSessionId
        })
      : getFacts({
          worldId: selectedWorldId,
          category: categoryFilter || undefined,
          sessionId: effectiveSessionId
        });

    // Apply visibility filter
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(f => f.visibility === visibilityFilter);
    }

    return filtered;
  }, [selectedWorldId, searchQuery, categoryFilter, visibilityFilter, effectiveSessionId, allFacts, getFacts, searchFacts]);

  const visibilityStats = useMemo(() => {
    if (!selectedWorldId) {
      return {
        total: 0,
        worldShared: 0,
        sessionPrivate: 0,
        narrativeWorldShared: 0,
        narrativeSessionPrivate: 0,
      };
    }

    const worldFacts = getFacts({ worldId: selectedWorldId });
    return worldFacts.reduce(
      (acc, fact) => {
        acc.total += 1;
        if (fact.visibility === 'world-shared') {
          acc.worldShared += 1;
          if (fact.source === 'narrative') acc.narrativeWorldShared += 1;
        } else {
          acc.sessionPrivate += 1;
          if (fact.source === 'narrative') acc.narrativeSessionPrivate += 1;
        }
        return acc;
      },
      {
        total: 0,
        worldShared: 0,
        sessionPrivate: 0,
        narrativeWorldShared: 0,
        narrativeSessionPrivate: 0,
      }
    );
  }, [selectedWorldId, allFacts, getFacts]);

  // Group facts by category
  const factsByCategory = useMemo(() => {
    const grouped: Record<LoreCategory, LoreFact[]> = {
      characters: [],
      locations: [],
      events: [],
      rules: []
    };
    
    facts.forEach(fact => {
      grouped[fact.category].push(fact);
    });
    
    return grouped;
  }, [facts]);

  const handleWorldChange = (worldId: EntityID) => {
    setSelectedWorldId(worldId);
    setSelectedFactId(null);
    setMessage(null);
    if (currentSessionId && currentSessionWorldId === worldId) {
      setSessionFilter('current');
    } else {
      setSessionFilter('all');
    }
  };

  const handleDeleteFact = (factId: EntityID) => {
    if (window.confirm('Are you sure you want to delete this fact?')) {
      deleteFact(factId);
      setSelectedFactId(null);
      setMessage({ type: 'success', text: 'Fact deleted successfully' });
    }
  };

  const handleExport = () => {
    if (!selectedWorldId) return;
    
    const data = exportFacts(selectedWorldId);
    setExportedData(data);
    setMessage({ type: 'success', text: 'Facts exported successfully' });
    
    // Copy to clipboard
    navigator.clipboard.writeText(data);
  };

  const handleImport = () => {
    if (!selectedWorldId || !importData) return;
    
    try {
      importFacts(selectedWorldId, importData);
      setImportData('');
      setShowImportDialog(false);
      setMessage({ type: 'success', text: 'Facts imported successfully' });
    } catch (e) {
      console.error('Error importing facts:', e);
      setMessage({ type: 'error', text: `Failed to import facts: ${e instanceof Error ? e.message : 'Check the JSON format.'}` });
    }
  };

  const categoryColors: Record<LoreCategory, string> = {
    characters: 'text-blue-700',
    locations: 'text-green-700',
    events: 'text-blue-700',
    rules: 'text-amber-700'
  };

  return (
    <DevToolsSection title="Lore Management">
      {/* World Selector */}
      <div className="mb-4">
        <label htmlFor="world-select" className="block text-sm font-medium mb-2">
          Select World
        </label>
        <Select 
          id="world-select"
          value={selectedWorldId} 
          onChange={(e) => handleWorldChange(e.target.value)}
        >
          <option value="">Choose a world</option>
          {Object.values(worlds).map(world => (
            <option key={world.id} value={world.id}>
              {world.name}
            </option>
          ))}
        </Select>
      </div>

      {selectedWorldId && (
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="import-export">Import/Export</TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Select
                className="w-full sm:w-48"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as LoreCategory | '')}
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
                onChange={(e) => setSessionFilter(e.target.value as typeof sessionFilter)}
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
                onChange={(e) => setVisibilityFilter(e.target.value as typeof visibilityFilter)}
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
                Visibility totals (world): {visibilityStats.total} total • {visibilityStats.worldShared} world-shared • {visibilityStats.sessionPrivate} session-private
              </div>
              <div>
                Narrative facts: {visibilityStats.narrativeWorldShared} world-shared • {visibilityStats.narrativeSessionPrivate} session-private
              </div>
              <div>
                Note: AI-extracted lore uses session-private visibility when a session is active.
              </div>
            </div>

            {/* Facts Display */}
            <div className="space-y-4">
              {(Object.keys(factsByCategory) as LoreCategory[]).map(category => {
                const categoryFacts = factsByCategory[category];
                if (!categoryFilter && categoryFacts.length === 0) return null;
                
                return (
                  <div key={category} className="border rounded-lg p-4">
                    <h3 className={`font-semibold mb-2 capitalize ${categoryColors[category]}`}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </h3>
                    <div className="space-y-2">
                      {categoryFacts.map(fact => {
                        const importance = fact.metadata?.importance;
                        const importanceBadge = importance ? (
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              importance === 'high' ? 'bg-red-100 text-red-800' :
                              importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              importance === 'low' ? 'bg-green-100 text-green-800' :
                              'bg-gray-200 text-gray-600'
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
                            onClick={() => setSelectedFactId(fact.id)}
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
                                  setSelectedFactId(fact.id);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFact(fact.id);
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
          </TabsContent>

          {/* Create Tab */}
          <TabsContent value="create">
            <FactEditor
              worldId={selectedWorldId}
              onSave={() => {
                setMessage({ type: 'success', text: 'Fact created successfully' });
              }}
            />
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search facts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-[12rem]"
              />
              <Select 
                className="w-full sm:w-48"
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value as LoreCategory | '')}
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
                onChange={(e) => setSessionFilter(e.target.value as typeof sessionFilter)}
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
              <div className="text-sm text-gray-700">
                Found {facts.length} result(s) for &quot;{searchQuery}&quot;
              </div>
            )}

            {/* Search Results */}
            <div className="space-y-2">
              {facts.map(fact => {
                const importance = fact.metadata?.importance;
                const importanceBadge = importance ? (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      importance === 'high' ? 'bg-red-100 text-red-800' :
                      importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      importance === 'low' ? 'bg-green-100 text-green-800' :
                      'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {importance.toUpperCase()}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-200 text-gray-600">
                    NO IMPORTANCE
                  </span>
                );

                return (
                  <div
                    key={fact.id}
                    className="p-3 border rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedFactId(fact.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${categoryColors[fact.category]}`}>
                        {fact.category}
                      </span>
                      {importanceBadge}
                      <span className="font-mono text-sm">{fact.key}</span>
                    </div>
                    <div className="mt-1">{fact.value}</div>
                    {fact.metadata?.description && (
                      <div className="text-sm text-gray-700 mt-1">{fact.metadata.description}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Import/Export Tab */}
          <TabsContent value="import-export" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Export Facts</h3>
                <Button onClick={handleExport}>Export to JSON</Button>
                {exportedData && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-700 mb-1">Exported data (copied to clipboard):</div>
                    <pre className="p-2 bg-gray-100 rounded text-xs overflow-auto max-h-48">
                      {exportedData}
                    </pre>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Import Facts</h3>
                {!showImportDialog ? (
                  <Button onClick={() => setShowImportDialog(true)}>Import from JSON</Button>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      className="w-full h-48 font-mono text-sm"
                      placeholder="Paste JSON data here..."
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleImport}>Confirm Import</Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowImportDialog(false);
                          setImportData('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Message Display */}
      {message && (
        <Alert className={`mt-4 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Fact Inspector Modal */}
      {selectedFactId && (
        <FactInspector
          factId={selectedFactId}
          onClose={() => setSelectedFactId(null)}
          onUpdate={() => {
            setMessage({ type: 'success', text: 'Fact updated successfully' });
          }}
        />
      )}
    </DevToolsSection>
  );
};
