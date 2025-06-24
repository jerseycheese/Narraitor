// src/components/world/SmartTemplates/SmartTemplates.tsx

import React, { useCallback, useMemo } from 'react';
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
import { useModal, useFormState } from '@/hooks';

interface SmartTemplatesProps {
  onTemplateGenerated: (template: WorldTemplate) => void;
}

type TemplateMode = 'inspired-by' | 'genre-mix' | 'surprise-me';

export const SmartTemplates: React.FC<SmartTemplatesProps> = ({ onTemplateGenerated }) => {
  // Template state management using hooks
  const smartTemplatesState = useFormState({
    initialData: {
      mode: 'inspired-by' as TemplateMode,
      userInput: '',
      selectedGenres: [] as string[],
      previewTemplate: null as WorldTemplate | null
    }
  });
  
  // Modal state management using hooks
  const templatePreviewModal = useModal();

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
        generationType: smartTemplatesState.data.mode,
        userInput: smartTemplatesState.data.mode === 'inspired-by' ? smartTemplatesState.data.userInput : undefined,
        genres: smartTemplatesState.data.mode === 'genre-mix' ? smartTemplatesState.data.selectedGenres : undefined
      };
      
      addTemplateToHistory(historyEntry);
      
      // Show preview
      smartTemplatesState.updateField('previewTemplate', template);
      templatePreviewModal.open();
    },
    onError: () => {
      // Error is already handled by the hook's error state
    }
  });

  const toggleGenre = useCallback((genre: string) => {
    const currentGenres = smartTemplatesState.data.selectedGenres;
    const updatedGenres = currentGenres.includes(genre) 
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];
    smartTemplatesState.updateField('selectedGenres', updatedGenres);
  }, [smartTemplatesState]);

  const generateTemplate = useCallback(async (generationMode: TemplateMode) => {
    const requestBody = {
      type: generationMode,
      userInput: generationMode === 'inspired-by' ? smartTemplatesState.data.userInput : undefined,
      genres: generationMode === 'genre-mix' ? smartTemplatesState.data.selectedGenres : undefined,
    };

    try {
      await aiGeneration.generate(requestBody);
    } catch {
      // Error is already handled by the hook's error state
      // No need to do anything here - the hook manages the error display
    }
  }, [smartTemplatesState.data.userInput, smartTemplatesState.data.selectedGenres, aiGeneration]);

  const handleUseTemplate = useCallback(() => {
    if (smartTemplatesState.data.previewTemplate) {
      onTemplateGenerated(smartTemplatesState.data.previewTemplate);
      smartTemplatesState.updateField('previewTemplate', null);
      templatePreviewModal.close();
    }
  }, [onTemplateGenerated, templatePreviewModal, smartTemplatesState]);

  const handleGenerateInspiredBy = useCallback(() => {
    if (!smartTemplatesState.data.userInput.trim()) {
      // Using a simple alert for validation errors since they're not async failures
      alert('Please describe what you want your world to be like');
      return;
    }
    generateTemplate('inspired-by');
  }, [smartTemplatesState.data.userInput, generateTemplate]);

  const handleGenerateGenreMix = useCallback(() => {
    if (smartTemplatesState.data.selectedGenres.length < 2) {
      // Using a simple alert for validation errors since they're not async failures
      alert('Please select at least 2 genres to mix');
      return;
    }
    generateTemplate('genre-mix');
  }, [smartTemplatesState.data.selectedGenres, generateTemplate]);

  const handleSurpriseMe = useCallback(() => {
    generateTemplate('surprise-me');
  }, [generateTemplate]);

  const handleHistoryTemplate = useCallback((entry: TemplateHistoryEntry) => {
    smartTemplatesState.updateField('previewTemplate', entry.template);
    templatePreviewModal.open();
  }, [templatePreviewModal, smartTemplatesState]);


  // Template preview modal component
  const handleClosePreview = useCallback(() => {
    smartTemplatesState.updateField('previewTemplate', null);
    templatePreviewModal.close();
  }, [templatePreviewModal, smartTemplatesState]);

  return (
    <>
      {/* Template Preview Modal */}
      {smartTemplatesState.data.previewTemplate && (
        <TemplatePreview
          template={smartTemplatesState.data.previewTemplate}
          {...templatePreviewModal.modalProps}
          onUse={handleUseTemplate}
          onBack={handleClosePreview}
        />
      )}
      
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
                activeValue={smartTemplatesState.data.mode}
                onChange={(newMode) => smartTemplatesState.updateField('mode', newMode)}
                className="mb-6"
              />
            </div>

            {/* Inspired By Mode */}
            {smartTemplatesState.data.mode === 'inspired-by' && (
            <div className={wizardStyles.card.base}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Describe Your World</h3>
                </div>
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Steampunk Victorian London, Space pirates, etc."
                    value={smartTemplatesState.data.userInput}
                    onChange={(e) => smartTemplatesState.updateField('userInput', e.target.value)}
                  />
                  <Button
                    onClick={handleGenerateInspiredBy}
                    disabled={!smartTemplatesState.data.userInput.trim()}
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
            {smartTemplatesState.data.mode === 'genre-mix' && (
            <div className={wizardStyles.card.base}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Mix Genres Together</h3>
                  <p className="text-sm text-gray-600 mb-4">Select 2 or more genres to blend together</p>
                </div>
                <div className="space-y-4">
                  <GenreSelector
                    selectedGenres={smartTemplatesState.data.selectedGenres}
                    onToggleGenre={toggleGenre}
                    excludeOther={true}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {smartTemplatesState.data.selectedGenres.length} genre{smartTemplatesState.data.selectedGenres.length !== 1 ? 's' : ''} selected
                    </span>
                    <Button
                      onClick={handleGenerateGenreMix}
                      disabled={smartTemplatesState.data.selectedGenres.length < 2}
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
            {smartTemplatesState.data.mode === 'surprise-me' && (
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