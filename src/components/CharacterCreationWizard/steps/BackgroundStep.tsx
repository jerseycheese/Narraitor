import React, { useState } from 'react';
import { WizardFormSection } from '@/components/shared/wizard';
import { ErrorBlock } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { CharacterCreationData } from '@/hooks/useCharacterCreationWizard';
import type { WizardValidation } from '@/hooks/useWizardState';
import type { World } from '@/types/world.types';
import { getVisibleFieldErrorMessages } from '@/lib/utils/wizardValidation';

interface BackgroundStepData {
  characterData: CharacterCreationData;
  validation: Record<number, WizardValidation>;
}

interface BackgroundStepProps {
  data: BackgroundStepData;
  onUpdate: (updates: Partial<CharacterCreationData>) => void;
  onValidation: (valid: boolean, errors: string[], fieldErrors?: Record<string, string>) => void;
  validateStep: () => WizardValidation;
  worldConfig: World;
  /** True once the player has pressed Next/Create while this step was invalid — show every field's error, not just touched ones. */
  forceShowAllErrors?: boolean;
}

export const BackgroundStep: React.FC<BackgroundStepProps> = ({
  data,
  onUpdate,
  onValidation,
  validateStep,
  forceShowAllErrors = false,
}) => {
  // A field's "required"/length error only shows once the player has moved
  // past (blurred) that specific field — not as soon as any other field in
  // this step is blurred.
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const updateBackground = (background: CharacterCreationData['background']) => {
    onUpdate({ background });
  };

  const handleFieldBlur = (field: string) => {
    setTouchedFields((prev) => (prev.has(field) ? prev : new Set(prev).add(field)));
    const result = validateStep();
    if (result.fieldErrors) {
      onValidation(result.valid, result.errors, result.fieldErrors);
    } else {
      onValidation(result.valid, result.errors);
    }
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
  const visibleErrors = getVisibleFieldErrorMessages(validation, touchedFields, forceShowAllErrors);
  const showErrors = visibleErrors.length > 0;

  return (
    <div className="component-background-step">
      <WizardFormSection
        title="Character Background"
        description="Provide details about your character's history, personality, and motivations."
      >
      <div>
        <Label htmlFor="character-history">
          Character History <span>*</span>
        </Label>
        <Textarea
          id="character-history"
          data-tutorial="background-editor"
          value={data.characterData.background.history}
          onChange={handleHistoryChange}
          onBlur={() => handleFieldBlur('history')}
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
          onBlur={() => handleFieldBlur('personality')}
          rows={4}
          placeholder="Describe your character's personality traits... (minimum 20 characters)"
        />
        <p className="form-help-text">
          {data.characterData.background.personality.length} / 20 characters minimum
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
          onBlur={() => handleFieldBlur('motivation')}
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
          onBlur={() => handleFieldBlur('goals')}
          rows={3}
          placeholder="Enter your character's goals, one per line"
        />
      </div>

      {/* Validation errors */}
      {showErrors && (
        <ErrorBlock errors={visibleErrors} />
      )}
      </WizardFormSection>
    </div>
  );
};
