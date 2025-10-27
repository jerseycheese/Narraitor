/**
 * Infers the segment type from narrative content
 *
 * Analyzes narrative text to determine the most appropriate segment type
 * based on content patterns. This enables varied visual styling in the UI
 * without requiring AI to explicitly specify segment types.
 *
 * Priority order: dialogue > action > transition > scene (default)
 *
 * @param content - The narrative content to analyze
 * @returns The inferred segment type
 */
export function inferSegmentType(
  content: string
): 'dialogue' | 'action' | 'transition' | 'scene' {
  if (!content || typeof content !== 'string') {
    return 'scene';
  }

  const lowerContent = content.toLowerCase();

  // Check for dialogue patterns (highest priority)
  const hasQuotes = content.includes('"') || content.includes('\u2018') || content.includes('\u2019');
  const hasSpeakingVerbs = /\b(say|said|ask|asked|reply|replied|respond|responded|explain|explained|whisper|whispered|shout|shouted|yell|yelled|call|called|exclaim|exclaimed|answer|answered)\b/i.test(
    content
  );

  if (hasQuotes || hasSpeakingVerbs) {
    return 'dialogue';
  }

  // Check for action patterns
  const actionVerbs = /\b(strike|hit|attack|fight|dodge|block|parry|run|dash|sprint|flee|chase|climb|jump|leap|grab|throw|push|pull|kick|punch|swing|shoot|fire|cast|charge|evade|escape)\b/i.test(
    content
  );
  const hasActionContext = /\b(combat|battle|weapon|sword|blade|arrow|spell|quickly|swiftly|suddenly)\b/i.test(
    lowerContent
  );

  if (actionVerbs || hasActionContext) {
    return 'action';
  }

  // Check for transition patterns
  const timeTransitions = /\b(later|meanwhile|afterward|soon|eventually|hours? (pass|later)|days? (pass|later)|weeks? (pass|later)|months? (pass|later)|time (passes|passed)|as time|after (a |some |many )?while)\b/i.test(
    content
  );
  const locationTransitions = /\b(travel|journey|arrive|reach|enter|leave|depart|move to|go to|head to|return to)\b/i.test(
    lowerContent
  );
  const sceneTransitions = /\b(meanwhile|elsewhere|back at|later at|across town|in another|somewhere)\b/i.test(
    lowerContent
  );

  if (timeTransitions || locationTransitions || sceneTransitions) {
    return 'transition';
  }

  // Default to scene for descriptive content
  return 'scene';
}
