/**
 * Keyboard utility for checking input-like elements where
 * keyboard shortcuts should typically be ignored
 */

export function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  const inputTypes = ['input', 'textarea', 'select'];

  return inputTypes.includes(tagName) ||
         target.contentEditable === 'true' ||
         target.hasAttribute('contenteditable');
}