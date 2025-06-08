import React, { useEffect, useCallback, useRef, useState } from 'react';
import { CharacterPortraitPlaceholder } from '../components/CharacterPortraitPlaceholder';
import { WizardForm } from '@/components/shared/wizard/components/WizardForm';
import {
  WizardFormField,
  WizardInput,
  WizardTextarea,
  WizardFormSection,
} from '@/components/shared/wizard/components/WizardFormComponents';
import { useFormContext } from 'react-hook-form';

interface BasicInfoStepProps {
  data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onUpdate: (updates: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onValidation: (valid: boolean, errors: string[]) => void;
  worldConfig: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Inner component that has access to form context
interface FormContentProps {
  onUpdate: (updates: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onValidation: (valid: boolean, errors: string[], touched?: boolean) => void;
}

const FormContent: React.FC<FormContentProps> = ({ onUpdate, onValidation }) => {
  const { watch } = useFormContext();
  const previousValues = useRef<Record<string, any>>({}); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  
  // Debounced update to prevent infinite loops
  const debouncedUpdate = useCallback((fieldName: string, value: any, isUserInput = false) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    // Only update if value actually changed
    if (previousValues.current[fieldName] !== value) {
      previousValues.current[fieldName] = value;
      onUpdate({ [fieldName]: value });
      
      // Mark field as touched if this is user input
      if (isUserInput) {
        setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
      }
      
      // Validate the name field
      if (fieldName === 'name') {
        const errors: string[] = [];
        const nameValue = value || '';
        if (!nameValue.trim()) {
          errors.push('Name is required');
        } else if (nameValue.length < 3) {
          errors.push('Name must be at least 3 characters');
        }
        // Only show validation if field has been touched or we have a value
        const shouldShowValidation = touchedFields[fieldName] || (isUserInput && value);
        onValidation(errors.length === 0, errors, shouldShowValidation);
      }
    }
  }, [onUpdate, onValidation, touchedFields]);
  
  // Watch for form changes
  useEffect(() => {
    const subscription = watch((value, { name: fieldName }) => {
      // Only update if a specific field changed
      if (fieldName && value[fieldName] !== undefined) {
        // If the field has content, consider it touched
        const isUserInput = value[fieldName] && value[fieldName].length > 0;
        debouncedUpdate(fieldName, value[fieldName], isUserInput);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, debouncedUpdate]);

  return (
    <>
      <WizardFormField
        name="name"
        label="Character Name"
        required
        description="Choose a unique name for your character (3-50 characters)"
      >
        <WizardInput
          placeholder="Enter character name"
          maxLength={50}
        />
      </WizardFormField>

      <WizardFormField
        name="description"
        label="Description"
        description="Describe your character's role and background"
      >
        <WizardTextarea
          placeholder="Describe your character's role and background"
          rows={3}
        />
      </WizardFormField>

      <WizardFormField
        name="physicalDescription"
        label="Physical Description"
        description="This will be used to generate your character's portrait"
      >
        <WizardTextarea
          placeholder="Describe your character's appearance (e.g., tall and muscular, silver hair, blue eyes, wears leather armor)"
          rows={3}
        />
      </WizardFormField>
    </>
  );
};

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  data,
  onUpdate,
  onValidation,
}) => {

  return (
    <WizardFormSection
      title="Basic Information"
      description="Create your character by providing their name and basic details."
    >
      <div className="flex items-start gap-6">
        {/* Portrait placeholder */}
        <div className="flex-shrink-0">
          <CharacterPortraitPlaceholder name={data.characterData.name} />
        </div>

        {/* Form fields */}
        <div className="flex-1">
          <WizardForm
            data={data.characterData}
          >
            <FormContent 
              onUpdate={onUpdate} 
              onValidation={onValidation}
            />
          </WizardForm>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded">
        <p className="text-gray-500 text-sm mt-1">
          Choose a unique name for your character. The name should be between 3 and 50 characters 
          and must be unique within this world.
        </p>
      </div>
    </WizardFormSection>
  );
};