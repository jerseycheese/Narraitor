import React from 'react';
import { Badge } from '@/components/ui/badge';
import { RequirementLogic } from '@/types/narrative.types';

interface SkillRequirement {
  skillName?: string;
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

  return (
    <>
      {requirements.map((skillReq, index) => (
        <span
          key={`${optionId}-skill-${index}`}
          className="manuscript-skill-check-badge"
        >
          {skillReq.skillName || 'Skill'}
        </span>
      ))}
    </>
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
