'use client';

import { useState } from 'react';
import WorldCreationWizard from '@/components/WorldCreationWizard/WorldCreationWizard';
import { AttributeSuggestion, SkillSuggestion } from '@/components/WorldCreationWizard/WorldCreationWizard';

export default function WorldCreationWizardTestHarness() {
  const [showWizard, setShowWizard] = useState(true);
  const [mockAIDelay, setMockAIDelay] = useState(1000);
  const [mockAIError, setMockAIError] = useState(false);
  const [wizardResult, setWizardResult] = useState<string | null>(null);

  // Mock AI suggestions
  const mockAttributes: AttributeSuggestion[] = [
    { name: 'Strength', description: 'Physical power', minValue: 1, maxValue: 10, accepted: false },
    { name: 'Intelligence', description: 'Mental acuity', minValue: 1, maxValue: 10, accepted: false },
    { name: 'Agility', description: 'Speed and dexterity', minValue: 1, maxValue: 10, accepted: false },
  ];

  const mockSkills: SkillSuggestion[] = [
    { name: 'Combat', description: 'Fighting ability', difficulty: 'medium', accepted: false },
    { name: 'Stealth', description: 'Moving unseen', difficulty: 'hard', accepted: false },
    { name: 'Persuasion', description: 'Social influence', difficulty: 'easy', accepted: false },
  ];

  const handleComplete = (worldId: string) => {
    setWizardResult(`World created with ID: ${worldId}`);
    setShowWizard(false);
  };

  const handleCancel = () => {
    setWizardResult('World creation cancelled');
    setShowWizard(false);
  };

  const resetWizard = () => {
    setShowWizard(true);
    setWizardResult(null);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        World Creation Wizard Test Harness
      </h1>

      {/* Controls */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Test Controls</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            AI Response Delay (ms):
            <input
              type="number"
              value={mockAIDelay}
              onChange={(e) => setMockAIDelay(Number(e.target.value))}
              style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>
            <input
              type="checkbox"
              checked={mockAIError}
              onChange={(e) => setMockAIError(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            Simulate AI Error
          </label>
        </div>

        <button
          onClick={resetWizard}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
          }}
        >
          Reset Wizard
        </button>
      </div>

      {/* Results */}
      {wizardResult && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#d1fae5', borderRadius: '0.5rem' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Result:</h3>
          <p>{wizardResult}</p>
        </div>
      )}

      {/* Wizard */}
      {showWizard && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
          <WorldCreationWizard onComplete={handleComplete} onCancel={handleCancel} />
        </div>
      )}

      {/* State Inspector */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Mock Data Reference
        </h2>
        <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.375rem' }}>
          <pre style={{ fontSize: '0.875rem' }}>
            {JSON.stringify({ mockAttributes, mockSkills }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
