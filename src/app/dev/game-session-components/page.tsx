'use client';

import React, { useState } from 'react';
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';
import SessionControls from '@/components/GameSession/SessionControls';
import GameSessionLoading from '@/components/GameSession/GameSessionLoading';
import GameSessionError from '@/components/GameSession/GameSessionError';

export default function GameSessionComponentsTestPage() {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'paused' | 'ended'>('active');
  const [showError, setShowError] = useState(false);

  const mockChoices = [
    { id: 'choice-1', text: 'Talk to the mysterious figure', isSelected: selectedChoiceId === 'choice-1' },
    { id: 'choice-2', text: 'Order a drink from the bartender', isSelected: selectedChoiceId === 'choice-2' },
    { id: 'choice-3', text: 'Leave the tavern', isSelected: selectedChoiceId === 'choice-3' },
  ];

  const handleChoiceSelected = (choiceId: string) => {
    setSelectedChoiceId(choiceId);
    console.log('Choice selected:', choiceId);
  };

  const handlePause = () => {
    setSessionStatus('paused');
    console.log('Session paused');
  };

  const handleResume = () => {
    setSessionStatus('active');
    console.log('Session resumed');
  };

  const handleEnd = () => {
    setSessionStatus('ended');
    console.log('Session ended');
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">GameSession Components Test Page</h1>
      
      <div className="space-y-8">
        {/* ChoiceSelector Component */}
        <section className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-4">ChoiceSelector Component</h2>
          <ChoiceSelector
            choices={mockChoices}
            onSelect={handleChoiceSelected}
          />
          <p className="mt-2 text-sm text-gray-600">
            Selected: {selectedChoiceId || 'None'}
          </p>
        </section>

        {/* SessionControls Component */}
        <section className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-4">SessionControls Component</h2>
          <SessionControls
            status={sessionStatus}
            onPause={handlePause}
            onResume={handleResume}
            onEnd={handleEnd}
          />
          <p className="mt-2 text-sm text-gray-600">
            Status: {sessionStatus}
          </p>
        </section>

        {/* GameSessionLoading Component */}
        <section className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-4">GameSessionLoading Component</h2>
          <GameSessionLoading />
          <GameSessionLoading loadingMessage="Preparing your adventure..." />
        </section>

        {/* GameSessionError Component */}
        <section className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-4">GameSessionError Component</h2>
          <button
            onClick={() => setShowError(true)}
            className="mb-4 px-4 py-2 bg-red-500 text-white rounded"
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
        <section className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-4">Disabled ChoiceSelector</h2>
          <ChoiceSelector
            choices={mockChoices}
            onSelect={handleChoiceSelected}
            isDisabled={true}
          />
        </section>
      </div>
    </div>
  );
}
