// src/components/world/SmartTemplates/SmartTemplates.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import { geminiClient } from '@/lib/ai/geminiClient';
import { WorldTemplate } from '@/lib/ai/templateGenerator';
import { TemplateGenerationContext } from '@/lib/ai/templatePrompts';
import { useSessionStore } from '@/state/sessionStore';
import { TemplateHistoryEntry } from '@/types/game.types';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { wizardStyles } from '@/components/shared/wizard/styles/wizardStyles';
import { ToggleButton } from '@/components/shared/wizard/components/ToggleButton';
import { GenreSelector } from '@/components/shared/GenreSelector';
import { useHistory } from '@/lib/hooks/useHistory';
import { TemplatePreview } from './TemplatePreview';

interface SmartTemplatesProps {
  onTemplateGenerated: (template: WorldTemplate) => void;
}

type TemplateMode = 'inspired-by' | 'genre-mix' | 'surprise-me';

export const SmartTemplates: React.FC<SmartTemplatesProps> = ({ onTemplateGenerated }) => {
  const [mode, setMode] = useState<TemplateMode>('inspired-by');
  const [userInput, setUserInput] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<WorldTemplate | null>(null);
  
  const narrativeGenerator = useMemo(() => new NarrativeGenerator(geminiClient), []);

  // Use the generic history hook
  const templateHistoryManager = useHistory(
    useSessionStore.getState().templateHistory,
    useSessionStore.getState().addTemplateToHistory,
    useSessionStore.getState().clearTemplateHistory,
    5
  );

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  }, []);

  const generateTemplate = async (generationMode: TemplateMode, context?: Partial<TemplateGenerationContext>) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const generationContext: TemplateGenerationContext = {
        type: generationMode,
        userInput: generationMode === 'inspired-by' ? userInput : undefined,
        genres: generationMode === 'genre-mix' ? selectedGenres : undefined,
        ...context
      };

      const template = await narrativeGenerator.generateWorldTemplate(generationContext);
      
      // Add to history
      const historyEntry: TemplateHistoryEntry = {
        template,
        generatedAt: new Date().toISOString(),
        generationType: generationMode,
        userInput: generationContext.userInput,
        genres: generationContext.genres
      };
      
      templateHistoryManager.addEntry(historyEntry);
      
      // Show preview
      setPreviewTemplate(template);
      
    } catch (err) {
      setError('Failed to generate template. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

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
    if (selectedGenres.length < 2) {
      setError('Please select at least 2 genres to mix');
      return;
    }
    generateTemplate('genre-mix');
  }, [selectedGenres, generateTemplate]);

  const handleSurpriseMe = useCallback(() => {
    generateTemplate('surprise-me');
  }, [generateTemplate]);

  const useHistoryTemplate = useCallback((entry: TemplateHistoryEntry) => {
    setPreviewTemplate(entry.template);
  }, []);

  if (previewTemplate) {
    return (
      <TemplatePreview
        template={previewTemplate}
        onUse={handleUseTemplate}
        onBack={() => setPreviewTemplate(null)}
      />
    );
  }

  return (
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
            {/* Inspired By Mode */}
            <div className={`${wizardStyles.card.base} ${mode === 'inspired-by' ? wizardStyles.card.selected : wizardStyles.card.unselected}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">I want something like...</h3>
                  <ToggleButton
                    isActive={mode === 'inspired-by'}
                    activeLabel="Selected"
                    inactiveLabel="Select"
                    onClick={() => setMode('inspired-by')}
                  />
                </div>
                {mode === 'inspired-by' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Describe what you want (e.g., 'Steampunk Victorian London' or 'Space pirates')"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className={wizardStyles.form.input}
                    />
                    <button
                      onClick={handleGenerateInspiredBy}
                      disabled={!userInput.trim()}
                      className={wizardStyles.navigation.primaryButton}
                    >
                      Generate World
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Genre Mixer Mode */}
            <div className={`${wizardStyles.card.base} ${mode === 'genre-mix' ? wizardStyles.card.selected : wizardStyles.card.unselected}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Genre Mixer</h3>
                  <ToggleButton
                    isActive={mode === 'genre-mix'}
                    activeLabel="Selected"
                    inactiveLabel="Select"
                    onClick={() => setMode('genre-mix')}
                  />
                </div>
                {mode === 'genre-mix' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Select 2 or more genres to blend together</p>
                    <GenreSelector
                      selectedGenres={selectedGenres}
                      onToggleGenre={toggleGenre}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''} selected
                      </span>
                      <button
                        onClick={handleGenerateGenreMix}
                        disabled={selectedGenres.length < 2}
                        className={wizardStyles.navigation.primaryButton}
                      >
                        Mix Genres
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Surprise Me Mode */}
            <div className={`${wizardStyles.card.base} ${mode === 'surprise-me' ? wizardStyles.card.selected : wizardStyles.card.unselected}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Surprise me!</h3>
                    <p className="text-sm text-gray-600">Generate a completely unexpected world</p>
                  </div>
                  <button
                    onClick={handleSurpriseMe}
                    className={wizardStyles.navigation.primaryButton}
                  >
                    Surprise me!
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Template History */}
          {!templateHistoryManager.isEmpty && (
            <div className={wizardStyles.divider}>
              <h3 className={wizardStyles.subheading}>Recent Templates</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {templateHistoryManager.history.map((entry, index) => (
                  <div 
                    key={index}
                    className="border rounded-lg p-4 hover:border-gray-400 cursor-pointer transition-colors"
                    onClick={() => useHistoryTemplate(entry)}
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
  );
};