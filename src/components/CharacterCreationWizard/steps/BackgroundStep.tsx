import React from 'react';
import { WizardFormSection } from '@/components/shared/wizard';
import { ErrorBlock } from '@/components/shared';
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

  const handlePhysicalDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({
      background: {
        ...data.characterData.background,
        physicalDescription: e.target.value,
      },
    });
  };

  const validation = data.validation[4];
  const showErrors = validation?.touched && !validation?.valid;

  return (
    <div className="component-background-step">
      <WizardFormSection
        title="Character Background"
        description="Provide details about your character's history, personality, and motivations."
      >
      {/* Helpful tip */}
      <div>
        <p>
          A compelling backstory helps bring your character to life and
          provides context for their actions and decisions in the game.
        </p>
      </div>

      <div>
        <Label htmlFor="character-history">
          Character History <span>*</span>
        </Label>
        <Textarea
          id="character-history"
          value={data.characterData.background.history}
          onChange={handleHistoryChange}
          rows={6}
          placeholder="Describe your character's background and history... (minimum 50 characters)"
        />
        <p>
          {data.characterData.background.history.length} / 50 characters minimum
        </p>
      </div>

      <div>
        <Label htmlFor="character-personality">
          Personality <span>*</span>
        </Label>
        <Textarea
          id="character-personality"
          value={data.characterData.background.personality}
          onChange={handlePersonalityChange}
          rows={4}
          placeholder="Describe your character's personality traits... (minimum 30 characters)"
        />
        <p>
          {data.characterData.background.personality.length} / 30 characters minimum
        </p>
      </div>

      <div>
        <Label htmlFor="character-physical-description">
          Physical Appearance
        </Label>
        <Textarea
          id="character-physical-description"
          value={data.characterData.background.physicalDescription || ''}
          onChange={handlePhysicalDescriptionChange}
          rows={4}
          placeholder="Describe your character's physical appearance... (optional)"
        />
        <p>
          Optional field to describe how your character looks
        </p>
      </div>

      <div>
        <Label htmlFor="character-motivation">
          Motivation (optional)
        </Label>
        <Input
          id="character-motivation"
          type="text"
          value={data.characterData.background.motivation}
          onChange={handleMotivationChange}
          placeholder="What drives your character?"
        />
        <p>
          Optional field to help define your character&apos;s driving force
        </p>
      </div>

      <div>
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
        <ErrorBlock errors={validation.errors} />
      )}
      </WizardFormSection>
    </div>
  );
};
