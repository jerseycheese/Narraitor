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
    <main className="p-8">
      <h2 className="text-2xl font-bold mb-6">World Creation Wizard Test Harness</h2>

      {/* Controls */}
      <section className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Test Controls</h2>
        
        <form className="mb-4">
          <div className="mb-4">
            <label className="block mb-2">
              AI Response Delay (ms):
              <input
                type="number"
                value={mockAIDelay}
                onChange={(e) => setMockAIDelay(Number(e.target.value))}
                className="ml-2 p-1"
              />
            </label>
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={mockAIError}
                onChange={(e) => setMockAIError(e.target.checked)}
                className="mr-2"
              />
              Simulate AI Error
            </label>
          </div>

          <button
            type="button"
            onClick={resetWizard}
            className="py-2 px-4 bg-blue-500 text-white border-none rounded-md cursor-pointer hover:bg-blue-600 transition-colors"
          >
            Reset Wizard
          </button>
        </form>
      </section>

      {/* Results */}
      {wizardResult && (
        <section className="mb-8 p-4 bg-green-100 rounded-lg">
          <h3 className="font-bold mb-2">Result:</h3>
          <p>{wizardResult}</p>
        </section>
      )}

      {/* Wizard */}
      {showWizard && (
        <section className="border border-gray-200 rounded-lg overflow-hidden">
          <WorldCreationWizard onComplete={handleComplete} onCancel={handleCancel} />
        </section>
      )}

      {/* State Inspector */}
      <aside className="mt-8">
        <h2 className="text-xl font-bold mb-4">
          Mock Data Reference
        </h2>
        <div className="bg-gray-50 p-4 rounded-md">
          <pre className="text-sm">
            {JSON.stringify({ mockAttributes, mockSkills }, null, 2)}
          </pre>
        </div>
      </aside>
    </main>
  );
}
