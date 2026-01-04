export const sanitizeFormattedContent = (html: string): string => {
  // Allow only the specific tags that formatAIResponse generates: p, br, em
  // Remove any other HTML tags while preserving the allowed ones and their content
  return html
    // Remove any script, style, or other potentially dangerous tags completely
    .replace(/<(script|style|object|embed|form|input|button)[^>]*>.*?<\/\1>/gi, '')
    // Remove any attributes from allowed tags (keep only the tag itself)
    .replace(/<(p|br|em)([^>]*?)>/gi, '<$1>')
    // Remove any other HTML tags while preserving their text content
    .replace(/<(?!\/?(?:p|br|em)\b)[^>]*>/gi, '');
};

export const getSignificanceBadgeVariant = (
  significance: string
): 'destructive' | 'warning' | 'secondary' => {
  switch (significance) {
    case 'critical':
      return 'destructive';
    case 'major':
      return 'warning';
    case 'minor':
    default:
      return 'secondary';
  }
};
