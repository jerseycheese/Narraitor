/**
 * LoreManagementSection Component
 * Issue #182: Store world facts for developer tools and debugging
 * 
 * Provides developer-facing interface for managing world facts
 */

import React, { useState } from 'react';
import { useLoreStore } from '@/state/loreStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { DevToolsSection } from '@/components/devtools/shared/DevToolsSection';
import { FactEditor } from './FactEditor';
import { FactInspector } from './FactInspector';
import { useLoreManagementData } from './useLoreManagementData';
import { LoreManagementBrowseTab } from './LoreManagementBrowseTab';
import { LoreManagementSearchTab } from './LoreManagementSearchTab';
import { LoreManagementImportExportTab } from './LoreManagementImportExportTab';
import { LoreManagementUsageTab } from './LoreManagementUsageTab';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { LoreCategory } from '@/types/lore.types';
import type { EntityID } from '@/types/common.types';
import { logger } from '@/lib/utils/logger';

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
    importFacts,
    loreUsage,
    loreUsageEvents,
    clearLoreUsage
  } = useLoreStore();

  const {
    sessionOptions,
    facts,
    factsByCategory,
    visibilityStats,
    usageSummary,
    usageRows,
    usageEvents,
  } = useLoreManagementData({
    selectedWorldId,
    searchQuery,
    categoryFilter,
    visibilityFilter,
    sessionFilter,
    currentSessionId: currentSessionId || undefined,
    allFacts,
    getFacts,
    searchFacts,
    loreUsage,
    loreUsageEvents
  });

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
      logger.error('Error importing facts', { error: e });
      setMessage({ type: 'error', text: `Failed to import facts: ${e instanceof Error ? e.message : 'Check the JSON format.'}` });
    }
  };

  const categoryColors: Record<LoreCategory, string> = {
    characters: 'text-blue-700',
    locations: 'text-green-700',
    events: 'text-blue-700',
    rules: 'text-amber-700'
  };

  const handleClearUsage = () => {
    if (!selectedWorldId) return;
    if (window.confirm('Clear lore usage tracking for this world?')) {
      clearLoreUsage(selectedWorldId);
    }
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="import-export">Import/Export</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse">
            <LoreManagementBrowseTab
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              sessionFilter={sessionFilter}
              onSessionFilterChange={setSessionFilter}
              visibilityFilter={visibilityFilter}
              onVisibilityFilterChange={setVisibilityFilter}
              currentSessionId={currentSessionId || undefined}
              currentSessionWorldId={currentSessionWorldId || undefined}
              selectedWorldId={selectedWorldId}
              sessionOptions={sessionOptions}
              facts={facts}
              factsByCategory={factsByCategory}
              categoryColors={categoryColors}
              visibilityStats={visibilityStats}
              onSelectFact={(id) => setSelectedFactId(id)}
              onDeleteFact={handleDeleteFact}
            />
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
          <TabsContent value="search">
            <LoreManagementSearchTab
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              sessionFilter={sessionFilter}
              onSessionFilterChange={setSessionFilter}
              currentSessionId={currentSessionId || undefined}
              currentSessionWorldId={currentSessionWorldId || undefined}
              selectedWorldId={selectedWorldId}
              sessionOptions={sessionOptions}
              facts={facts}
              categoryColors={categoryColors}
              onSelectFact={(id) => setSelectedFactId(id)}
            />
          </TabsContent>

          {/* Import/Export Tab */}
          <TabsContent value="import-export">
            <LoreManagementImportExportTab
              exportedData={exportedData}
              showImportDialog={showImportDialog}
              importData={importData}
              onExport={handleExport}
              onImport={handleImport}
              onShowImportDialog={setShowImportDialog}
              onImportDataChange={setImportData}
            />
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage">
            <LoreManagementUsageTab
              usageSummary={usageSummary}
              usageRows={usageRows}
              usageEvents={usageEvents}
              categoryColors={categoryColors}
              onClearUsage={handleClearUsage}
            />
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
