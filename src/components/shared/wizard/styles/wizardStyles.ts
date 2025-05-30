/**
 * Shared wizard styles for consistent appearance across all wizards
 */

export const wizardStyles = {
  // Container styles
  container: "max-w-2xl mx-auto p-6",
  
  // Header styles  
  header: "mb-8",
  title: "text-2xl font-bold mb-4",
  
  // Step styles
  step: {
    title: "text-xl font-bold mb-4",
    description: "text-gray-600 mb-6",
    content: "space-y-6",
  },
  
  // Form styles
  form: {
    group: "space-y-2",
    label: "block text-sm font-medium text-gray-700 mb-2",
    input: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
    inputError: "border-red-300 focus:ring-red-500 focus:border-red-500",
    textarea: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-vertical",
    select: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
    error: "text-red-600 text-sm mt-1",
    helpText: "text-gray-500 text-sm mt-1",
  },
  
  // Navigation styles
  navigation: {
    container: "flex justify-between mt-8 pt-6 border-t border-gray-200",
    primaryButton: "px-4 py-2 font-medium rounded-md transition-colors bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed",
    secondaryButton: "px-4 py-2 font-medium rounded-md transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-50 disabled:cursor-not-allowed",
    cancelButton: "px-4 py-2 font-medium rounded-md transition-colors bg-white text-red-600 border border-red-300 hover:bg-red-50",
    buttonGroup: "flex gap-2",
  },
  
  // Progress styles
  progress: {
    container: "flex items-center justify-between mb-8",
    step: "flex flex-col items-center",
    stepActive: "flex flex-col items-center",
    stepCompleted: "flex flex-col items-center",
    circle: "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
    circleActive: "bg-blue-500 text-white",
    circleCompleted: "bg-green-500 text-white",
    circleInactive: "bg-gray-200 text-gray-400",
    label: "text-xs mt-1 text-center",
    connector: "flex-1 h-1 mx-2 bg-gray-200",
    connectorActive: "bg-blue-500",
  },
  
  // Card styles
  card: {
    base: "border rounded-lg p-4",
    selected: "border-blue-500 bg-blue-50",
    unselected: "border-gray-300 hover:border-gray-400",
  },
  
  // Badge styles
  badge: {
    base: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
    primary: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
  },
  
  // Toggle styles
  toggle: {
    button: "px-3 py-1 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
    active: "bg-green-100 text-green-700 border-green-300",
    inactive: "bg-gray-100 text-gray-500 border-gray-300",
  },
  
  // Utility styles
  divider: "border-t border-gray-200 pt-6",
  subheading: "text-lg font-semibold mb-4",
  errorContainer: "p-4 bg-red-50 border border-red-200 rounded-lg",
};

// Utility function for combining classes (similar to clsx)
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};