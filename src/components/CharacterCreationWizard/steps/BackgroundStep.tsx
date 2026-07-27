import React from 'react';
import { WizardFormSection } from '@/components/shared/wizard';
import { ErrorBlock } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { CharacterCreationData } from '@/hooks/useCharacterCreationWizard';
import type { WizardValidation } from '@/hooks/useWizardState';
import type { World } from '@/types/world.types';
import { validateBackground } from '../utils/validation';

interface BackgroundStepData {
  characterData: CharacterCreationData;
  validation: Record<number, WizardValidation>;
}

interface BackgroundStepProps {
  data: BackgroundStepData;
  onUpdate: (updates: Partial<CharacterCreationData>) => void;
  onValidation: (valid: boolean, errors: string[]) => void;
  worldConfig: World;
}

export const BackgroundStep: React.FC<BackgroundStepProps> = ({
  data,
  onUpdate,
  onValidation,
}) => {
  const updateBackground = (background: CharacterCreationData['background']) => {
    onUpdate({ background });
    const result = validateBackground(background);
    onValidation(result.valid, result.errors);
  };

  const handleHistoryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateBackground({
      ...data.characterData.background,
      history: e.target.value,
    });
  };

  const handlePersonalityChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateBackground({
      ...data.characterData.background,
      personality: e.target.value,
    });
  };

  const handleMotivationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateBackground({
      ...data.characterData.background,
      motivation: e.target.value,
    });
  };

  const handleGoalsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const goals = e.target.value.split('\n').filter(goal => goal.trim());
    updateBackground({
      ...data.characterData.background,
      goals,
    });
  };

  const validation = data.validation[3];
  const showErrors = validation?.touched && !validation?.valid;

  return (
    <div className="component-background-step">
      <WizardFormSection
        title="Character Background"
        description="Provide details about your character's history, personality, and motivations."
        dataTutorial="background-editor"
      >
      {/* Helpful tip */}
      <div>
        <p className="form-help-text">
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
        <p className="form-help-text">
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
        <p className="form-help-text">
          {data.characterData.background.personality.length} / 30 characters minimum
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
        <p className="form-help-text">
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
