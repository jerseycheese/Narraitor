import React, { useCallback } from 'react';
import { detectSkillActions, createSkillRequirement } from '@/lib/utils/actionSkillMapper';
import { evaluateRequirement } from '@/lib/utils/requirementEvaluator';
import { useTextAnalysis } from '@/lib/hooks/useTextAnalysis';
import SkillRequirementBadge from '@/components/ui/SkillRequirementBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DecisionRequirement } from '@/types/narrative.types';

// Local character type definition that matches the actual store structure
// to avoid type mismatches with the main Character type
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
  // Analyzer function for skill detection
  const analyzeSkills = useCallback(
    (text: string): Array<{
      skillId: string;
      skillName: string;
      action: string;
      success: boolean;
      current: number;
      required: number;
      requirement: DecisionRequirement;
    }> => {
      const detectedActions = detectSkillActions(text);
      
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
    },
    [character]
  );

  // Use the reusable text analysis hook
  const { text: actionText, setText: setActionText, results: skillCheckResults, clear } = useTextAnalysis({
    analyzer: analyzeSkills,
    analyzerDeps: [character]
  });

  const handleSubmit = () => {
    if (!actionText.trim()) return;
    
    const result: CustomActionResult = {
      text: actionText,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      skillChecks: skillCheckResults.map(({ requirement: _, ...rest }) => rest)
    };
    
    onActionSubmit(result);
    clear(); // Clear input and results after submission
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
        <Textarea
          value={actionText}
          onChange={(e) => setActionText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="min-h-[80px] resize-vertical"
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