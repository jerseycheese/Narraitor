/**
 * Shared wizard styles for consistent appearance across all wizards
 * Clean Slate: Semantic hooks only, no Tailwind utilities.
 */

export const wizardStyles = {
  // Container styles
  container: "wizard-container",
  
  // Header styles  
  header: "wizard-header",
  title: "wizard-title",
  
  // Step styles
  step: {
    title: "wizard-step-title",
    description: "wizard-step-description",
    content: "wizard-step-content",
  },
  
  // Form styles
  form: {
    group: "form-group",
    label: "form-label",
    input: "form-input",
    inputError: "form-input-error",
    textarea: "form-textarea",
    select: "form-select",
    error: "form-error",
    helpText: "form-help-text",
  },
  
  // Navigation styles
  navigation: {
    container: "wizard-nav-container",
    primaryButton: "wizard-nav-primary",
    secondaryButton: "wizard-nav-secondary",
    cancelButton: "wizard-nav-cancel",
    buttonGroup: "wizard-nav-group",
  },
  
  // Progress styles
  progress: {
    container: "wizard-progress-container",
    step: "wizard-progress-step",
    stepActive: "wizard-progress-step-active",
    stepCompleted: "wizard-progress-step-completed",
    circle: "wizard-progress-circle",
    circleActive: "wizard-progress-circle-active",
    circleCompleted: "wizard-progress-circle-completed",
    circleInactive: "wizard-progress-circle-inactive",
    label: "wizard-progress-label",
    connector: "wizard-progress-connector",
    connectorActive: "wizard-progress-connector-active",
  },
  
  // Card styles
  card: {
    base: "wizard-card",
    selected: "wizard-card-selected",
    unselected: "wizard-card-unselected",
  },
  
  // Badge styles
  badge: {
    base: "wizard-badge",
    primary: "wizard-badge-primary",
    secondary: "wizard-badge-secondary",
    success: "wizard-badge-success",
    warning: "wizard-badge-warning",
    danger: "wizard-badge-danger",
  },
  
  // Toggle styles
  toggle: {
    button: "wizard-toggle",
    active: "wizard-toggle-active",
    inactive: "wizard-toggle-inactive",
  },
  
  // Utility styles
  divider: "wizard-divider",
  subheading: "wizard-subheading",
  errorContainer: "wizard-error-container",
};

export const cssClasses = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};