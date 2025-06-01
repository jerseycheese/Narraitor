/**
 * Options for formatting AI-generated text
 */
export interface FormattingOptions {
  preserveLineBreaks?: boolean;
  formatDialogue?: boolean;
  enableItalics?: boolean;
  paragraphSpacing?: 'single' | 'double';
}

/**
 * Formats AI-generated text for display with proper paragraphs, dialogue, and emphasis
 * @param text - Raw text from AI response to format
 * @param options - Formatting options to control specific features
 * @returns Formatted text ready for display
 */
export function formatAIResponse(
  text: string | null | undefined,
  options: FormattingOptions = {}
): string {
  // Handle null/undefined input
  if (text === null || text === undefined || text === '') {
    return '';
  }

  let formatted = text;

  // Apply formatting in the correct order for predictable results
  // 1. First normalize whitespace (but preserve paragraph breaks)
  formatted = normalizeWhitespace(formatted);
  
  // 2. Format paragraphs
  formatted = formatParagraphs(formatted, options.preserveLineBreaks);
  
  // 3. Format dialogue if enabled
  if (options.formatDialogue) {
    formatted = formatDialogue(formatted);
  }
  
  // 4. Format italics if enabled
  if (options.enableItalics) {
    formatted = formatItalics(formatted);
  }

  return formatted;
}

/**
 * Normalizes whitespace in the text while preserving paragraph structure
 * @param text - Text to normalize
 * @returns Text with normalized whitespace
 */
function normalizeWhitespace(text: string): string {
  // First, normalize line endings to \n
  let normalized = text.replace(/\r\n/g, '\n');
  
  // Replace tabs with spaces
  normalized = normalized.replace(/\t/g, ' ');
  
  // Replace multiple spaces with single space (but preserve newlines)
  normalized = normalized.replace(/[ ]+/g, ' ');
  
  // Trim each line
  normalized = normalized.split('\n').map(line => line.trim()).join('\n');
  
  // Trim the entire string
  return normalized.trim();
}

/**
 * Formats paragraph breaks in the text
 * @param text - Text to format
 * @param preserveLineBreaks - Whether to preserve single line breaks
 * @returns Text with formatted paragraphs
 */
function formatParagraphs(text: string, preserveLineBreaks?: boolean): string {
  // Normalize multiple line breaks to double
  let formatted = text.replace(/\n{3,}/g, '\n\n');
  
  if (!preserveLineBreaks) {
    // Split by multiple line breaks
    const paragraphs = formatted.split(/\n{2,}/);
    
    // Process each paragraph to handle single line breaks
    const processedParagraphs = paragraphs.map(paragraph => {
      // Convert single line breaks to spaces
      return paragraph.replace(/\n/g, ' ');
    });
    
    // Join paragraphs with double line breaks
    formatted = processedParagraphs.join('\n\n');
  }
  
  return formatted;
}

/**
 * Formats dialogue with quotation marks
 * @param text - Text containing dialogue to format
 * @returns Text with properly quoted dialogue
 */
function formatDialogue(text: string): string {
  // Pattern to match dialogue - handles quoted and unquoted text
  const dialoguePattern = /(\w+\s+(?:said|replied|exclaimed|asked|whispered|shouted|muttered|declared),)\s+("?)([^".!?\n]+)([.!?]?)("?)/gi;
  
  return text.replace(dialoguePattern, (match, speaker, openQuote, dialogue, punctuation, closeQuote) => {
    // If dialogue already has quotes (both open and close), preserve as is
    if (openQuote && closeQuote) {
      return match;
    }
    
    // Otherwise, add quotes around the dialogue with punctuation inside
    return `${speaker} "${dialogue.trim()}${punctuation}"`;
  });
}

/**
 * Formats italics using asterisks
 * @param text - Text containing asterisk-wrapped emphasis
 * @returns Text with HTML emphasis tags
 */
function formatItalics(text: string): string {
  // Pattern to match text between asterisks - only complete pairs
  const italicsPattern = /\*([^*\n]+)\*/g;
  
  return text.replace(italicsPattern, '<em>$1</em>');
}

/**
 * Formats a date to show relative time (e.g., "2 hours ago", "3 days ago")
 * @param dateString - ISO date string to format
 * @returns Human-readable relative time string
 */
export function formatDistanceToNow(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  } else {
    // For dates more than a week ago, show the actual date
    return date.toLocaleDateString();
  }
}
