'use client';

import React, { useState } from 'react';
import { Decision, NarrativeSegment } from '@/types/narrative.types';
import ChoiceSelector from '@/components/shared/ChoiceSelector/ChoiceSelector';
import { NarrativeDisplay } from '@/components/Narrative/NarrativeDisplay';
import { generateUniqueId } from '@/lib/utils/generateId';

export default function DecisionPointsTestPage() {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');

  // Sample narrative segments
  const sampleSegments: NarrativeSegment[] = [
    {
      id: 'seg-1',
      content: 'You stand at the crossroads of the ancient forest path. The moonlight filters through the dense canopy above, casting eerie shadows that dance across the ground. To your left, mysterious blue lights flicker between the dark trees, pulsing with an otherworldly rhythm.',
      type: 'scene',
      metadata: {
        location: 'Ancient Forest Crossroads',
        mood: 'mysterious',
        tags: ['forest', 'crossroads', 'night', 'mysterious']
      },
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'seg-2',
      content: 'As you approach the village, you notice smoke rising from several buildings. The town guards are running frantically through the streets, shouting orders. A young girl runs up to you, tears streaming down her face.',
      type: 'scene',
      metadata: {
        location: 'Village Outskirts',
        mood: 'tense',
        tags: ['village', 'emergency', 'guards', 'crisis']
      },
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Sample decisions with different weights and context
  const sampleDecisions: Record<string, Decision> = {
    'decision-minor': {
      id: 'decision-minor',
      prompt: 'What will you do with the strange coin you found?',
      contextSummary: 'You discovered an old coin with unusual markings while searching the abandoned house.',
      decisionWeight: 'minor',
      options: [
        { id: 'option-1', text: 'Keep the coin for later examination', alignment: 'neutral' },
        { id: 'option-2', text: 'Show it to the local historian', alignment: 'lawful' },
        { id: 'option-3', text: 'Try to sell it at the market', alignment: 'chaotic' }
      ]
    },
    'decision-major': {
      id: 'decision-major',
      prompt: 'Which path will you choose?',
      contextSummary: 'The forest crossroads offers three distinct paths, each leading to unknown dangers and opportunities.',
      decisionWeight: 'major',
      options: [
        { id: 'option-1', text: 'Follow the mysterious blue lights', alignment: 'chaotic', hint: 'Could lead to magical discoveries' },
        { id: 'option-2', text: 'Take the well-worn path straight ahead', alignment: 'neutral', hint: 'The safest but most predictable route' },
        { id: 'option-3', text: 'Head towards the sound of running water', alignment: 'lawful', hint: 'Water often means civilization' }
      ]
    },
    'decision-critical': {
      id: 'decision-critical',
      prompt: 'How will you respond to this crisis?',
      contextSummary: 'The village is under attack and the townspeople are looking to you for leadership in this desperate hour.',
      decisionWeight: 'critical',
      options: [
        { id: 'option-1', text: 'Rally the guards and organize a defense', alignment: 'lawful', hint: 'Leadership in times of crisis' },
        { id: 'option-2', text: 'Help evacuate the civilians to safety', alignment: 'neutral', hint: 'Protect the innocent' },
        { id: 'option-3', text: 'Investigate the source of the attack', alignment: 'chaotic', hint: 'Stop the threat at its source' }
      ]
    }
  };

  const handleChoiceSelect = (choiceId: string) => {
    setSelectedChoiceId(choiceId);
  };

  const handleCustomSubmit = (text: string) => {
    setCustomInput(text);
    setSelectedChoiceId(`custom-${generateUniqueId('choice')}`);
  };

  const resetSelection = () => {
    setSelectedChoiceId('');
    setCustomInput('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Choice Presentation Test Harness</h1>
          <p className="text-gray-600">
            Test the enhanced choice presentation system with context summaries, 
            decision weight styling, and improved visual clarity.
          </p>
        </div>


        {/* Enhanced Choice Selectors */}
        <div className="mb-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Enhanced Choice Selectors</h2>
          <div className="space-y-8">
            {Object.entries(sampleDecisions).map(([key, decision]) => (
              <div key={key}>
                <h3 className="text-lg font-semibold mb-3 capitalize">
                  {decision.decisionWeight} Decision Example
                </h3>
                <ChoiceSelector
                  decision={decision}
                  onSelect={handleChoiceSelect}
                  onCustomSubmit={handleCustomSubmit}
                  enableCustomInput={true}
                  isDisabled={false}
                />
                {selectedChoiceId && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-700">
                      <strong>Selected:</strong> {selectedChoiceId}
                      {customInput && <span> - Custom input: &ldquo;{customInput}&rdquo;</span>}
                    </p>
                  </div>
                )}
                <button
                  onClick={resetSelection}
                  className="mt-2 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Reset Selection
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Narrative Flow with Enhanced Choices */}
        <div className="mb-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Narrative Flow with Enhanced Choices</h2>
          <div className="space-y-6">
            {sampleSegments.map((segment, index) => {
              const isLastSegment = index === sampleSegments.length - 1;
              // For demo purposes, show different decision types for different segments
              const decisionKey = index === 0 ? 'decision-major' : 'decision-critical';
              const associatedDecision = sampleDecisions[decisionKey];
              
              return (
                <div key={segment.id} className="space-y-4">
                  <NarrativeDisplay segment={segment} />
                  
                  {/* Show choices for the last segment */}
                  {isLastSegment && associatedDecision && (
                    <div className="mt-4">
                      <ChoiceSelector
                        decision={associatedDecision}
                        onSelect={handleChoiceSelect}
                        onCustomSubmit={handleCustomSubmit}
                        enableCustomInput={true}
                        isDisabled={false}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Responsiveness Test */}
        <div className="mb-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Mobile Responsiveness</h2>
          <p className="text-gray-600 mb-4">
            Resize your browser window to test mobile behavior of the enhanced choice selector.
          </p>
          <div className="max-w-sm mx-auto border-2 border-gray-300 rounded-lg p-4">
            <div className="space-y-4">
              <NarrativeDisplay segment={sampleSegments[0]} />
              <ChoiceSelector
                decision={sampleDecisions['decision-major']}
                onSelect={handleChoiceSelect}
                onCustomSubmit={handleCustomSubmit}
                enableCustomInput={true}
                isDisabled={false}
              />
            </div>
          </div>
        </div>

        {/* Accessibility Test */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Accessibility Features</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold mb-2">ARIA Labels and Roles</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Choice selectors use role=&ldquo;group&rdquo; and aria-labelledby</li>
                <li>• Individual choices use role=&ldquo;radio&rdquo; and aria-checked</li>
                <li>• Custom input has proper aria-label</li>
                <li>• Context summaries are properly associated with choices</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="font-semibold mb-2">Keyboard Navigation</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Tab through choices and custom input field</li>
                <li>• Enter key submits custom input</li>
                <li>• Shift+Enter for new lines in custom input</li>
                <li>• Focus management for better UX</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded">
              <h3 className="font-semibold mb-2">Visual Cues</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Decision weight: Border thickness (2px/4px/6px) + color coding</li>
                <li>• Minor: Gray border (2px) - routine decisions</li>
                <li>• Major: Yellow border (4px) - important decisions</li>
                <li>• Critical: Bright red border (6px) - urgent/high-stakes decisions</li>
                <li>• Choice alignment: Icons + muted colors</li>
                <li>• Lawful choices: ⚖️ icon + blue background</li>
                <li>• Chaotic choices: 🔥 icon + red background</li>
                <li>• Neutral choices: No icon + gray background</li>
                <li>• Clear visual separation from narrative text</li>
                <li>• Responsive design for all screen sizes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}