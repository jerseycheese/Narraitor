'use client';

import React, { useState } from 'react';
import PlayerChoices from '@/components/GameSession/PlayerChoices';
import SessionControls from '@/components/GameSession/SessionControls';
import GameSessionLoading from '@/components/GameSession/GameSessionLoading';
import GameSessionError from '@/components/GameSession/GameSessionError';
import GameSessionActive from '@/components/GameSession/GameSessionActive';
import { World } from '@/types/world.types';

export default function GameSessionComponentsTestPage() {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'paused' | 'ended'>('active');
  const [showError, setShowError] = useState(false);

  const mockWorld: World = {
    id: 'test-world',
    name: 'Test World',
    description: 'A world for testing',
    theme: 'Fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 8,
      attributePointPool: 27,
      skillPointPool: 20,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockChoices = [
    { id: 'choice-1', text: 'Talk to the mysterious figure', isSelected: selectedChoiceId === 'choice-1' },
    { id: 'choice-2', text: 'Order a drink from the bartender', isSelected: selectedChoiceId === 'choice-2' },
    { id: 'choice-3', text: 'Leave the tavern', isSelected: selectedChoiceId === 'choice-3' },
  ];

  const mockNarrative = {
    text: 'You are in a dimly lit tavern. The air is thick with smoke and the scent of ale. A mysterious figure sits in the corner, watching you.',
    choices: mockChoices,
  };

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
        {/* PlayerChoices Component */}
        <section className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-4">PlayerChoices Component</h2>
          <PlayerChoices
            choices={mockChoices}
            onChoiceSelected={handleChoiceSelected}
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

        {/* GameSessionActive Component */}
        <section className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-4">GameSessionActive Component</h2>
          <GameSessionActive
            narrative={mockNarrative}
            onChoiceSelected={handleChoiceSelected}
            world={mockWorld}
            currentSceneId="test-scene-001"
            status={sessionStatus}
            onPause={handlePause}
            onResume={handleResume}
            onEnd={handleEnd}
          />
        </section>

        {/* Disabled State Demo */}
        <section className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-4">Disabled PlayerChoices</h2>
          <PlayerChoices
            choices={mockChoices}
            onChoiceSelected={handleChoiceSelected}
            isDisabled={true}
          />
        </section>
      </div>
    </div>
  );
}