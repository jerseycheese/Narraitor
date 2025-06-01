import React from 'react';
import { 
  SkillDifficulty as SkillDifficultyType, 
  getSkillDifficultyDescription
} from '@/lib/constants/skillDifficultyLevels';

/**
 * Props for the SkillDifficulty component
 */
export interface SkillDifficultyProps {
  /**
   * The difficulty level to display
   */
  difficulty: SkillDifficultyType;
  
  /**
   * Whether to show the description
   */
  showDescription?: boolean;
  
  /**
   * Custom className for the component
   */
  className?: string;
  
  /**
   * Test ID for testing
   */
  testId?: string;
}

/**
 * Component that displays a skill difficulty level with appropriate styling and description
 */
const SkillDifficulty: React.FC<SkillDifficultyProps> = ({
  difficulty,
  showDescription = false,
  className = '',
  testId = 'skill-difficulty',
}) => {
  const difficultyInfo = getSkillDifficultyDescription(difficulty);
  
  if (!difficultyInfo) {
    return null;
  }
  
  // Define colors based on difficulty
  const getBadgeColor = () => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <div data-testid={testId} className={className}>
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor()}`}
        data-testid={`${testId}-badge`}
      >
        {difficultyInfo.label}
      </span>
      
      {showDescription && difficultyInfo.description && (
        <p 
          className="mt-1 text-sm text-gray-600"
          data-testid={`${testId}-description`}
        >
          {difficultyInfo.description}
        </p>
      )}
    </div>
  );
};

export default SkillDifficulty;