'use client';

import React, { useState } from 'react';
import { ChoiceSelector, SimpleChoice } from '@/components/shared/ChoiceSelector';
import { Decision } from '@/types/narrative.types';
import { generateUniqueId } from '@/lib/utils/generateId';

export default function CustomChoiceInputTestPage() {
  const [submittedChoices, setSubmittedChoices] = useState<Array<{
    id: string;
    text: string;
    isCustom: boolean;
    timestamp: Date;
  }>>([]);

  const simpleChoices: SimpleChoice[] = [
    { id: 'choice-1', text: 'Enter the mysterious cave' },
    { id: 'choice-2', text: 'Continue along the forest path' },
    { id: 'choice-3', text: 'Set up camp for the night' },
  ];

  const complexDecision: Decision = {
    id: 'decision-1',
    prompt: 'You encounter a locked door blocking your path. How do you proceed?',
    options: [
      {
        id: 'opt-1',
        text: 'Pick the lock',
        hint: 'Requires Lockpicking skill (difficulty: medium)',
      },
      {
        id: 'opt-2',
        text: 'Force the door open',
        hint: 'Requires high Strength (difficulty: hard)',
      },
      {
        id: 'opt-3',
        text: 'Look for another way around',
        hint: 'Safe but time-consuming',
      },
    ],
  };

  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);

  const handleChoiceSelected = (choiceId: string) => {
    console.log('Choice selected:', choiceId);
    setSelectedChoiceId(choiceId);
    
    // Find the choice text
    const choice = simpleChoices.find(c => c.id === choiceId);
    if (choice) {
      setSubmittedChoices(prev => [...prev, {
        id: generateUniqueId(),
        text: choice.text,
        isCustom: false,
        timestamp: new Date()
      }]);
    }
  };

  const handleDecisionSelected = (choiceId: string) => {
    console.log('Decision selected:', choiceId);
    setSelectedDecisionId(choiceId);
    
    // Find the option text
    const option = complexDecision.options.find(opt => opt.id === choiceId);
    if (option) {
      setSubmittedChoices(prev => [...prev, {
        id: generateUniqueId(),
        text: option.text,
        isCustom: false,
        timestamp: new Date()
      }]);
    }
  };

  const handleCustomSubmit = (customText: string) => {
    console.log('Custom input submitted:', customText);
    setSubmittedChoices(prev => [...prev, {
      id: generateUniqueId(),
      text: customText,
      isCustom: true,
      timestamp: new Date()
    }]);
  };

  const clearHistory = () => {
    setSubmittedChoices([]);
    setSelectedChoiceId(null);
    setSelectedDecisionId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Custom Choice Input Test Harness
          </h1>
          <p className="text-gray-600">
            Test the custom player input functionality in different choice selector scenarios.
          </p>
        </div>

        <div className="space-y-8">
          {/* Controls */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setIsDisabled(!isDisabled)}
                className={`px-4 py-2 rounded transition-colors ${
                  isDisabled 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isDisabled ? 'Enable Choices' : 'Disable Choices'}
              </button>
              <button
                onClick={clearHistory}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Clear History
              </button>
            </div>
          </div>

          {/* Simple Choices Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Simple Choices with Custom Input</h2>
            <ChoiceSelector
              choices={simpleChoices.map(choice => ({
                ...choice,
                isSelected: choice.id === selectedChoiceId
              }))}
              onSelect={handleChoiceSelected}
              onCustomSubmit={handleCustomSubmit}
              enableCustomInput={true}
              isDisabled={isDisabled}
              customInputPlaceholder="Describe your own action..."
            />
          </div>

          {/* Complex Decision Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Complex Decision with Custom Input</h2>
            <ChoiceSelector
              decision={{
                ...complexDecision,
                selectedOptionId: selectedDecisionId || undefined
              }}
              onSelect={handleDecisionSelected}
              onCustomSubmit={handleCustomSubmit}
              enableCustomInput={true}
              isDisabled={isDisabled}
              customInputPlaceholder="Think of a creative solution..."
              maxCustomLength={150}
            />
          </div>

          {/* Character Limit Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Character Limit Test (50 chars)</h2>
            <ChoiceSelector
              choices={[
                { id: 'short-1', text: 'Quick action' },
                { id: 'short-2', text: 'Another option' },
              ]}
              onSelect={() => {}}
              onCustomSubmit={handleCustomSubmit}
              enableCustomInput={true}
              isDisabled={isDisabled}
              customInputPlaceholder="Short response only..."
              maxCustomLength={50}
            />
          </div>

          {/* Custom Input Only Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Custom Input Only (No Predefined Choices)</h2>
            <ChoiceSelector
              choices={[]}
              onSelect={() => {}}
              onCustomSubmit={handleCustomSubmit}
              enableCustomInput={true}
              isDisabled={isDisabled}
              prompt="What would you like to do? (Custom input only)"
              customInputPlaceholder="Type anything you want to try..."
            />
          </div>

          {/* History Display */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Submission History</h2>
            {submittedChoices.length === 0 ? (
              <p className="text-gray-500 italic">No choices submitted yet.</p>
            ) : (
              <div className="space-y-2">
                {submittedChoices.map((choice) => (
                  <div
                    key={choice.id}
                    className={`p-3 rounded border-l-4 ${
                      choice.isCustom 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-500 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          choice.isCustom 
                            ? 'bg-blue-200 text-blue-800' 
                            : 'bg-gray-200 text-gray-800'
                        }`}>
                          {choice.isCustom ? 'Custom Input' : 'Predefined Choice'}
                        </span>
                        <p className="mt-2 font-medium">{choice.text}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {choice.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Scenarios */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Scenarios</h2>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 rounded">
                <h3 className="font-medium text-blue-900">Scenario 1: Basic Custom Input</h3>
                <p className="text-blue-700">Try typing a custom action in any of the choice selectors above.</p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <h3 className="font-medium text-green-900">Scenario 2: Character Limits</h3>
                <p className="text-green-700">Test the character limit enforcement by typing a long message in the 50-character limit section.</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded">
                <h3 className="font-medium text-yellow-900">Scenario 3: Enter Key Submission</h3>
                <p className="text-yellow-700">Try submitting custom input using the Enter key instead of the Submit button.</p>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <h3 className="font-medium text-purple-900">Scenario 4: Disabled State</h3>
                <p className="text-purple-700">Toggle the disabled state and verify that custom input fields are properly disabled.</p>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <h3 className="font-medium text-red-900">Scenario 5: Empty Input</h3>
                <p className="text-red-700">Try submitting empty or whitespace-only input to verify validation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}