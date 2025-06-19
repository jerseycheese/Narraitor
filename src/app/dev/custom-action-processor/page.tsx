/**
 * Custom Action Processor Test Harness
 * 
 * Test page for the AI-powered skill detection system. Allows manual testing
 * of the CustomActionProcessor component with different character configurations.
 * 
 * Features:
 * - High/Low skill character toggles for testing success/failure scenarios
 * - Real-time AI skill detection with confidence scores and reasoning
 * - Visual display of skill check results and character skill levels
 * 
 * Test Examples:
 * - "Convince the guard I am his friend" → Charisma skill detection
 * - "I hack into the mainframe" → Computer Use skill detection  
 * - "I push my way past the guard" → Athletics + Intimidation detection
 * - "I drop my pants and do the moonwalk" → No skills (correctly identified)
 */

'use client';

import React, { useState } from 'react';
import CustomActionProcessor, { CustomActionResult } from '@/components/shared/CustomActionProcessor';

const mockCharacter = {
  skills: [
    { id: '1', characterId: 'char1', name: 'Intimidation', level: 4, worldSkillId: 'intimidation' },
    { id: '2', characterId: 'char1', name: 'Stealth', level: 2, worldSkillId: 'stealth' },
    { id: '3', characterId: 'char1', name: 'Charisma', level: 5, worldSkillId: 'charisma' },
    { id: '4', characterId: 'char1', name: 'Athletics', level: 3, worldSkillId: 'athletics' },
    { id: '5', characterId: 'char1', name: 'Computer Use', level: 1, worldSkillId: 'computer-use' },
    { id: '6', characterId: 'char1', name: 'Investigation', level: 3, worldSkillId: 'investigation' },
    { id: '7', characterId: 'char1', name: 'Deception', level: 2, worldSkillId: 'deception' },
  ]
};

const lowSkillCharacter = {
  skills: [
    { id: '1', characterId: 'char2', name: 'Intimidation', level: 1, worldSkillId: 'intimidation' },
    { id: '2', characterId: 'char2', name: 'Stealth', level: 1, worldSkillId: 'stealth' },
    { id: '3', characterId: 'char2', name: 'Charisma', level: 1, worldSkillId: 'charisma' },
    { id: '4', characterId: 'char2', name: 'Athletics', level: 1, worldSkillId: 'athletics' },
    { id: '5', characterId: 'char2', name: 'Computer Use', level: 1, worldSkillId: 'computer-use' },
    { id: '6', characterId: 'char2', name: 'Investigation', level: 1, worldSkillId: 'investigation' },
    { id: '7', characterId: 'char2', name: 'Deception', level: 1, worldSkillId: 'deception' },
  ]
};

export default function CustomActionProcessorTestPage() {
  const [results, setResults] = useState<CustomActionResult[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<'high' | 'low'>('high');

  const handleActionSubmit = (result: CustomActionResult) => {
    setResults(prev => [result, ...prev]);
  };

  const currentCharacter = selectedCharacter === 'high' ? mockCharacter : lowSkillCharacter;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Custom Action Processor Test</h1>
        <p className="text-gray-600">
          Test the custom text action skill detection system. Try actions like:
        </p>
        <ul className="list-disc list-inside mt-2 text-sm text-gray-500">
          <li>&quot;I try to intimidate the guard into letting me pass&quot;</li>
          <li>&quot;I carefully sneak past the sleeping enemy&quot;</li>
          <li>&quot;I persuade the merchant to give me a discount&quot;</li>
          <li>&quot;I climb over the stone wall&quot;</li>
          <li>&quot;I search the room for hidden clues&quot;</li>
          <li>&quot;I examine the ancient artifact&quot;</li>
          <li>&quot;I sprint across the open courtyard&quot;</li>
        </ul>
      </div>

      {/* Character Selection */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">Test Character</h2>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="character"
              value="high"
              checked={selectedCharacter === 'high'}
              onChange={(e) => setSelectedCharacter(e.target.value as 'high' | 'low')}
              className="mr-2"
            />
            High Skill Character (Most checks will pass)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="character"
              value="low"
              checked={selectedCharacter === 'low'}
              onChange={(e) => setSelectedCharacter(e.target.value as 'high' | 'low')}
              className="mr-2"
            />
            Low Skill Character (Most checks will fail)
          </label>
        </div>
        
        <div className="text-sm">
          <h3 className="font-medium mb-2">Current Character Skills:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {currentCharacter.skills.map(skill => (
              <div key={skill.id} className="text-xs bg-white p-2 rounded border">
                <span className="font-medium">{skill.name}</span>: {skill.level}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Action Input */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Action Input</h2>
        <CustomActionProcessor
          character={currentCharacter}
          onActionSubmit={handleActionSubmit}
          placeholder="Describe what you want to do... (skill checks will be detected automatically)"
        />
      </div>

      {/* Results Display */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Action Results</h2>
        {results.length === 0 ? (
          <p className="text-gray-500 italic">No actions submitted yet. Try typing an action above!</p>
        ) : (
          results.map((result, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
              <h3 className="font-medium mb-2">Action: &quot;{result.text}&quot;</h3>
              
              {result.skillChecks.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">AI-Detected Skill Checks:</h4>
                  {result.skillChecks.map((check, checkIndex) => (
                    <div key={checkIndex} className="border-l-4 border-gray-200 pl-3 space-y-1">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-medium">{check.skillName}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          check.success 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {check.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {check.current}/{check.required} (Confidence: {Math.round(check.confidence * 100)}%)
                        </span>
                      </div>
                      {check.reasoning && (
                        <div className="text-xs text-gray-600 italic">
                          AI Reasoning: {check.reasoning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No skill checks detected for this action.</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Clear Results */}
      {results.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setResults([])}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Clear Results
          </button>
        </div>
      )}
    </div>
  );
}