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
import { GenreSelector } from '@/components/shared/GenreSelector/GenreSelector';
import { TabNavigation, TabOption } from '@/components/shared/TabNavigation';
import { TemplatePreview } from './TemplatePreview';
import { RecentTemplates } from '@/components/shared/RecentTemplates';
import { useAIGeneration } from '@/lib/hooks/useAIGeneration';

interface SmartTemplatesProps {
  onTemplateGenerated: (template: WorldTemplate) => void;
}

type TemplateMode = 'inspired-by' | 'genre-mix' | 'surprise-me';

export const SmartTemplates: React.FC<SmartTemplatesProps> = ({ onTemplateGenerated }) => {
  const [mode, setMode] = useState<TemplateMode>('inspired-by');
  const [userInput, setUserInput] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<WorldTemplate | null>(null);

  // Tab navigation options - memoized to prevent unnecessary re-renders
  const tabOptions: TabOption<TemplateMode>[] = useMemo(() => [
    { value: 'inspired-by', label: 'I want something like...' },
    { value: 'genre-mix', label: 'Genre Mixer' },
    { value: 'surprise-me', label: 'Surprise me!' }
  ], []);

  // Use session store for adding templates to history
  const addTemplateToHistory = useSessionStore(state => state.addTemplateToHistory);

  // AI generation hook with proper error handling and loading states
  const aiGeneration = useAIGeneration<
    { type: TemplateMode; userInput?: string; genres?: string[] },
    WorldTemplate
  >({
    endpoint: '/api/ai/generate-template',
    onSuccess: (template) => {
      // Add to history
      const historyEntry: TemplateHistoryEntry = {
        template,
        generatedAt: new Date().toISOString(),
        generationType: mode,
        userInput: mode === 'inspired-by' ? userInput : undefined,
        genres: mode === 'genre-mix' ? selectedGenres : undefined
      };
      
      addTemplateToHistory(historyEntry);
      
      // Show preview
      setPreviewTemplate(template);
    },
    onError: () => {
      // Error is already handled by the hook's error state
    }
  });

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  }, []);

  const generateTemplate = useCallback(async (generationMode: TemplateMode) => {
    const requestBody = {
      type: generationMode,
      userInput: generationMode === 'inspired-by' ? userInput : undefined,
      genres: generationMode === 'genre-mix' ? selectedGenres : undefined,
    };

    await aiGeneration.generate(requestBody);
  }, [userInput, selectedGenres, aiGeneration]);

  const handleUseTemplate = useCallback(() => {
    if (previewTemplate) {
      onTemplateGenerated(previewTemplate);
      setPreviewTemplate(null);
    }
  }, [previewTemplate, onTemplateGenerated]);

  const handleGenerateInspiredBy = useCallback(() => {
    if (!userInput.trim()) {
      // Using a simple alert for validation errors since they're not async failures
      alert('Please describe what you want your world to be like');
      return;
    }
    generateTemplate('inspired-by');
  }, [userInput, generateTemplate]);

  const handleGenerateGenreMix = useCallback(() => {
    if (selectedGenres.length < 2) {
      // Using a simple alert for validation errors since they're not async failures
      alert('Please select at least 2 genres to mix');
      return;
    }
    generateTemplate('genre-mix');
  }, [selectedGenres, generateTemplate]);

  const handleSurpriseMe = useCallback(() => {
    generateTemplate('surprise-me');
  }, [generateTemplate]);

  const handleHistoryTemplate = useCallback((entry: TemplateHistoryEntry) => {
    setPreviewTemplate(entry.template);
  }, []);


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

      {aiGeneration.error && (
        <ErrorDisplay 
          message={aiGeneration.error}
          onDismiss={aiGeneration.clearError}
          className="mb-6"
        />
      )}

      {aiGeneration.isGenerating && (
        <LoadingState message="Generating your world template..." />
      )}

      {!aiGeneration.isGenerating && (
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

            {/* Genre Mixer Mode */}
            {mode === 'genre-mix' && (
            <div className={wizardStyles.card.base}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Mix Genres Together</h3>
                  <p className="text-sm text-gray-600 mb-4">Select 2 or more genres to blend together</p>
                </div>
                <div className="space-y-4">
                  <GenreSelector
                    selectedGenres={selectedGenres}
                    onToggleGenre={toggleGenre}
                    excludeOther={true}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''} selected
                    </span>
                    <Button
                      onClick={handleGenerateGenreMix}
                      disabled={selectedGenres.length < 2}
                      variant="default"
                      size="default"
                    >
                      Mix Genres
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

          {/* Recent Templates */}
          <RecentTemplates
            onTemplateSelect={handleHistoryTemplate}
            title="Recent Templates"
            description="Click to preview recently generated templates"
          />

        </div>
      )}
      </div>
    </>
  );
};