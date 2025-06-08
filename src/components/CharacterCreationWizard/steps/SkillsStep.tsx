import React from 'react';
import { 
  wizardStyles, 
  WizardFormSection,
  ToggleButton
} from '@/components/shared/wizard';

interface SkillsStepProps {
  data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onUpdate: (updates: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onValidation: (valid: boolean, errors: string[]) => void;
  worldConfig: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const SkillsStep: React.FC<SkillsStepProps> = ({
  data,
  onUpdate,
}) => {
  const selectedSkills = data.characterData.skills.filter((skill: any) => skill.isSelected); // eslint-disable-line @typescript-eslint/no-explicit-any

  const handleSkillToggle = (skillId: string) => {
    const updatedSkills = data.characterData.skills.map((skill: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      skill.skillId === skillId 
        ? { ...skill, isSelected: !skill.isSelected, level: 1 } // Always level 1 for new characters
        : skill
    );
    onUpdate({ skills: updatedSkills });
  };

  // Skills always start at level 1 for new characters

  const validation = data.validation[2];
  const showErrors = validation?.touched && !validation?.valid;

  return (
    <WizardFormSection
      title="Select Starting Skills"
      description="Choose skills that define your character's initial abilities and expertise. You can select between 1 and 8 skills. All selected skills start at level 1."
    >
      {/* Helpful tip */}
      <div className="border rounded-lg p-4 bg-blue-50 mb-6">
        <p className="text-sm text-blue-800">
          Select skills that complement your attribute choices. 
          You&apos;ll be able to improve these skills through gameplay and experience.
        </p>
      </div>

      {/* Skill selection info */}
      <div className={`${wizardStyles.card.base} bg-gray-50 mb-6`}>
        <h3 className={wizardStyles.subheading}>Skill Selection</h3>
        <div className="flex gap-4 text-sm">
          <span className={wizardStyles.badge.primary}>
            Selected: {selectedSkills.length}
          </span>
          <span className={wizardStyles.badge.secondary}>
            Maximum: 8
          </span>
        </div>
      </div>

      {/* Skills list */}
      <div className="space-y-4">
        {data.characterData.skills.map((skill: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
          <div 
            key={skill.skillId} 
            className={`${wizardStyles.card.base} ${
              skill.isSelected ? wizardStyles.card.selected : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="font-medium text-lg">{skill.name}</span>
                {skill.description && (
                  <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                )}
              </div>
              <ToggleButton
                isActive={skill.isSelected}
                activeLabel="Selected ✓"
                inactiveLabel="Not Selected"
                onClick={() => handleSkillToggle(skill.skillId)}
                testId={`skill-toggle-${skill.skillId}`}
              />
            </div>
          </div>
        ))}
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
