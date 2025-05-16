/**
 * WizardClassNames.ts
 * 
 * This file provides a minimal set of reusable Tailwind CSS class names for the Wizard components.
 * Using these consistent class names helps maintain a uniform appearance across the wizard.
 * 
 * Usage example:
 * ```
 * import { wizardClasses } from './WizardClassNames';
 * 
 * // In your component:
 * <h2 className={wizardClasses.heading}>Title</h2>
 * <input className={wizardClasses.input} />
 * ```
 */

export const wizardClasses = {
  // Common elements
  heading: "text-xl font-bold mb-4",
  description: "mb-4",
  container: "mb-4",
  
  // Form elements
  input: "w-full p-2 border rounded",
  textarea: "w-full p-2 border rounded",
  select: "w-full p-2 border rounded",
  label: "block mb-1",
  error: "text-red-500",
  
  // Buttons
  buttonGroup: "flex justify-between mt-6",
  button: "px-4 py-2 border rounded",
  primaryButton: "px-4 py-2 bg-blue-500 text-white rounded",
};

