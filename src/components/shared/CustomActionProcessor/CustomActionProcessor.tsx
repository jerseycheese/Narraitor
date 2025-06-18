import React, { useState, useMemo } from 'react';
import { detectSkillActions, createSkillRequirement } from '@/lib/utils/actionSkillMapper';
import { evaluateRequirement } from '@/lib/utils/requirementEvaluator';
import SkillRequirementBadge from '@/components/ui/SkillRequirementBadge';
import { Button } from '@/components/ui/button';

interface Character {
  skills: Array<{
    id: string;
    characterId: string;
    worldSkillId?: string;
    name: string;
    level: number;
    category?: string;
  }>;
}

export interface SkillCheckResult {
  skillId: string;
  skillName: string;
  action: string;
  success: boolean;
  current: number;
  required: number;
}

export interface CustomActionResult {
  text: string;
  skillChecks: SkillCheckResult[];
}

interface CustomActionProcessorProps {
  character: Character;
  onActionSubmit: (result: CustomActionResult) => void;
  placeholder?: string;
  className?: string;
}

const CustomActionProcessor: React.FC<CustomActionProcessorProps> = ({
  character,
  onActionSubmit,
  placeholder = "Describe your action...",
  className = ""
}) => {
  const [actionText, setActionText] = useState('');

  // Detect skill actions and evaluate them whenever text changes
  const skillCheckResults = useMemo(() => {
    if (!actionText.trim()) return [];
    
    const detectedActions = detectSkillActions(actionText);
    
    return detectedActions.map(mapping => {
      const requirement = createSkillRequirement(mapping);
      const evaluation = evaluateRequirement(requirement, character);
      
      // Find skill name from character's skills
      const skill = character.skills.find(s => 
        s.worldSkillId === mapping.skillId || 
        s.name.toLowerCase() === mapping.skillId.toLowerCase()
      );
      const skillName = skill ? skill.name : mapping.skillId;
      
      return {
        skillId: mapping.skillId,
        skillName,
        action: mapping.action,
        success: evaluation.success,
        current: evaluation.current,
        required: evaluation.required as number,
        requirement
      };
    });
  }, [actionText, character]);

  const handleSubmit = () => {
    if (!actionText.trim()) return;
    
    const result: CustomActionResult = {
      text: actionText,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      skillChecks: skillCheckResults.map(({ requirement: _, ...rest }) => rest)
    };
    
    onActionSubmit(result);
    setActionText(''); // Clear input after submission
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <textarea
          value={actionText}
          onChange={(e) => setActionText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
        
        {/* Display skill check previews */}
        {skillCheckResults.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 font-medium">Skill Checks:</span>
            {skillCheckResults.map((result, index) => (
              <SkillRequirementBadge
                key={`${result.skillId}-${index}`}
                requirement={result.requirement}
                skillName={result.skillName}
                isAvailable={result.success}
                testId={`skill-badge-${result.skillId}`}
              />
            ))}
          </div>
        )}
      </div>
      
      <Button 
        onClick={handleSubmit}
        disabled={!actionText.trim()}
        className="w-full"
      >
        Submit Action
      </Button>
    </div>
  );
};

export default CustomActionProcessor;