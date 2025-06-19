'use client';

import React, { useState } from 'react';
import { QuickPlay } from '@/components/QuickPlay';
import { GameStartWizard } from '@/components/GameStartWizard';
import { Breadcrumbs } from '@/components/Navigation/Breadcrumbs';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { useNavigationFlow } from '@/hooks/useNavigationFlow';

export default function NavigationFlowTestPage() {
  const [activeTest, setActiveTest] = useState<'quickplay' | 'wizard' | 'breadcrumbs' | 'flow'>('quickplay');
  const [wizardWorldId, setWizardWorldId] = useState<string>('');
  const [wizardCharacterId, setWizardCharacterId] = useState<string>('');
  
  const { worlds } = useWorldStore();
  const { characters } = useCharacterStore();
  const { savedSessions } = useSessionStore();
  const { getNextStep, canQuickStart, getQuickStartInfo, getCurrentFlowStep } = useNavigationFlow();

  const worldList = Object.values(worlds);
  const characterList = Object.values(characters);
  const sessionList = Object.values(savedSessions);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Navigation Flow Test Harness</h1>
          <p className="text-gray-600">
            Test the enhanced navigation components and flow logic
          </p>
        </header>

        {/* Test Navigation */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Components</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTest('quickplay')}
              className={`px-4 py-2 rounded transition-colors ${
                activeTest === 'quickplay'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Quick Play
            </button>
            <button
              onClick={() => setActiveTest('wizard')}
              className={`px-4 py-2 rounded transition-colors ${
                activeTest === 'wizard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Game Start Wizard
            </button>
            <button
              onClick={() => setActiveTest('breadcrumbs')}
              className={`px-4 py-2 rounded transition-colors ${
                activeTest === 'breadcrumbs'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Enhanced Breadcrumbs
            </button>
            <button
              onClick={() => setActiveTest('flow')}
              className={`px-4 py-2 rounded transition-colors ${
                activeTest === 'flow'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Flow Logic
            </button>
          </div>
        </div>

        {/* Current State Display */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current App State</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Worlds ({worldList.length})</h3>
              <div className="space-y-1">
                {worldList.length === 0 ? (
                  <p className="text-gray-500">No worlds created</p>
                ) : (
                  worldList.map(world => (
                    <div key={world.id} className="text-gray-600">
                      {world.name} ({world.theme})
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Characters ({characterList.length})</h3>
              <div className="space-y-1">
                {characterList.length === 0 ? (
                  <p className="text-gray-500">No characters created</p>
                ) : (
                  characterList.map(character => (
                    <div key={character.id} className="text-gray-600">
                      {character.name} ({worlds[character.worldId]?.name || 'Unknown World'})
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Saved Sessions ({sessionList.length})</h3>
              <div className="space-y-1">
                {sessionList.length === 0 ? (
                  <p className="text-gray-500">No saved sessions</p>
                ) : (
                  sessionList.map(session => (
                    <div key={session.id} className="text-gray-600">
                      {worlds[session.worldId]?.name || 'Unknown'} / {characters[session.characterId]?.name || 'Unknown'}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Test Component Display */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTest === 'quickplay' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Quick Play Component</h2>
              <div className="max-w-2xl">
                <QuickPlay />
              </div>
            </div>
          )}

          {activeTest === 'wizard' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Game Start Wizard</h2>
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">Wizard Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial World ID (optional)
                    </label>
                    <select
                      value={wizardWorldId}
                      onChange={(e) => setWizardWorldId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No pre-selection</option>
                      {worldList.map(world => (
                        <option key={world.id} value={world.id}>{world.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial Character ID (optional)
                    </label>
                    <select
                      value={wizardCharacterId}
                      onChange={(e) => setWizardCharacterId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!wizardWorldId}
                    >
                      <option value="">No pre-selection</option>
                      {characterList
                        .filter(char => !wizardWorldId || char.worldId === wizardWorldId)
                        .map(character => (
                          <option key={character.id} value={character.id}>{character.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
              <GameStartWizard
                initialWorldId={wizardWorldId || undefined}
                initialCharacterId={wizardCharacterId || undefined}
                onCancel={() => console.log('Wizard cancelled')}
              />
            </div>
          )}

          {activeTest === 'breadcrumbs' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Enhanced Breadcrumbs</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Standard Breadcrumbs</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <Breadcrumbs />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">With Next Step Guidance</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <Breadcrumbs showNextStep />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTest === 'flow' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Navigation Flow Logic</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Current Flow State</h3>
                    <div className="bg-gray-50 p-4 rounded space-y-2">
                      <div>
                        <span className="font-medium">Current Step:</span>{' '}
                        <span className="text-blue-600">{getCurrentFlowStep()}</span>
                      </div>
                      <div>
                        <span className="font-medium">Can Quick Start:</span>{' '}
                        <span className={canQuickStart() ? 'text-green-600' : 'text-red-600'}>
                          {canQuickStart() ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Next Step</h3>
                    <div className="bg-gray-50 p-4 rounded">
                      {(() => {
                        const nextStep = getNextStep();
                        if (!nextStep) {
                          return <p className="text-gray-500">No next step (already playing)</p>;
                        }
                        return (
                          <div className="space-y-1">
                            <div><span className="font-medium">Label:</span> {nextStep.label}</div>
                            <div><span className="font-medium">Action:</span> {nextStep.action}</div>
                            <div><span className="font-medium">Href:</span> {nextStep.href}</div>
                            <div><span className="font-medium">Enabled:</span> {nextStep.isEnabled ? 'Yes' : 'No'}</div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Quick Start Info</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    {(() => {
                      const quickStartInfo = getQuickStartInfo();
                      if (!quickStartInfo) {
                        return <p className="text-gray-500">No quick start available</p>;
                      }
                      return (
                        <div className="space-y-1">
                          <div><span className="font-medium">World:</span> {quickStartInfo.worldName}</div>
                          <div><span className="font-medium">Character:</span> {quickStartInfo.characterName}</div>
                          <div><span className="font-medium">Progress:</span> {quickStartInfo.narrativeCount} entries</div>
                          <div><span className="font-medium">Last Played:</span> {new Date(quickStartInfo.lastPlayed).toLocaleString()}</div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
