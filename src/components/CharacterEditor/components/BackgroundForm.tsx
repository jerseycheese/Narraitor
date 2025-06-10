import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
        <div className="space-y-2">
          <Label>
            History
          </Label>
          <Textarea
            value={background.history || ''}
            onChange={(e) => handleChange('history', e.target.value)}
            rows={4}
            placeholder="Describe your character's history and background..."
          />
        </div>
        
        <div className="space-y-2">
          <Label>
            Personality
          </Label>
          <Textarea
            value={background.personality || ''}
            onChange={(e) => handleChange('personality', e.target.value)}
            rows={3}
            placeholder="Describe your character's personality traits..."
          />
        </div>
        
        <div className="space-y-2">
          <Label>
            Goals & Motivations
          </Label>
          <Textarea
            value={background.goals?.join('\n') || ''}
            onChange={(e) => handleChange('goals', e.target.value.split('\n').filter(g => g.trim()))}
            rows={3}
            placeholder="List your character's goals and motivations (one per line)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter each goal on a separate line
          </p>
        </div>
        
        <div className="space-y-2">
          <Label>
            Fears
          </Label>
          <Textarea
            value={background.fears?.join('\n') || ''}
            onChange={(e) => handleChange('fears', e.target.value.split('\n').filter(f => f.trim()))}
            rows={2}
            placeholder="What does your character fear? (one per line)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter each fear on a separate line
          </p>
        </div>
        
        <div className="space-y-2">
          <Label>
            Physical Description
          </Label>
          <Textarea
            value={background.physicalDescription || ''}
            onChange={(e) => handleChange('physicalDescription', e.target.value)}
            rows={3}
            placeholder="Describe your character's appearance, distinctive features, clothing style..."
          />
          <p className="text-xs text-gray-500 mt-1">
            This description will be used when generating character portraits. Tip: Add &quot;looks like [actor name]&quot; to generate a portrait resembling a specific person.
          </p>
        </div>
      </div>
    </div>
  );
};
