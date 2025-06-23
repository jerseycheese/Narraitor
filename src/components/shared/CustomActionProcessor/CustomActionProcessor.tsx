/**
 * CustomActionProcessor Component
 * 
 * Processes custom player text input and uses AI to detect which skills should be triggered.
 * Replaces the previous hardcoded action-to-skill mapping with intelligent AI analysis.
 * 
 * Features:
 * - Real-time AI-powered skill detection as user types
 * - Debounced analysis (500ms) for performance optimization
 * - Visual feedback with confidence scores and AI reasoning
 * - Integration with existing skill evaluation system
 * - Comprehensive error handling and loading states
 * 
 * @param {Character} character - Character with skills for evaluation
 * @param {Function} onActionSubmit - Callback when action is submitted with skill results
 * 
 * @example
 * <CustomActionProcessor 
 *   character={character}
 *   onActionSubmit={(result) => console.log(result.skillChecks)}
 * />
 */

import React, { useCallback, useState, useEffect } from 'react';
import { skillDetectionService } from '@/lib/ai/skillDetectionService';
import { evaluateRequirement } from '@/lib/utils/requirementEvaluator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/ui/LoadingState';
import { DecisionRequirement } from '@/types/narrative.types';
import { useAsyncState } from '@/hooks';

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
  success: boolean;
  current: number;
  required: number;
  confidence: number;
  reasoning: string;
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
  const [skillCheckResults, setSkillCheckResults] = useState<Array<{
    skillId: string;
    skillName: string;
    success: boolean;
    current: number;
    required: number;
    confidence: number;
    reasoning: string;
    requirement: DecisionRequirement;
  }>>([]);
  
  // Async state management using new hooks
  const analysisState = useAsyncState();

  // Convert character skills to the format expected by the AI service
  const availableSkills = useCallback(() => {
    return character.skills.map(skill => ({
      id: skill.worldSkillId || skill.name.toLowerCase().replace(/\s+/g, '-'),
      name: skill.name,
      description: `Level ${skill.level} skill`
    }));
  }, [character.skills]);

  // Analyze skills using AI service
  const analyzeSkills = useCallback(async (text: string) => {
    if (!text.trim()) {
      setSkillCheckResults([]);
      analysisState.clearError();
      return;
    }

    const skillChecks = await analysisState.execute(async () => {
      const result = await skillDetectionService.detectSkills(text, availableSkills());
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Convert detected skills to skill check results
      const skillChecks = result.detectedSkills.map(detectedSkill => {
        // Find the actual character skill
        const characterSkill = character.skills.find(s => 
          s.worldSkillId === detectedSkill.skillId || 
          s.name.toLowerCase() === detectedSkill.skillName.toLowerCase() ||
          s.name.toLowerCase().replace(/\s+/g, '-') === detectedSkill.skillId
        );

        if (!characterSkill) {
          // Skill not found on character, skip it
          return null;
        }

        // Create requirement and evaluate it
        const requirement: DecisionRequirement = {
          type: 'skill',
          targetId: characterSkill.worldSkillId || characterSkill.name,
          operator: 'gte',
          value: detectedSkill.suggestedDifficulty
        };

        const evaluation = evaluateRequirement(requirement, character);

        return {
          skillId: detectedSkill.skillId,
          skillName: characterSkill.name,
          success: evaluation.success,
          current: evaluation.current,
          required: detectedSkill.suggestedDifficulty,
          confidence: detectedSkill.confidence,
          reasoning: detectedSkill.reasoning,
          requirement
        };
      }).filter(Boolean) as Array<{
        skillId: string;
        skillName: string;
        success: boolean;
        current: number;
        required: number;
        confidence: number;
        reasoning: string;
        requirement: DecisionRequirement;
      }>;

      return skillChecks;
    });

    if (skillChecks) {
      setSkillCheckResults(skillChecks);
    } else {
      setSkillCheckResults([]);
    }
  }, [character, availableSkills, analysisState]);

  // Debounce the analysis
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      analyzeSkills(actionText);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [actionText, analyzeSkills]);

  const clear = useCallback(() => {
    setActionText('');
    setSkillCheckResults([]);
    analysisState.clearError();
  }, [analysisState]);

  const handleSubmit = () => {
    if (!actionText.trim()) return;
    
    const result: CustomActionResult = {
      text: actionText,
      skillChecks: skillCheckResults.map(result => ({
        skillId: result.skillId,
        skillName: result.skillName,
        success: result.success,
        current: result.current,
        required: result.required,
        confidence: result.confidence,
        reasoning: result.reasoning
      }))
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
        
        {/* Loading state */}
        {analysisState.isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <LoadingState variant="dots" size="sm" />
            <span>Analyzing skills...</span>
          </div>
        )}

        {/* Analysis error */}
        {analysisState.error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            Error: {analysisState.error}
          </div>
        )}

        {/* Display skill check previews */}
        {skillCheckResults.length > 0 && !analysisState.isLoading && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 font-medium">Detected Skills:</span>
              {skillCheckResults.map((result, index) => {
                const operatorSuffix = result.requirement.operator === 'gte' ? '+' : '';
                const label = `${result.skillName} ${result.requirement.value}${operatorSuffix}`;
                const variant = result.success ? 'available' : 'unavailable';
                
                return (
                  <Badge
                    key={`${result.skillId}-${index}`}
                    variant={variant}
                    data-testid={`skill-badge-${result.skillId}`}
                  >
                    {label}
                  </Badge>
                );
              })}
            </div>
            {/* Show AI reasoning for the first detected skill */}
            {skillCheckResults.length > 0 && skillCheckResults[0].reasoning && (
              <div className="text-xs text-gray-500 italic">
                AI detected: {skillCheckResults[0].reasoning}
              </div>
            )}
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