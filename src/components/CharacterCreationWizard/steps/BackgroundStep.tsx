import React from 'react';
import { wizardStyles, WizardFormSection } from '@/components/shared/wizard';

interface BackgroundStepProps {
  data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onUpdate: (updates: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onValidation: (valid: boolean, errors: string[]) => void;
  worldConfig: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const BackgroundStep: React.FC<BackgroundStepProps> = ({
  data,
  onUpdate,
  onValidation,
}) => {
  const validateBackground = (backgroundData: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const errors: string[] = [];
    
    if (!backgroundData.history || backgroundData.history.length < 50) {
      errors.push('Character history must be at least 50 characters');
    }
    
    if (!backgroundData.personality || backgroundData.personality.length < 30) {
      errors.push('Personality description must be at least 30 characters');
    }
    
    if (!backgroundData.motivation || backgroundData.motivation.length < 10) {
      errors.push('Motivation must be at least 10 characters');
    }
    
    onValidation(errors.length === 0, errors);
  };

  const handleHistoryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedBackground = {
      ...data.characterData.background,
      history: e.target.value,
    };
    onUpdate({
      background: updatedBackground,
    });
    validateBackground(updatedBackground);
  };

  const handlePersonalityChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedBackground = {
      ...data.characterData.background,
      personality: e.target.value,
    };
    onUpdate({
      background: updatedBackground,
    });
    validateBackground(updatedBackground);
  };

  const handleMotivationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedBackground = {
      ...data.characterData.background,
      motivation: e.target.value,
    };
    onUpdate({
      background: updatedBackground,
    });
    validateBackground(updatedBackground);
  };

  const handleGoalsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const goals = e.target.value.split('\n').filter(goal => goal.trim());
    const updatedBackground = {
      ...data.characterData.background,
      goals,
    };
    onUpdate({
      background: updatedBackground,
    });
    validateBackground(updatedBackground);
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

      <div className={wizardStyles.form.group}>
        <label htmlFor="character-history" className={wizardStyles.form.label}>
          Character History
        </label>
        <textarea
          id="character-history"
          value={data.characterData.background.history}
          onChange={handleHistoryChange}
          rows={6}
          className={wizardStyles.form.textarea}
          placeholder="Describe your character's background and history... (minimum 50 characters)"
        />
        <p className={wizardStyles.form.helpText}>
          {data.characterData.background.history.length} / 50 characters minimum
        </p>
      </div>

      <div className={wizardStyles.form.group}>
        <label htmlFor="character-personality" className={wizardStyles.form.label}>
          Personality
        </label>
        <textarea
          id="character-personality"
          value={data.characterData.background.personality}
          onChange={handlePersonalityChange}
          rows={4}
          className={wizardStyles.form.textarea}
          placeholder="Describe your character's personality traits... (minimum 30 characters)"
        />
        <p className={wizardStyles.form.helpText}>
          {data.characterData.background.personality.length} / 30 characters minimum
        </p>
      </div>

      <div className={wizardStyles.form.group}>
        <label htmlFor="character-motivation" className={wizardStyles.form.label}>
          Motivation
        </label>
        <input
          id="character-motivation"
          type="text"
          value={data.characterData.background.motivation}
          onChange={handleMotivationChange}
          className={wizardStyles.form.input}
          placeholder="What drives your character? (minimum 10 characters)"
        />
        <p className={wizardStyles.form.helpText}>
          {data.characterData.background.motivation.length} / 10 characters minimum
        </p>
      </div>

      <div className={wizardStyles.form.group}>
        <label htmlFor="character-goals" className={wizardStyles.form.label}>
          Goals (Optional)
        </label>
        <textarea
          id="character-goals"
          value={data.characterData.background.goals.join('\n')}
          onChange={handleGoalsChange}
          rows={3}
          className={wizardStyles.form.textarea}
          placeholder="Enter your character's goals, one per line"
        />
      </div>

      {/* Validation errors */}
      {showErrors && (
        <div className={wizardStyles.errorContainer}>
          {validation.errors.map((error: string, index: number) => (
            <p key={index} className={wizardStyles.form.error}>
              {error}
            </p>
          ))}
        </div>
      )}
    </WizardFormSection>
  );
};