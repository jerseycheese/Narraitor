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
    { name: 'Strength', description: 'Physical power', minValue: 1, maxValue: 10, baseValue: 5, accepted: false },
    { name: 'Intelligence', description: 'Mental acuity', minValue: 1, maxValue: 10, baseValue: 7, accepted: false },
    { name: 'Agility', description: 'Speed and dexterity', minValue: 1, maxValue: 10, baseValue: 3, accepted: false },
  ];

  const mockSkills: SkillSuggestion[] = [
    { name: 'Combat', description: 'Fighting ability', difficulty: 'medium', accepted: false, baseValue: 5, minValue: 1, maxValue: 10, category: 'Physical' },
    { name: 'Stealth', description: 'Moving unseen', difficulty: 'hard', accepted: false, baseValue: 5, minValue: 1, maxValue: 10, category: 'Physical' },
    { name: 'Persuasion', description: 'Social influence', difficulty: 'easy', accepted: false, baseValue: 5, minValue: 1, maxValue: 10, category: 'Social' },
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
    <main>
      <h2>World Creation Wizard Test Harness</h2>

      {/* Controls */}
      <section>
        <h2>Test Controls</h2>
        
        <form>
          <div>
            <label>
              AI Response Delay (ms):
              <input
                type="number"
                value={mockAIDelay}
                onChange={(e) => setMockAIDelay(Number(e.target.value))}
                
              />
            </label>
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                checked={mockAIError}
                onChange={(e) => setMockAIError(e.target.checked)}
                
              />
              Simulate AI Error
            </label>
          </div>

          <button
            type="button"
            onClick={resetWizard}
            
          >
            Reset Wizard
          </button>
        </form>
      </section>

      {/* Results */}
      {wizardResult && (
        <section>
          <h3>Result:</h3>
          <p>{wizardResult}</p>
        </section>
      )}

      {/* Wizard */}
      {showWizard && (
        <section>
          <WorldCreationWizard onComplete={handleComplete} onCancel={handleCancel} />
        </section>
      )}

      {/* State Inspector */}
      <aside>
        <h2>
          Mock Data Reference
        </h2>
        <div>
          <pre>
            {JSON.stringify({ mockAttributes, mockSkills }, null, 2)}
          </pre>
        </div>
      </aside>
    </main>
  );
}
