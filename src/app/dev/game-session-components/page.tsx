'use client';

import React, { useState } from 'react';
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';
import SessionControls from '@/components/GameSession/SessionControls';
import GameSessionLoading from '@/components/GameSession/GameSessionLoading';
import GameSessionError from '@/components/GameSession/GameSessionError';
import { Decision } from '@/types/narrative.types';

export default function GameSessionComponentsTestPage() {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  const mockDecision: Decision = {
    id: 'test-decision',
    prompt: 'What do you do?',
    options: [
      { id: 'choice-1', text: 'Talk to the mysterious figure' },
      { id: 'choice-2', text: 'Order a drink from the bartender' },
      { id: 'choice-3', text: 'Leave the tavern' },
    ],
    selectedOptionId: selectedChoiceId || undefined,
  };

  const handleChoiceSelected = (choiceId: string) => {
    setSelectedChoiceId(choiceId);
    console.log('Choice selected:', choiceId);
  };

  const handleEnd = () => {
    console.log('Session ended');
  };

  const handleRestart = () => {
    console.log('Session restarted');
  };

  const handleEndStory = () => {
    console.log('Story ended');
  };

  const handleRetry = () => {
    setShowError(false);
    console.log('Retry clicked');
  };

  const handleDismiss = () => {
    setShowError(false);
    console.log('Dismiss clicked');
  };

  return (
    <div>
      <h1>GameSession Components Test Page</h1>
      
      <div>
        {/* ChoiceSelector Component */}
        <section>
          <h2>ChoiceSelector Component</h2>
          <ChoiceSelector
            decision={mockDecision}
            onSelect={handleChoiceSelected}
          />
          <p>
            Selected: {selectedChoiceId || 'None'}
          </p>
        </section>

        {/* SessionControls Component */}
        <section>
          <h2>SessionControls Component</h2>
          <div>
            <div>
              <h3>Basic Controls (End Only)</h3>
              <SessionControls onEnd={handleEnd} />
            </div>
            <div>
              <h3>All Controls</h3>
              <SessionControls 
                onEnd={handleEnd}
                onRestart={handleRestart}
                onEndStory={handleEndStory}
              />
            </div>
          </div>
        </section>

        {/* GameSessionLoading Component */}
        <section>
          <h2>GameSessionLoading Component</h2>
          <GameSessionLoading />
          <GameSessionLoading loadingMessage="Preparing your adventure..." />
        </section>

        {/* GameSessionError Component */}
        <section>
          <h2>GameSessionError Component</h2>
          <button
            onClick={() => setShowError(true)}
          >
            Show Error
          </button>
          {showError && (
            <GameSessionError
              error="Failed to load game session"
              onRetry={handleRetry}
              onDismiss={handleDismiss}
            />
          )}
        </section>


        {/* Disabled State Demo */}
        <section>
          <h2>Disabled ChoiceSelector</h2>
          <ChoiceSelector
            decision={mockDecision}
            onSelect={handleChoiceSelected}
            isDisabled={true}
          />
        </section>
      </div>
    </div>
  );
}
