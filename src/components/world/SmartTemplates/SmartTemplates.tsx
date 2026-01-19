// src/components/world/SmartTemplates/SmartTemplates.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { WorldTemplate } from '@/lib/ai/templateGenerator';
import { useSessionStore } from '@/state/sessionStore';
import { TemplateHistoryEntry } from '@/types/game.types';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GenreSelector } from '@/components/shared/GenreSelector/GenreSelector';
import { TabNavigation, TabOption } from '@/components/shared/TabNavigation';
import { TemplatePreview } from './TemplatePreview';
import { RecentTemplates } from '@/components/shared/RecentTemplates';
import { useAIGeneration } from '@/lib/hooks/useAIGeneration';
import { getTimestamp } from '@/lib/utils';

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
        generatedAt: getTimestamp(),
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

    try {
      await aiGeneration.generate(requestBody);
    } catch {
      // Error is already handled by the hook's error state
      // No need to do anything here - the hook manages the error display
    }
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
      
      <div className="space-y-5">
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
        <div className="space-y-5">
          {/* Mode Selection */}
          <div className="space-y-4">
            {/* Tab-style Mode Selection */}
            <div className="mb-4">
              <TabNavigation
                options={tabOptions}
                activeValue={mode}
                onChange={setMode}
                size="sm"
              />
            </div>

            {/* Tab Content - fixed min-height to prevent layout shift */}
            <div className="min-h-[180px]">
            {/* Inspired By Mode */}
            {mode === 'inspired-by' && (
            <div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Describe Your World</h3>
                </div>
                <div className="space-y-3">
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
                    size="sm"
                  >
                    Generate World
                  </Button>
                </div>
              </div>
            </div>
            )}

            {/* Genre Mixer Mode */}
            {mode === 'genre-mix' && (
            <div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Mix Genres Together</h3>
                  <p className="text-sm text-muted-foreground">Select 2 or more genres to blend together</p>
                </div>
                <div className="space-y-3">
                  <GenreSelector
                    selectedGenres={selectedGenres}
                    onToggleGenre={toggleGenre}
                    excludeOther={true}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''} selected
                    </span>
                    <Button
                      onClick={handleGenerateGenreMix}
                      disabled={selectedGenres.length < 2}
                      variant="default"
                      size="sm"
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
            <div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Random World Generation</h3>
                  <p className="text-sm text-muted-foreground">Generate a completely unexpected world with unique themes and attributes.</p>
                </div>
                <div>
                  <Button
                    onClick={handleSurpriseMe}
                    variant="default"
                    size="sm"
                  >
                    Generate Random World
                  </Button>
                </div>
              </div>
            </div>
            )}
            </div>
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
