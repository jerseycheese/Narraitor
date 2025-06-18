export type BadgeVariant = 'skill-difficulty' | 'skill-requirement' | 'choice-alignment';
export type BadgeState = 'easy' | 'medium' | 'hard' | 'available' | 'unavailable' | 'success' | 'failure';

export const getBadgeStyles = (variant: BadgeVariant, state?: BadgeState): string => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';
  
  if (variant === 'skill-difficulty') {
    switch (state) {
      case 'easy':
        return `${baseClasses} bg-green-100 text-green-800 border-green-200`;
      case 'medium':
        return `${baseClasses} bg-blue-100 text-blue-800 border-blue-200`;
      case 'hard':
        return `${baseClasses} bg-red-100 text-red-800 border-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
    }
  }
  
  if (variant === 'skill-requirement') {
    switch (state) {
      case 'available':
        return `${baseClasses} bg-green-100 text-green-800 border-green-200`;
      case 'unavailable':
        return `${baseClasses} bg-gray-100 text-gray-500 border-gray-200`;
      default:
        return `${baseClasses} bg-blue-100 text-blue-800 border-blue-200`;
    }
  }
  
  return `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
};