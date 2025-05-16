'use client';

import React, { useState } from 'react';
import GameSession from '../GameSession';
import { PlayerChoice } from '@/types/game.types';

/**
 * A test harness for the GameSession component
 * 
 * This component allows manual verification of all GameSession states
 * and supports the Three-Stage Component Testing approach
 */
export const GameSessionTestHarness: React.FC = () => {
  // Define world that exists in our mock store
  const testWorldId = 'test-world-1';
  
  // Define session states
  const [status, setStatus] = useState<'initializing' | 'loading' | 'active' | 'paused' | 'ended'>('initializing');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentSceneId, setCurrentSceneId] = useState<string | null>('scene-1');
  const [playerChoices, setPlayerChoices] = useState<PlayerChoice[]>([
    { id: 'choice-1', text: 'Option 1', isSelected: false },
    { id: 'choice-2', text: 'Option 2', isSelected: false },
    { id: 'choice-3', text: 'Option 3', isSelected: false },
  ]);

  // Define mock stores
  const mockWorldStore = {
    worlds: {
      [testWorldId]: {
        id: testWorldId,
        name: 'Test World',
        description: 'A world for testing',
        theme: 'Fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 10,
          maxSkills: 10,
          attributePointPool: 100,
          skillPointPool: 100,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    },
    currentWorldId: testWorldId,
    error: null,
    loading: false,
  };

  const mockSessionStore = {
    status,
    currentSceneId,
    playerChoices,
    error: hasError ? errorMessage : null,
    worldId: testWorldId,
    
    // Mock session store actions
    initializeSession: (worldId: string, onComplete?: () => void) => {
      // Simulate async initialization
      setStatus('loading');
      
      // Simulate delay
      setTimeout(() => {
        setStatus('active');
        if (onComplete) onComplete();
      }, 2000);
      
      return Promise.resolve();
    },
    
    endSession: () => {
      setStatus('ended');
    },
    
    setStatus: (newStatus: 'initializing' | 'loading' | 'active' | 'paused' | 'ended') => {
      setStatus(newStatus);
    },
    
    setError: (error: string | null) => {
      if (error) {
        setHasError(true);
        setErrorMessage(error);
      } else {
        setHasError(false);
        setErrorMessage('');
      }
    },
    
    setPlayerChoices: (choices: PlayerChoice[]) => {
      setPlayerChoices(choices);
    },
    
    selectChoice: (choiceId: string) => {
      setPlayerChoices(prev => 
        prev.map(choice => ({
          ...choice,
          isSelected: choice.id === choiceId,
        }))
      );
    },
    
    clearPlayerChoices: () => {
      setPlayerChoices([]);
    },
    
    setCurrentScene: (sceneId: string | null) => {
      setCurrentSceneId(sceneId);
    },
    
    pauseSession: () => {
      setStatus('paused');
    },
    
    resumeSession: () => {
      setStatus('active');
    },
  };

  // Combine stores
  const mockStores = {
    worldStore: mockWorldStore,
    sessionStore: mockSessionStore,
  };

  // Create a mock router
  const mockRouter = {
    push: (url: string) => {
      console.log(`Navigation to: ${url}`);
      alert(`Would navigate to: ${url}`);
    },
  };

  // Handlers for state changes in test harness controls
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value as 'initializing' | 'loading' | 'active' | 'paused' | 'ended');
  };

  const handleErrorToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasError(e.target.checked);
  };

  const handleErrorMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(e.target.value);
  };

  const handleSceneIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentSceneId(e.target.value || null);
  };

  const handleAddChoice = () => {
    const newId = `choice-${playerChoices.length + 1}`;
    setPlayerChoices([
      ...playerChoices, 
      { id: newId, text: `Option ${playerChoices.length + 1}`, isSelected: false }
    ]);
  };

  const handleRemoveChoice = (id: string) => {
    setPlayerChoices(playerChoices.filter(choice => choice.id !== id));
  };

  const handleChoiceTextChange = (id: string, text: string) => {
    setPlayerChoices(
      playerChoices.map(choice => 
        choice.id === id 
          ? { ...choice, text } 
          : choice
      )
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">
      {/* Test Harness Controls */}
      <div className="w-full md:w-1/3 bg-gray-100 p-4 rounded-md">
        <h2 className="text-xl font-bold mb-4">GameSession Test Harness</h2>
        
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Session Status</label>
          <select 
            value={status} 
            onChange={handleStatusChange}
            className="w-full p-2 border rounded"
          >
            <option value="initializing">initializing</option>
            <option value="loading">loading</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="ended">ended</option>
          </select>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input 
              type="checkbox" 
              id="hasError" 
              checked={hasError} 
              onChange={handleErrorToggle}
              className="mr-2"
            />
            <label htmlFor="hasError" className="font-semibold">Has Error</label>
          </div>
          
          {hasError && (
            <input 
              type="text" 
              value={errorMessage} 
              onChange={handleErrorMessageChange}
              placeholder="Error message" 
              className="w-full p-2 border rounded"
            />
          )}
        </div>
        
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Current Scene ID</label>
          <input 
            type="text" 
            value={currentSceneId || ''} 
            onChange={handleSceneIdChange}
            placeholder="Scene ID" 
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold">Player Choices</label>
            <button 
              onClick={handleAddChoice}
              className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Add Choice
            </button>
          </div>
          
          {playerChoices.map(choice => (
            <div key={choice.id} className="flex items-center mb-2">
              <input 
                type="text" 
                value={choice.text} 
                onChange={(e) => handleChoiceTextChange(choice.id, e.target.value)}
                className="flex-grow p-2 border rounded mr-2"
              />
              <button 
                onClick={() => handleRemoveChoice(choice.id)}
                className="px-2 py-1 bg-red-500 text-white rounded text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 rounded border border-yellow-200">
          <h3 className="text-lg font-semibold mb-2">Testing Instructions</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Test each session status (initializing, loading, active, paused)</li>
            <li>Test error handling by toggling &quot;Has Error&quot;</li>
            <li>Test with different scene IDs</li>
            <li>Add, edit, and remove player choices</li>
            <li>Click on player choices to test selection</li>
            <li>Test pause/resume functionality</li>
            <li>Test end session functionality</li>
          </ol>
        </div>
      </div>
      
      {/* GameSession Component */}
      <div className="w-full md:w-2/3 border rounded-md">
        <div className="bg-gray-100 p-2 font-semibold border-b">
          GameSession Component (worldId: {testWorldId})
        </div>
        <div className="p-4">
          <GameSession 
            worldId={testWorldId} 
            _stores={mockStores}
            _router={mockRouter}
            initialState={{
              status,
              error: hasError ? errorMessage : null,
              currentSceneId,
              playerChoices,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default GameSessionTestHarness;