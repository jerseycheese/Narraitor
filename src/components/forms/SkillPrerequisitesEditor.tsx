import React from 'react';
import {
  SkillAttributePrerequisite,
  WorldAttribute,
} from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SkillPrerequisitesEditorProps {
  attributes: WorldAttribute[];
  prerequisites?: SkillAttributePrerequisite[];
  onChange: (prerequisites: SkillAttributePrerequisite[]) => void;
  idPrefix: string;
  disabled?: boolean;
}

/**
 * Lets a world creator set a minimum required value for each attribute before a
 * skill can be selected. A blank or zero value means the attribute is not a
 * prerequisite, so only positive requirements are stored.
 */
const SkillPrerequisitesEditor: React.FC<SkillPrerequisitesEditorProps> = ({
  attributes,
  prerequisites = [],
  onChange,
  idPrefix,
  disabled = false,
}) => {
  const getRequirement = (attributeId: EntityID): number | undefined =>
    prerequisites.find((prereq) => prereq.attributeId === attributeId)?.minValue;

  const handleChange = (attribute: WorldAttribute, rawValue: string) => {
    const parsed = parseInt(rawValue, 10);
    const withoutAttribute = prerequisites.filter(
      (prereq) => prereq.attributeId !== attribute.id
    );

    if (!Number.isFinite(parsed) || parsed <= 0) {
      onChange(withoutAttribute);
      return;
    }

    const clamped = Math.min(parsed, attribute.maxValue);
    onChange([
      ...withoutAttribute,
      { attributeId: attribute.id, minValue: clamped },
    ]);
  };

  return (
    <div className="component-skill-prerequisites-editor">
      <Label>Attribute Prerequisites</Label>
      <p className="skill-prerequisites-hint">
        Set a minimum attribute value a character needs before this skill can be
        selected. Leave blank for no requirement.
      </p>
      {attributes.length === 0 ? (
        <p>No attributes available</p>
      ) : (
        <div>
          {attributes.map((attribute) => {
            const inputId = `${idPrefix}-prereq-${attribute.id}`;
            const value = getRequirement(attribute.id);
            return (
              <div key={attribute.id} className="skill-prerequisite-row">
                <Label htmlFor={inputId}>Minimum {attribute.name}</Label>
                <Input
                  id={inputId}
                  type="number"
                  min={0}
                  max={attribute.maxValue}
                  value={value ?? ''}
                  placeholder="None"
                  disabled={disabled}
                  onChange={(e) => handleChange(attribute, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SkillPrerequisitesEditor;
