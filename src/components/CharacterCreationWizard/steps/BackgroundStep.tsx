import React from 'react';

interface BackgroundStepProps {
  data: any;
  onUpdate: (updates: any) => void;
  onValidation: (valid: boolean, errors: string[]) => void;
  worldConfig: any;
}

export const BackgroundStep: React.FC<BackgroundStepProps> = ({
  data,
  onUpdate,
  onValidation,
}) => {
  const handleHistoryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({
      background: {
        ...data.characterData.background,
        history: e.target.value,
      },
    });
  };

  const handlePersonalityChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({
      background: {
        ...data.characterData.background,
        personality: e.target.value,
      },
    });
  };

  const handleMotivationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      background: {
        ...data.characterData.background,
        motivation: e.target.value,
      },
    });
  };

  const handleGoalsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const goals = e.target.value.split('\n').filter(goal => goal.trim());
    onUpdate({
      background: {
        ...data.characterData.background,
        goals,
      },
    });
  };

  const validation = data.validation[3];
  const showErrors = validation?.touched && !validation?.valid;

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="character-history" className="block text-sm font-medium text-gray-700 mb-1">
          Character History
        </label>
        <textarea
          id="character-history"
          value={data.characterData.background.history}
          onChange={handleHistoryChange}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe your character's background and history... (minimum 50 characters)"
        />
        <p className="mt-1 text-sm text-gray-500">
          {data.characterData.background.history.length} / 50 characters minimum
        </p>
      </div>

      <div>
        <label htmlFor="character-personality" className="block text-sm font-medium text-gray-700 mb-1">
          Personality
        </label>
        <textarea
          id="character-personality"
          value={data.characterData.background.personality}
          onChange={handlePersonalityChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe your character's personality traits... (minimum 20 characters)"
        />
        <p className="mt-1 text-sm text-gray-500">
          {data.characterData.background.personality.length} / 20 characters minimum
        </p>
      </div>

      <div>
        <label htmlFor="character-motivation" className="block text-sm font-medium text-gray-700 mb-1">
          Motivation
        </label>
        <input
          id="character-motivation"
          type="text"
          value={data.characterData.background.motivation}
          onChange={handleMotivationChange}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="What drives your character?"
        />
      </div>

      <div>
        <label htmlFor="character-goals" className="block text-sm font-medium text-gray-700 mb-1">
          Goals (one per line)
        </label>
        <textarea
          id="character-goals"
          value={data.characterData.background.goals.join('\n')}
          onChange={handleGoalsChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your character's goals, one per line"
        />
      </div>

      {/* Validation errors */}
      {showErrors && (
        <div className="bg-red-50 p-4 rounded">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded">
        <p className="text-sm text-blue-800">
          Provide background information to bring your character to life. A rich backstory 
          helps create more engaging narratives.
        </p>
      </div>
    </div>
  );
};