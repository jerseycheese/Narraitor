export type BadgeVariant = 'skill-difficulty' | 'skill-requirement' | 'choice-alignment' | 'significance';
export type BadgeState = 'easy' | 'medium' | 'hard' | 'available' | 'unavailable' | 'success' | 'failure' | 'critical' | 'major' | 'minor';

export const getBadgeStyles = (variant: BadgeVariant, state?: BadgeState): string => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';
  
  if (variant === 'skill-difficulty') {
    switch (state) {
      case 'easy':
        return `${baseClasses} bg-green-200 text-green-700 border-green-500`;
      case 'medium':
        return `${baseClasses} bg-blue-100 text-blue-700 border-blue-300`;
      case 'hard':
        return `${baseClasses} bg-red-200 text-red-700 border-red-500`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700 border-gray-300`;
    }
  }
  
  if (variant === 'skill-requirement') {
    switch (state) {
      case 'available':
        return `${baseClasses} bg-green-200 text-green-700 border-green-500`;
      case 'unavailable':
        return `${baseClasses} bg-gray-100 text-gray-500 border-gray-300`;
      default:
        return `${baseClasses} bg-blue-100 text-blue-700 border-blue-300`;
    }
  }
  
  if (variant === 'significance') {
    switch (state) {
      case 'critical':
        return `${baseClasses} bg-red-200 text-red-700 border-red-500`;
      case 'major':
        return `${baseClasses} bg-amber-200 text-amber-700 border-amber-500`;
      case 'minor':
        return `${baseClasses} bg-blue-100 text-blue-700 border-blue-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700 border-gray-300`;
    }
  }
  
  return `${baseClasses} bg-gray-100 text-gray-700 border-gray-300`;
};