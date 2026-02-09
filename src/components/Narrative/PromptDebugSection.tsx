'use client';

import React from 'react';
import { PromptDebugInfo } from '@/types/narrative.types';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

interface PromptDebugSectionProps {
  debugInfo: PromptDebugInfo;
}

/**
 * PromptDebugSection Component
 *
 * Displays prompt debug information in a collapsible section.
 * Shows all contributing factors that shaped the narrative text.
 *
 * Only rendered when DevTools "Show Prompts" toggle is enabled.
 */
export const PromptDebugSection: React.FC<PromptDebugSectionProps> = ({ debugInfo }) => {
  return (
    <div >
      <CollapsibleSection
        title="🔧 Prompt Debug Info"
        initialCollapsed={true}
        
      >
        <div >
          {/* Template Name */}
          <div>
            <div >Template Used:</div>
            <div >{debugInfo.templateName}</div>
          </div>

          {/* Model Info */}
          <div>
            <div >AI Model:</div>
            <div >{debugInfo.modelUsed}</div>
          </div>

          {/* Token Usage */}
          {debugInfo.tokenUsage && (
            <div>
              <div >Token Usage:</div>
              <div >
                <div>Prompt: {debugInfo.tokenUsage.promptTokens.toLocaleString()}</div>
                <div>Completion: {debugInfo.tokenUsage.completionTokens.toLocaleString()}</div>
                <div >
                  Total: {debugInfo.tokenUsage.totalTokens.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Tone Settings */}
          {debugInfo.toneSettings && (
            <div>
              <div >Tone Settings:</div>
              <div >
                {debugInfo.toneSettings.mood && (
                  <div>
                    <span >Mood:</span> {debugInfo.toneSettings.mood}
                  </div>
                )}
                {debugInfo.toneSettings.complexity && (
                  <div>
                    <span >Complexity:</span>{''}
                    {debugInfo.toneSettings.complexity}
                  </div>
                )}
                {debugInfo.toneSettings.customTone && (
                  <div>
                    <span >Custom Instructions:</span>{''}
                    {debugInfo.toneSettings.customTone}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Character Context */}
          {debugInfo.characterContext && debugInfo.characterContext.length > 0 && (
            <div>
              <div >Character Context:</div>
              <div >
                {debugInfo.characterContext.map((char, idx) => (
                  <div key={idx} >
                    <div >{char.name}</div>
                    {char.relevantTraits && char.relevantTraits.length > 0 && (
                      <div >
                        Traits: {char.relevantTraits.join(',')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Goals */}
          {debugInfo.activeGoals && debugInfo.activeGoals.length > 0 && (
            <div>
              <div >Active Goals:</div>
              <ul >
                {debugInfo.activeGoals.map((goal, idx) => (
                  <li key={idx}>{goal}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Lore Context */}
          {debugInfo.loreContext && debugInfo.loreContext.length > 0 && (
            <div>
              <div >Lore Context:</div>
              <div >
                {debugInfo.loreContext.map((lore, idx) => (
                  <div key={idx} >
                    <div >{lore.title}</div>
                    <div >{lore.excerpt}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Context */}
          {debugInfo.inventoryContext && debugInfo.inventoryContext.length > 0 && (
            <div>
              <div >Inventory Context:</div>
              <div >
                {debugInfo.inventoryContext.map((item, idx) => (
                  <div key={idx} >
                    <span className={item.isEquipped ? '' : ''}>
                      {item.itemName}
                    </span>
                    {item.isEquipped && (
                      <span >
                        Equipped
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Decisions */}
          {debugInfo.recentDecisions && debugInfo.recentDecisions.length > 0 && (
            <div>
              <div >Recent Decisions:</div>
              <div >
                {debugInfo.recentDecisions.map((decision, idx) => (
                  <div key={idx} >
                    <div >{decision.decisionText}</div>
                    <div >
                      → {decision.selectedOption}
                    </div>
                    <div >
                      {new Date(decision.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous Segment Context */}
          {debugInfo.previousSegmentContext && (
            <div>
              <div >Previous Segment:</div>
              <div >
                <div >
                  Type: {debugInfo.previousSegmentContext.type}
                </div>
                <div >{debugInfo.previousSegmentContext.excerpt}</div>
              </div>
            </div>
          )}

          {/* Full Prompt */}
          <div>
            <CollapsibleSection title="Full Prompt Text" initialCollapsed={true}>
              <pre >
                {debugInfo.fullPrompt}
              </pre>
            </CollapsibleSection>
          </div>

          {/* Timestamp */}
          <div >
            Generated at: {new Date(debugInfo.generatedAt).toLocaleString()}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};
