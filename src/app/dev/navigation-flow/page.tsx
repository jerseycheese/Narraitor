'use client';

import React, { useState } from 'react';
import { GameStartWizard } from '@/components/GameStartWizard';
import { Breadcrumbs } from '@/components/Navigation/Breadcrumbs';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore, type StoreCharacter } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { useNavigationFlow } from '@/hooks/useNavigationFlow';
import { formatDateTime } from '@/lib/utils';
import Logger from '@/lib/utils/logger';

const logger = new Logger('NavigationFlowDev');

export default function NavigationFlowTestPage() {
  const [activeTest, setActiveTest] = useState<'wizard' | 'breadcrumbs' | 'flow'>('wizard');
  const [wizardWorldId, setWizardWorldId] = useState<string>('');
  const [wizardCharacterId, setWizardCharacterId] = useState<string>('');
  
  const { worlds } = useWorldStore();
  const { characters } = useCharacterStore();
  const { savedSessions } = useSessionStore();
  const { getNextStep, canQuickStart, getQuickStartInfo, getCurrentFlowStep } = useNavigationFlow();

  const worldList = Object.values(worlds);
  const characterList = Object.values(characters) as StoreCharacter[];
  const sessionList = Object.values(savedSessions);

  return (
    <div>
      <div>
        <header>
          <h1>Navigation Flow Test Harness</h1>
          <p>
            Test the enhanced navigation components and flow logic
          </p>
        </header>

        {/* Test Navigation */}
        <div>
          <h2>Test Components</h2>
          <div>
            <button
              onClick={() => setActiveTest('wizard')}
              className={`${
                activeTest === 'wizard'
                  ? ''
                  : ''
              }`}
            >
              Game Start Wizard
            </button>
            <button
              onClick={() => setActiveTest('breadcrumbs')}
              className={`${
                activeTest === 'breadcrumbs'
                  ? ''
                  : ''
              }`}
            >
              Enhanced Breadcrumbs
            </button>
            <button
              onClick={() => setActiveTest('flow')}
              className={`${
                activeTest === 'flow'
                  ? ''
                  : ''
              }`}
            >
              Flow Logic
            </button>
          </div>
        </div>

        {/* Current State Display */}
        <div>
          <h2>Current App State</h2>
          <div>
            <div>
              <h3>Worlds ({worldList.length})</h3>
              <div>
                {worldList.length === 0 ? (
                  <p>No worlds created</p>
                ) : (
                  worldList.map(world => (
                    <div key={world.id} >
                      {world.name} ({world.genre})
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3>Characters ({characterList.length})</h3>
              <div>
                {characterList.length === 0 ? (
                  <p>No characters created</p>
                ) : (
                  characterList.map(character => (
                    <div key={character.id} >
                      {character.name} ({worlds[character.worldId]?.name || 'Unknown World'})
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3>Saved Sessions ({sessionList.length})</h3>
              <div>
                {sessionList.length === 0 ? (
                  <p>No saved sessions</p>
                ) : (
                  sessionList.map(session => (
                    <div key={session.id} >
                      {worlds[session.worldId]?.name || 'Unknown'} / {characters[session.characterId]?.name || 'Unknown'}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Test Component Display */}
        <div>
          {activeTest === 'wizard' && (
            <div>
              <h2>Game Start Wizard</h2>
              <div>
                <h3>Wizard Configuration</h3>
                <div>
                  <div>
                    <label>
                      Initial World ID (optional)
                    </label>
                    <select
                      value={wizardWorldId}
                      onChange={(e) => setWizardWorldId(e.target.value)}
                    >
                      <option value="">No pre-selection</option>
                      {worldList.map(world => (
                        <option key={world.id} value={world.id}>{world.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>
                      Initial Character ID (optional)
                    </label>
                    <select
                      value={wizardCharacterId}
                      onChange={(e) => setWizardCharacterId(e.target.value)}
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
                onCancel={() => logger.debug('Wizard cancelled')}
              />
            </div>
          )}

          {activeTest === 'breadcrumbs' && (
            <div>
              <h2>Enhanced Breadcrumbs</h2>
              <div>
                <div>
                  <h3>Standard Breadcrumbs</h3>
                  <div>
                    <Breadcrumbs />
                  </div>
                </div>
                <div>
                  <h3>With Next Step Guidance</h3>
                  <div>
                    <Breadcrumbs showNextStep />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTest === 'flow' && (
            <div>
              <h2>Navigation Flow Logic</h2>
              <div>
                <div>
                  <div>
                    <h3>Current Flow State</h3>
                    <div>
                      <div>
                        <span>Current Step:</span>{' '}
                        <span>{getCurrentFlowStep()}</span>
                      </div>
                      <div>
                        <span>Can Quick Start:</span>{' '}
                        <span>
                          {canQuickStart() ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3>Next Step</h3>
                    <div>
                      {(() => {
                        const nextStep = getNextStep();
                        if (!nextStep) {
                          return <p>No next step (already playing)</p>;
                        }
                        return (
                          <div>
                            <div><span>Label:</span> {nextStep.label}</div>
                            <div><span>Action:</span> {nextStep.action}</div>
                            <div><span>Href:</span> {nextStep.href}</div>
                            <div><span>Enabled:</span> {nextStep.isEnabled ? 'Yes' : 'No'}</div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3>Quick Start Info</h3>
                  <div>
                    {(() => {
                      const quickStartInfo = getQuickStartInfo();
                      if (!quickStartInfo) {
                        return <p>No quick start available</p>;
                      }
                      return (
                        <div>
                          <div><span>World:</span> {quickStartInfo.worldName}</div>
                          <div><span>Character:</span> {quickStartInfo.characterName}</div>
                          <div><span>Progress:</span> {quickStartInfo.narrativeCount} entries</div>
                          <div><span>Last Played:</span> {formatDateTime(quickStartInfo.lastPlayed)}</div>
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
