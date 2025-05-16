import { useState } from 'react';
import WorldCreationWizard, { AttributeSuggestion, SkillSuggestion } from '../../../components/WorldCreationWizard/WorldCreationWizard';

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <header className="bg-blue-600 text-white p-4 mb-4 rounded shadow">
          <h1 className="text-2xl font-bold">Narraitor Development</h1>
          <p className="text-sm">Test environments for component development</p>
        </header>
        
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-8">
            World Creation Wizard Test Harness
          </h1>

          {/* Controls */}
          <div className="mb-8 p-4 bg-gray-100 rounded">
            <h2 className="text-xl font-bold mb-4">Test Controls</h2>
            
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
              onClick={resetWizard}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Reset Wizard
            </button>
          </div>

          {/* Results */}
          {wizardResult && (
            <div className="mb-8 p-4 bg-green-100 rounded">
              <h3 className="font-bold mb-2">Result:</h3>
              <p>{wizardResult}</p>
            </div>
          )}

          {/* Wizard */}
          {showWizard && (
            <div className="border border-gray-200 rounded overflow-hidden">
              <WorldCreationWizard onComplete={handleComplete} onCancel={handleCancel} />
            </div>
          )}

          {/* State Inspector */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">
              Mock Data Reference
            </h2>
            <div className="bg-gray-50 p-4 rounded">
              <pre className="text-sm">
                {JSON.stringify({ mockAttributes, mockSkills }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}