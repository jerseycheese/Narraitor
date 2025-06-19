import React from 'react';
import { WizardFormSection } from '@/components/shared/wizard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface BackgroundStepProps {
  data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onUpdate: (updates: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onValidation: (valid: boolean, errors: string[]) => void;
  worldConfig: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const BackgroundStep: React.FC<BackgroundStepProps> = ({
  data,
  onUpdate,
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
    <WizardFormSection
      title="Character Background"
      description="Provide details about your character's history, personality, and motivations."
    >
      {/* Helpful tip */}
      <div className="border rounded-lg p-4 bg-blue-50 mb-6">
        <p className="text-sm text-blue-800">
          A compelling backstory helps bring your character to life and 
          provides context for their actions and decisions in the game.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="character-history">
          Character History
        </Label>
        <Textarea
          id="character-history"
          value={data.characterData.background.history}
          onChange={handleHistoryChange}
          rows={6}
          placeholder="Describe your character's background and history... (minimum 50 characters)"
        />
        <p className="text-gray-500 text-sm mt-1">
          {data.characterData.background.history.length} / 50 characters minimum
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="character-personality">
          Personality
        </Label>
        <Textarea
          id="character-personality"
          value={data.characterData.background.personality}
          onChange={handlePersonalityChange}
          rows={4}
          placeholder="Describe your character's personality traits... (minimum 30 characters)"
        />
        <p className="text-gray-500 text-sm mt-1">
          {data.characterData.background.personality.length} / 30 characters minimum
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="character-motivation">
          Motivation
        </Label>
        <Input
          id="character-motivation"
          type="text"
          value={data.characterData.background.motivation}
          onChange={handleMotivationChange}
          placeholder="What drives your character? (minimum 10 characters)"
        />
        <p className="text-gray-500 text-sm mt-1">
          {data.characterData.background.motivation.length} / 10 characters minimum
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="character-goals">
          Goals (Optional)
        </Label>
        <Textarea
          id="character-goals"
          value={data.characterData.background.goals.join('\n')}
          onChange={handleGoalsChange}
          rows={3}
          placeholder="Enter your character's goals, one per line"
        />
      </div>

      {/* Validation errors */}
      {showErrors && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          {validation.errors.map((error: string, index: number) => (
            <p key={index} className="text-red-600 text-sm mt-1">
              {error}
            </p>
          ))}
        </div>
      )}
    </WizardFormSection>
  );
};
