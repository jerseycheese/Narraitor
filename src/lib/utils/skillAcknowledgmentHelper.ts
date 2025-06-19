/**
 * @fileoverview Skill Acknowledgment Helper
 * 
 * Utility functions for determining when and how to acknowledge skill usage
 * in narrative generation, making the system more intelligent about skill recognition.
 */

import { NarrativeContext } from '@/types/narrative.types';

export interface SkillUsageData {
  skillId: string;
  skillName: string;
  success: boolean;
  difficulty?: number;
}

export interface CustomActionData {
  action: string;
  implicitSkills?: string[];
}

/**
 * Determines if a narrative context indicates skill usage that should be acknowledged
 * 
 * @param context - The narrative context to analyze
 * @returns True if skill acknowledgment is warranted
 */
export function shouldAcknowledgeSkillUsage(context: NarrativeContext): boolean {
  if (!context.currentTags) return false;
  
  return context.currentTags.some(tag => 
    tag.includes('skill-success') || 
    tag.includes('skill-failure') ||
    tag.includes('skill-used')
  );
}

/**
 * Extracts skill usage information from narrative context tags
 * 
 * @param context - The narrative context containing skill usage tags
 * @returns Skill usage data if found, null otherwise
 */
export function extractSkillUsageFromContext(context: NarrativeContext): SkillUsageData | null {
  if (!context.currentTags) return null;
  
  const skillSuccessTag = context.currentTags.find(tag => tag.startsWith('skill-success:'));
  const skillFailureTag = context.currentTags.find(tag => tag.startsWith('skill-failure:'));
  
  if (skillSuccessTag) {
    const skillId = skillSuccessTag.split(':')[1];
    return {
      skillId,
      skillName: skillId, // Will be resolved by calling code
      success: true
    };
  }
  
  if (skillFailureTag) {
    const skillId = skillFailureTag.split(':')[1];
    return {
      skillId,
      skillName: skillId, // Will be resolved by calling code
      success: false
    };
  }
  
  return null;
}

/**
 * Extracts custom action information from narrative context
 * 
 * @param context - The narrative context to analyze
 * @returns Custom action data if found, null otherwise
 */
export function extractCustomActionFromContext(context: NarrativeContext): CustomActionData | null {
  if (!context.currentSituation) return null;
  
  // Look for custom action indicators in the situation description
  const isCustomAction = context.currentTags?.includes('custom-action') || 
                        context.currentSituation.toLowerCase().includes('custom:');
  
  if (isCustomAction) {
    return {
      action: context.currentSituation,
      implicitSkills: context.currentTags?.filter(tag => tag.startsWith('implicit-skill:'))
                        .map(tag => tag.split(':')[1]) || []
    };
  }
  
  return null;
}

/**
 * Generates appropriate tags for skill acknowledgment based on usage data
 * 
 * @param skillUsage - The skill usage data
 * @param customAction - Optional custom action data
 * @returns Array of tags for narrative metadata
 */
export function generateSkillAcknowledgmentTags(
  skillUsage?: SkillUsageData,
  customAction?: CustomActionData
): string[] {
  const tags = ['skill-acknowledgment'];
  
  if (skillUsage) {
    tags.push(skillUsage.success ? 'skill-success' : 'skill-failure');
    tags.push(skillUsage.skillId);
  }
  
  if (customAction) {
    tags.push('custom-action');
    if (customAction.implicitSkills) {
      customAction.implicitSkills.forEach(skill => {
        tags.push(`implicit-skill:${skill}`);
      });
    }
  }
  
  return tags;
}

/**
 * Determines appropriate mood for skill acknowledgment narrative
 * 
 * @param skillUsage - The skill usage data
 * @param baseContext - The base narrative context
 * @returns Appropriate mood for the acknowledgment
 */
export function getSkillAcknowledgmentMood(
  skillUsage?: SkillUsageData,
  baseContext?: NarrativeContext
): 'triumphant' | 'tense' | 'neutral' | 'emotional' {
  if (skillUsage?.success) {
    return 'triumphant';
  } else if (skillUsage?.success === false) {
    return 'tense';
  }
  
  // Fall back to context mood or neutral
  return baseContext?.recentSegments?.[0]?.metadata?.mood === 'emotional' ? 'emotional' : 'neutral';
}