import { normalizeText } from './textNormalization';

// Line endings and whitespace only. Quote and special-character rewriting is
// deliberately off: this path formats narrative prose, and formatDialogue below
// inserts quotes of its own.
const WHITESPACE_ONLY = {
  normalizeWhitespace: true,
  normalizeLineEndings: true,
  normalizeQuotes: false,
  normalizeSpecialChars: false,
  preserveStructure: true,
};

/**
 * Options for formatting AI-generated text
 */
export interface FormattingOptions {
  preserveLineBreaks?: boolean;
  formatDialogue?: boolean;
  paragraphSpacing?: 'single' | 'double';
  outputFormat?: 'text' | 'html';
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

  const outputFormat = options.outputFormat || 'text';
  let formatted = text;

  // Apply formatting in the correct order for predictable results
  // 1. First normalize whitespace (but preserve paragraph breaks)
  formatted = normalizeText(formatted, WHITESPACE_ONLY);

  // 2. Format dialogue if enabled (before paragraph wrapping to avoid HTML interference)
  if (options.formatDialogue) {
    formatted = formatDialogue(formatted);
  }

  // 3. Format paragraphs (last step to avoid interfering with content formatting)
  formatted = formatParagraphs(formatted, options.preserveLineBreaks, options.paragraphSpacing, outputFormat);

  return formatted;
}

/**
 * Formats paragraph breaks in the text
 * @param text - Text to format
 * @param preserveLineBreaks - Whether to preserve single line breaks
 * @param paragraphSpacing - Spacing between paragraphs ('single' or 'double')
 * @param outputFormat - Output format ('text' or 'html')
 * @returns Text with formatted paragraphs
 */
function formatParagraphs(
  text: string, 
  preserveLineBreaks?: boolean, 
  paragraphSpacing: 'single' | 'double' = 'single',
  outputFormat: 'text' | 'html' = 'text'
): string {
  // Normalize multiple line breaks to double
  let formatted = text.replace(/\n{3,}/g, '\n\n');
  
  if (!preserveLineBreaks) {
    // Split by multiple line breaks
    const paragraphs = formatted.split(/\n{2,}/);
    
    // Process each paragraph to handle single line breaks
    const processedParagraphs = paragraphs.map(paragraph => {
      // Convert single line breaks to spaces
      return paragraph.replace(/\n/g, ' ').trim();
    }).filter(p => p.length > 0); // Remove empty paragraphs
    
    if (outputFormat === 'html') {
      // Wrap each paragraph in <p> tags
      const wrappedParagraphs = processedParagraphs.map(paragraph => `<p>${paragraph}</p>`);
      
      // Join with appropriate spacing
      const spacing = paragraphSpacing === 'double' ? '\n\n' : '\n';
      formatted = wrappedParagraphs.join(spacing);
    } else {
      // Join paragraphs with double line breaks for text output
      formatted = processedParagraphs.join('\n\n');
    }
  } else {
    // Preserve line breaks but still convert to HTML if needed
    if (outputFormat === 'html') {
      // Convert line breaks to <br> tags and wrap in a single paragraph
      formatted = `<p>${formatted.replace(/\n/g, '<br>')}</p>`;
    }
  }
  
  return formatted;
}

// Pre-compiled dialogue patterns for performance optimization
// List of common dialogue verbs
const dialogueVerbs = [
  'said', 'says', 'replied', 'replies', 'asked', 'asks', 'whispered', 'whispers',
  'shouted', 'shouts', 'yelled', 'yells', 'exclaimed', 'exclaims', 'muttered', 'mutters',
  'declared', 'declares', 'announced', 'announces', 'stated', 'states', 'told', 'tells',
  'answered', 'answers', 'responded', 'responds', 'cried', 'cries', 'called', 'calls',
  'spoke', 'speaks', 'remarked', 'remarks', 'added', 'adds', 'continued', 'continues',
  'began', 'begins', 'finished', 'finishes', 'interrupted', 'interrupts', 'agreed', 'agrees',
  'argued', 'argues', 'insisted', 'insists', 'suggested', 'suggests', 'explained', 'explains',
  'admitted', 'admits', 'confessed', 'confesses', 'complained', 'complains', 'promised', 'promises',
  'warned', 'warns', 'laughed', 'laughs', 'sighed', 'sighs', 'growled', 'growls',
  'hissed', 'hisses', 'roared', 'roars', 'breathed', 'breathes', 'gasped', 'gasps',
  'commanded', 'commands', 'demanded', 'demands', 'inquired', 'inquires', 'wondered', 'wonders',
  'observed', 'observes', 'noted', 'notes', 'mentioned', 'mentions', 'commented', 'comments'
].join('|');

// Pattern 1: Character name/pronoun + verb + comma/colon + unquoted text
const dialoguePattern1 = new RegExp(
  `\\b([A-Z][\\w\\s]+|[Hh]e|[Ss]he|[Tt]hey|[Ii]t|[Tt]he [\\w\\s]+)\\s+(${dialogueVerbs})([,:]\\s+)(?![""])([^.!?\\n"]{3,})([.!?]?)`,
  'g'
);

// Pattern 2: Verb at start of sentence after period
const dialoguePattern2 = new RegExp(
  `\\.\\s+([Hh]e|[Ss]he|[Tt]hey)\\s+(${dialogueVerbs})([,:]?\\s+)(?![""])([^.!?\\n"]{3,})([.!?]?)`,
  'g'
);

const dialogueStarterPattern = /^[A-Z0-9"'“”‘’¿¡(—-]/;

const shouldFormatAsDialogue = (raw: string): boolean => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return false;
  }

  const firstChar = trimmed[0];
  return dialogueStarterPattern.test(firstChar);
};

/**
 * Formats dialogue with quotation marks
 * @param text - Text containing dialogue to format
 * @returns Text with properly quoted dialogue
 */
function formatDialogue(text: string): string {
  let formatted = text;
  
  // Reset regex state to avoid issues with global flag
  dialoguePattern1.lastIndex = 0;
  dialoguePattern2.lastIndex = 0;
  
  // Apply both patterns
  formatted = formatted.replace(dialoguePattern1, (match, speaker, verb, separator, dialogue, punct) => {
    // Skip if it looks like indirect speech
    if (dialogue.match(/^(that|if|whether|to|about|how|why|when|where|what|who)/i)) {
      return match;
    }
    if (!shouldFormatAsDialogue(dialogue)) {
      return match;
    }
    const finalPunct = punct || (verb.match(/ask|question|wonder|inquire/i) ? '?' : '.');
    return `${speaker} ${verb}${separator}"${dialogue.trim()}${finalPunct}"`;
  });
  
  formatted = formatted.replace(dialoguePattern2, (match, pronoun, verb, separator, dialogue, punct) => {
    // Skip if it looks like indirect speech
    if (dialogue.match(/^(that|if|whether|to|about|how|why|when|where|what|who)/i)) {
      return match;
    }
    if (!shouldFormatAsDialogue(dialogue)) {
      return match;
    }
    const finalPunct = punct || (verb.match(/ask|question|wonder|inquire/i) ? '?' : '.');
    return `. ${pronoun} ${verb}${separator}"${dialogue.trim()}${finalPunct}"`;
  });
  
  return formatted;
}
