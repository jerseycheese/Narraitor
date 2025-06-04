import React from 'react';

interface Background {
  history: string;
  personality: string;
  goals: string[];
  fears: string[];
  physicalDescription?: string;
}

interface BackgroundFormProps {
  background: Background;
  onBackgroundChange: (background: Background) => void;
}

export const BackgroundForm: React.FC<BackgroundFormProps> = ({
  background,
  onBackgroundChange
}) => {
  const handleChange = (field: keyof Background, value: string | string[]) => {
    onBackgroundChange({
      ...background,
      [field]: value
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Background</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            History
          </label>
          <textarea
            value={background.history || ''}
            onChange={(e) => handleChange('history', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your character's history and background..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Personality
          </label>
          <textarea
            value={background.personality || ''}
            onChange={(e) => handleChange('personality', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your character's personality traits..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Goals & Motivations
          </label>
          <textarea
            value={background.goals?.join('\n') || ''}
            onChange={(e) => handleChange('goals', e.target.value.split('\n').filter(g => g.trim()))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="List your character's goals and motivations (one per line)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter each goal on a separate line
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fears
          </label>
          <textarea
            value={background.fears?.join('\n') || ''}
            onChange={(e) => handleChange('fears', e.target.value.split('\n').filter(f => f.trim()))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What does your character fear? (one per line)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter each fear on a separate line
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Physical Description
          </label>
          <textarea
            value={background.physicalDescription || ''}
            onChange={(e) => handleChange('physicalDescription', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your character's appearance, distinctive features, clothing style..."
          />
          <p className="text-xs text-gray-500 mt-1">
            This description will be used when generating character portraits. Tip: Add "looks like [actor name]" to generate a portrait resembling a specific person.
          </p>
        </div>
      </div>
    </div>
  );
};