/**
 * Options for formatting AI-generated text
 */
export interface FormattingOptions {
  preserveLineBreaks?: boolean;
  formatDialogue?: boolean;
  enableItalics?: boolean;
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

  // Set default output format to text for backward compatibility
  const outputFormat = options.outputFormat || 'text';
  let formatted = text;

  // Apply formatting in the correct order for predictable results
  // 1. First normalize whitespace (but preserve paragraph breaks)
  formatted = normalizeWhitespace(formatted);
  
  // 2. Format dialogue if enabled (before paragraph wrapping to avoid HTML interference)
  if (options.formatDialogue) {
    formatted = formatDialogue(formatted);
  }
  
  // 3. Format italics if enabled (before paragraph wrapping to avoid HTML interference)
  if (options.enableItalics) {
    formatted = formatItalics(formatted);
  }
  
  // 4. Format paragraphs (last step to avoid interfering with content formatting)
  formatted = formatParagraphs(formatted, options.preserveLineBreaks, options.paragraphSpacing, outputFormat);

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

/**
 * Formats dialogue with quotation marks
 * @param text - Text containing dialogue to format
 * @returns Text with properly quoted dialogue
 */
function formatDialogue(text: string): string {
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
  const pattern1 = new RegExp(
    `\\b([A-Z][\\w\\s]+|[Hh]e|[Ss]he|[Tt]hey|[Ii]t|[Tt]he [\\w\\s]+)\\s+(${dialogueVerbs})([,:]\\s+)(?![""])([^.!?\\n"]{3,})([.!?]?)`,
    'g'
  );
  
  // Pattern 2: Verb at start of sentence after period
  const pattern2 = new RegExp(
    `\\.\\s+([Hh]e|[Ss]he|[Tt]hey)\\s+(${dialogueVerbs})([,:]?\\s+)(?![""])([^.!?\\n"]{3,})([.!?]?)`,
    'g'
  );
  
  let formatted = text;
  
  // Apply both patterns
  formatted = formatted.replace(pattern1, (match, speaker, verb, separator, dialogue, punct) => {
    // Skip if it looks like indirect speech
    if (dialogue.match(/^(that|if|whether|to|about|how|why|when|where|what|who)/i)) {
      return match;
    }
    const finalPunct = punct || (verb.match(/ask|question|wonder|inquire/i) ? '?' : '.');
    return `${speaker} ${verb}${separator}"${dialogue.trim()}${finalPunct}"`;
  });
  
  formatted = formatted.replace(pattern2, (match, pronoun, verb, separator, dialogue, punct) => {
    // Skip if it looks like indirect speech
    if (dialogue.match(/^(that|if|whether|to|about|how|why|when|where|what|who)/i)) {
      return match;
    }
    const finalPunct = punct || (verb.match(/ask|question|wonder|inquire/i) ? '?' : '.');
    return `. ${pronoun} ${verb}${separator}"${dialogue.trim()}${finalPunct}"`;
  });
  
  return formatted;
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
