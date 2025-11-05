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
    <div className="mt-3 border-t border-gray-300 pt-3">
      <CollapsibleSection
        title="🔧 Prompt Debug Info"
        initialCollapsed={true}
        className="text-xs"
      >
        <div className="space-y-4 text-gray-800 bg-gray-50 p-3 rounded">
          {/* Template Name */}
          <div>
            <div className="font-semibold text-gray-900 mb-1">Template Used:</div>
            <div className="font-mono text-blue-700">{debugInfo.templateName}</div>
          </div>

          {/* Model Info */}
          <div>
            <div className="font-semibold text-gray-900 mb-1">AI Model:</div>
            <div className="font-mono text-blue-700">{debugInfo.modelUsed}</div>
          </div>

          {/* Token Usage */}
          {debugInfo.tokenUsage && (
            <div>
              <div className="font-semibold text-gray-900 mb-1">Token Usage:</div>
              <div className="font-mono">
                <div>Prompt: {debugInfo.tokenUsage.promptTokens.toLocaleString()}</div>
                <div>Completion: {debugInfo.tokenUsage.completionTokens.toLocaleString()}</div>
                <div className="font-semibold">
                  Total: {debugInfo.tokenUsage.totalTokens.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Tone Settings */}
          {debugInfo.toneSettings && (
            <div>
              <div className="font-semibold text-gray-900 mb-1">Tone Settings:</div>
              <div className="space-y-1">
                {debugInfo.toneSettings.mood && (
                  <div>
                    <span className="font-medium">Mood:</span> {debugInfo.toneSettings.mood}
                  </div>
                )}
                {debugInfo.toneSettings.complexity && (
                  <div>
                    <span className="font-medium">Complexity:</span>{' '}
                    {debugInfo.toneSettings.complexity}
                  </div>
                )}
                {debugInfo.toneSettings.customTone && (
                  <div>
                    <span className="font-medium">Custom Instructions:</span>{' '}
                    {debugInfo.toneSettings.customTone}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Character Context */}
          {debugInfo.characterContext && debugInfo.characterContext.length > 0 && (
            <div>
              <div className="font-semibold text-gray-900 mb-1">Character Context:</div>
              <div className="space-y-1">
                {debugInfo.characterContext.map((char, idx) => (
                  <div key={idx} className="pl-2 border-l-2 border-blue-300">
                    <div className="font-medium">{char.name}</div>
                    {char.relevantTraits && char.relevantTraits.length > 0 && (
                      <div className="text-gray-600 text-xs">
                        Traits: {char.relevantTraits.join(', ')}
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
              <div className="font-semibold text-gray-900 mb-1">Active Goals:</div>
              <ul className="list-disc list-inside space-y-1">
                {debugInfo.activeGoals.map((goal, idx) => (
                  <li key={idx}>{goal}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Lore Context */}
          {debugInfo.loreContext && debugInfo.loreContext.length > 0 && (
            <div>
              <div className="font-semibold text-gray-900 mb-1">Lore Context:</div>
              <div className="space-y-2">
                {debugInfo.loreContext.map((lore, idx) => (
                  <div key={idx} className="pl-2 border-l-2 border-purple-300">
                    <div className="font-medium text-purple-900">{lore.title}</div>
                    <div className="text-gray-700 text-xs mt-1">{lore.excerpt}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Context */}
          {debugInfo.inventoryContext && debugInfo.inventoryContext.length > 0 && (
            <div>
              <div className="font-semibold text-gray-900 mb-1">Inventory Context:</div>
              <div className="space-y-1">
                {debugInfo.inventoryContext.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className={item.isEquipped ? 'font-semibold text-green-700' : ''}>
                      {item.itemName}
                    </span>
                    {item.isEquipped && (
                      <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded">
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
              <div className="font-semibold text-gray-900 mb-1">Recent Decisions:</div>
              <div className="space-y-2">
                {debugInfo.recentDecisions.map((decision, idx) => (
                  <div key={idx} className="pl-2 border-l-2 border-orange-300">
                    <div className="font-medium text-gray-900">{decision.decisionText}</div>
                    <div className="text-orange-700 font-semibold text-xs mt-1">
                      → {decision.selectedOption}
                    </div>
                    <div className="text-gray-600 text-xs">
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
              <div className="font-semibold text-gray-900 mb-1">Previous Segment:</div>
              <div className="pl-2 border-l-2 border-gray-400">
                <div className="text-xs text-gray-600 mb-1">
                  Type: {debugInfo.previousSegmentContext.type}
                </div>
                <div className="text-gray-700 italic">{debugInfo.previousSegmentContext.excerpt}</div>
              </div>
            </div>
          )}

          {/* Full Prompt */}
          <div>
            <CollapsibleSection title="Full Prompt Text" initialCollapsed={true}>
              <pre className="text-xs whitespace-pre-wrap bg-white p-3 rounded border border-gray-300 overflow-auto max-h-96 font-mono">
                {debugInfo.fullPrompt}
              </pre>
            </CollapsibleSection>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-600 border-t border-gray-300 pt-2">
            Generated at: {new Date(debugInfo.generatedAt).toLocaleString()}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};
