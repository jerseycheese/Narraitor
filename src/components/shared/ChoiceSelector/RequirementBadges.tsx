import React from 'react';
import { Badge } from '@/components/ui/badge';
import { RequirementLogic, SkillCheckRoll } from '@/types/narrative.types';

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
  rollResults?: SkillCheckRoll[];
}

interface ItemRequirementBadgesProps {
  groups: ItemRequirementGroup[];
  optionId: string;
}

/**
 * Renders skill requirement badges with roll results
 */
export const SkillRequirementBadges: React.FC<SkillRequirementBadgesProps> = ({
  requirements,
  optionId,
  rollResults = [],
}) => {
  if (!requirements || requirements.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {requirements.map((skillReq, index) => {
        const rollResult = rollResults.find(r => r.skillId === skillReq.requirement?.targetId);

        let variant: 'skill-requirement' | 'success' | 'destructive' | 'warning' = 'skill-requirement';
        let label = skillReq.skillName || 'Unknown Skill';

        if (rollResult) {
          if (rollResult.isCriticalSuccess) {
            variant = 'success';
            label = `${skillReq.skillName} - Natural 20! (auto-success)`;
          } else if (rollResult.isCriticalFailure) {
            variant = 'destructive';
            label = `${skillReq.skillName} - Natural 1! (auto-fail)`;
          } else if (rollResult.success) {
            variant = 'success';
            label = `${skillReq.skillName} - Success (${rollResult.total} vs DC ${rollResult.dc})`;
          } else {
            variant = 'warning';
            label = `${skillReq.skillName} - Failed (${rollResult.total} vs DC ${rollResult.dc})`;
          }
        } else {
          label = `${skillReq.skillName} Check Required`;
        }

        return (
          <Badge
            key={`${optionId}-skill-${index}`}
            variant={variant}
            className="text-xs"
          >
            {label}
          </Badge>
        );
      })}
    </div>
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
    <div className="mt-2 space-y-2">
      {groups.map((group, groupIndex) => (
        <div key={`${optionId}-item-group-${groupIndex}`}>
          <p className="text-xs font-medium text-muted-foreground">
            {group.logic === 'any' ? 'Requires any of:' : 'Requires all:'}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {group.requirements.map((itemReq, reqIndex) => {
              const label = itemReq.met
                ? itemReq.itemName
                : `${itemReq.itemName} (${itemReq.current}/${itemReq.required})`;

              return (
                <Badge
                  key={`${optionId}-item-${groupIndex}-${reqIndex}`}
                  variant={itemReq.met ? 'success' : 'destructive'}
                >
                  {label}
                  {!itemReq.met && <span className="sr-only"> - missing</span>}
                </Badge>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
