// src/components/world/SmartTemplates/SmartTemplates.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { WorldTemplate } from '@/lib/ai/templateGenerator';
import { useSessionStore } from '@/state/sessionStore';
import { TemplateHistoryEntry } from '@/types/game.types';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { wizardStyles } from '@/components/shared/wizard/styles/wizardStyles';
import { ThemeSelector } from '@/components/shared/ThemeSelector';
import { TabNavigation, TabOption } from '@/components/shared/TabNavigation';
import { useHistory } from '@/lib/hooks/useHistory';
import { TemplatePreview } from './TemplatePreview';

interface SmartTemplatesProps {
  onTemplateGenerated: (template: WorldTemplate) => void;
}

type TemplateMode = 'inspired-by' | 'genre-mix' | 'surprise-me';

export const SmartTemplates: React.FC<SmartTemplatesProps> = ({ onTemplateGenerated }) => {
  const [mode, setMode] = useState<TemplateMode>('inspired-by');
  const [userInput, setUserInput] = useState('');
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<WorldTemplate | null>(null);

  // Tab navigation options - memoized to prevent unnecessary re-renders
  const tabOptions: TabOption<TemplateMode>[] = useMemo(() => [
    { value: 'inspired-by', label: 'I want something like...' },
    { value: 'genre-mix', label: 'Theme Mixer' },
    { value: 'surprise-me', label: 'Surprise me!' }
  ], []);

  // Use proper React hooks for reactivity - memoized selectors for performance
  const templateHistory = useSessionStore(useCallback(state => state.templateHistory, []));
  const addTemplateToHistory = useSessionStore(useCallback(state => state.addTemplateToHistory, []));
  const clearTemplateHistory = useSessionStore(useCallback(state => state.clearTemplateHistory, []));
  
  const templateHistoryManager = useHistory(
    templateHistory,
    addTemplateToHistory,
    clearTemplateHistory,
    5
  );

  const toggleTheme = useCallback((theme: string) => {
    setSelectedThemes(prev => 
      prev.includes(theme) 
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  }, []);

  const generateTemplate = useCallback(async (generationMode: TemplateMode) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Create request payload for secure API
      const requestBody = {
        type: generationMode,
        userInput: generationMode === 'inspired-by' ? userInput : undefined,
        genres: generationMode === 'genre-mix' ? selectedThemes : undefined,
      };

      // Call the secure API route instead of client-side AI
      const response = await fetch('/api/ai/generate-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate template');
      }

      const template: WorldTemplate = await response.json();
      
      // Add to history
      const historyEntry: TemplateHistoryEntry = {
        template,
        generatedAt: new Date().toISOString(),
        generationType: generationMode,
        userInput: requestBody.userInput,
        genres: requestBody.genres
      };
      
      templateHistoryManager.addEntry(historyEntry);
      
      // Show preview
      setPreviewTemplate(template);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate template. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [templateHistoryManager, userInput, selectedThemes]);

  const handleUseTemplate = useCallback(() => {
    if (previewTemplate) {
      onTemplateGenerated(previewTemplate);
      setPreviewTemplate(null);
    }
  }, [previewTemplate, onTemplateGenerated]);

  const handleGenerateInspiredBy = useCallback(() => {
    if (!userInput.trim()) {
      setError('Please describe what you want your world to be like');
      return;
    }
    generateTemplate('inspired-by');
  }, [userInput, generateTemplate]);

  const handleGenerateGenreMix = useCallback(() => {
    if (selectedThemes.length < 2) {
      setError('Please select at least 2 themes to mix');
      return;
    }
    generateTemplate('genre-mix');
  }, [selectedThemes, generateTemplate]);

  const handleSurpriseMe = useCallback(() => {
    generateTemplate('surprise-me');
  }, [generateTemplate]);

  const handleHistoryTemplate = useCallback((entry: TemplateHistoryEntry) => {
    setPreviewTemplate(entry.template);
  }, []);

  const handleHistoryKeyPress = useCallback((event: React.KeyboardEvent, entry: TemplateHistoryEntry) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleHistoryTemplate(entry);
    }
  }, [handleHistoryTemplate]);

  // Template preview modal
  const templatePreviewModal = previewTemplate && (
    <TemplatePreview
      template={previewTemplate}
      isOpen={!!previewTemplate}
      onUse={handleUseTemplate}
      onBack={() => setPreviewTemplate(null)}
    />
  );

  return (
    <>
      {/* Template Preview Modal */}
      {templatePreviewModal}
      
      <div className={wizardStyles.container}>
        <div className={wizardStyles.header}>
          <h2 className={wizardStyles.title}>Smart World Templates</h2>
          <p className="text-gray-600">Get creative starting points for your world with AI assistance</p>
        </div>

      {error && (
        <ErrorDisplay 
          message={error}
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}

      {isGenerating && (
        <LoadingState message="Generating your world template..." />
      )}

      {!isGenerating && (
        <div className="space-y-8">
          {/* Mode Selection */}
          <div className="space-y-6">
            {/* Tab-style Mode Selection */}
            <div className="mb-6">
              <TabNavigation
                options={tabOptions}
                activeValue={mode}
                onChange={setMode}
                className="mb-6"
              />
            </div>

            {/* Inspired By Mode */}
            {mode === 'inspired-by' && (
            <div className={wizardStyles.card.base}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Describe Your World</h3>
                </div>
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Steampunk Victorian London, Space pirates, etc."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                  />
                  <Button
                    onClick={handleGenerateInspiredBy}
                    disabled={!userInput.trim()}
                    variant="default"
                    size="default"
                  >
                    Generate World
                  </Button>
                </div>
              </div>
            </div>
            )}

            {/* Theme Mixer Mode */}
            {mode === 'genre-mix' && (
            <div className={wizardStyles.card.base}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Mix Themes Together</h3>
                  <p className="text-sm text-gray-600 mb-4">Select 2 or more themes to blend together</p>
                </div>
                <div className="space-y-4">
                  <ThemeSelector
                    selectedThemes={selectedThemes}
                    onToggleTheme={toggleTheme}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedThemes.length} theme{selectedThemes.length !== 1 ? 's' : ''} selected
                    </span>
                    <Button
                      onClick={handleGenerateGenreMix}
                      disabled={selectedThemes.length < 2}
                      variant="default"
                      size="default"
                    >
                      Mix Themes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Surprise Me Mode */}
            {mode === 'surprise-me' && (
            <div className={wizardStyles.card.base}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Random World Generation</h3>
                  <p className="text-sm text-gray-600 mb-6">Generate a completely unexpected world with unique themes, attributes, and gameplay elements.</p>
                </div>
                <div>
                  <Button
                    onClick={handleSurpriseMe}
                    variant="default"
                    size="default"
                  >
                    Generate Random World
                  </Button>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Template History */}
          {!templateHistoryManager.isEmpty && (
            <div className={wizardStyles.divider}>
              <h3 className={wizardStyles.subheading}>Recent Templates</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {templateHistoryManager.getRecent().map((entry, index) => (
                  <div 
                    key={index}
                    className="border rounded-lg p-4 hover:border-gray-400 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onClick={() => handleHistoryTemplate(entry)}
                    onKeyPress={(e) => handleHistoryKeyPress(e, entry)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Use template: ${entry.template.name} (${entry.template.theme})`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{entry.template.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{entry.template.theme}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(entry.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`${wizardStyles.badge.base} ${wizardStyles.badge.secondary}`}>
                        {entry.generationType === 'inspired-by' ? 'Inspired' : 
                         entry.generationType === 'genre-mix' ? 'Mixed' : 'Surprise'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {templateHistoryManager.isEmpty && (
            <div className="text-center py-8 text-gray-500">
              <p>No recent templates</p>
              <p className="text-sm">Generate your first template to get started!</p>
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
};