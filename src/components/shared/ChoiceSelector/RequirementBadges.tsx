import React from 'react';
import { Badge } from '@/components/ui/badge';
import { RequirementLogic } from '@/types/narrative.types';

interface AlignmentBadgeProps {
  alignment?: string;
}

/**
 * Renders the alignment label (Lawful / Chaotic) as a colored badge.
 * Neutral alignment renders nothing (it's the unmarked default).
 */
export const AlignmentBadge: React.FC<AlignmentBadgeProps> = ({
  alignment,
}) => {
  if (!alignment || alignment === 'neutral') return null;

  const label = alignment.charAt(0).toUpperCase() + alignment.slice(1);

  return (
    <span
      className={`manuscript-alignment-badge manuscript-alignment-badge-${alignment}`}
      aria-label={`${label} alignment`}
    >
      {label}
    </span>
  );
};

interface SkillRequirement {
  skillName?: string;
  met?: boolean;
  dc?: number;
  requirement?: {
    targetId: string;
  };
}

interface ItemRequirement {
  itemName: string;
  met: boolean;
  current: number;
  required: number;
}

interface ItemRequirementGroup {
  logic: RequirementLogic;
  requirements: ItemRequirement[];
}

interface SkillRequirementBadgesProps {
  requirements: SkillRequirement[];
  optionId: string;
}

interface ItemRequirementBadgesProps {
  groups: ItemRequirementGroup[];
  optionId: string;
}

/**
 * Renders skill requirement badges (pre-selection only)
 * Roll results are shown via toasts instead
 */
export const SkillRequirementBadges: React.FC<SkillRequirementBadgesProps> = ({
  requirements,
  optionId,
}) => {
  if (!requirements || requirements.length === 0) {
    return null;
  }

  const primaryRequirement =
    requirements.find(
      (requirement) =>
        Boolean(requirement.skillName) &&
        requirement.skillName !== 'Unknown Skill'
    ) ?? requirements[0];

  const hasNamedSkill =
    Boolean(primaryRequirement.skillName) &&
    primaryRequirement.skillName !== 'Unknown Skill';
  const badgeLabel = hasNamedSkill
    ? primaryRequirement.skillName!
    : 'Skill';
  const { dc, met } = primaryRequirement;
  const displayLabel =
    typeof dc === 'number' ? `${badgeLabel} · DC ${dc}` : badgeLabel;

  return (
    <span
      className="manuscript-skill-check-badge"
      data-option-id={optionId}
      data-met={met === undefined ? undefined : String(met)}
      aria-label={
        typeof dc === 'number'
          ? `Skill check: ${badgeLabel}, difficulty class ${dc}`
          : hasNamedSkill
            ? `Skill check required: ${badgeLabel}`
            : 'Skill check required'
      }
    >
      {displayLabel}
    </span>
  );
};

/**
 * Renders item requirement badges organized by groups
 */
export const ItemRequirementBadges: React.FC<ItemRequirementBadgesProps> = ({
  groups,
  optionId,
}) => {
  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <div>
      {groups.map((group, groupIndex) => (
        <div key={`${optionId}-item-group-${groupIndex}`}>
          <p>
            {group.logic === 'any' ? 'Requires any of:' : 'Requires all:'}
          </p>
          <div>
            {group.requirements.map((itemReq, reqIndex) => {
              const label = itemReq.met
                ? itemReq.itemName
                : `${itemReq.itemName}(${itemReq.current}/${itemReq.required})`;

              return (
                <Badge
                  key={`${optionId}-item-${groupIndex}-${reqIndex}`}
                  variant={itemReq.met ? 'success' : 'destructive'}
                >
                  {label}
                  {!itemReq.met && <span> - missing</span>}
                </Badge>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
