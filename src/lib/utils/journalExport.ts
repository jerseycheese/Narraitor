import { JournalEntry } from '@/types/journal.types';

/**
 * Formats a date for display in exports
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formats significance level for display
 */
function formatSignificance(significance: string): string {
  return significance.charAt(0).toUpperCase() + significance.slice(1);
}

/**
 * Exports journal entries to markdown format
 */
export function exportJournalToMarkdown(entries: JournalEntry[], storyTitle: string): string {
  let markdown = `# ${storyTitle}\n\n`;
  
  if (entries.length === 0) {
    markdown += '*No entries recorded yet.*\n';
    return markdown;
  }
  
  // Sort entries by creation date
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  sortedEntries.forEach(entry => {
    // Add title if it exists, otherwise use content preview
    const title = entry.title || entry.content.substring(0, 50) + '...';
    markdown += `## ${title}\n\n`;
    
    // Add timestamp and significance
    markdown += `*${formatDate(entry.createdAt)}* | **${formatSignificance(entry.significance)}**\n\n`;
    
    // Add content
    markdown += `${entry.content}\n\n`;
    
    // Add tags if they exist
    if (entry.metadata.tags && entry.metadata.tags.length > 0) {
      markdown += `*Tags: ${entry.metadata.tags.join(', ')}*\n\n`;
    }
    
    markdown += '---\n\n';
  });
  
  return markdown;
}

/**
 * Exports journal entries to plain text format
 */
export function exportJournalToText(entries: JournalEntry[], storyTitle: string): string {
  let text = `${storyTitle.toUpperCase()}\n`;
  text += '='.repeat(storyTitle.length) + '\n\n';
  
  if (entries.length === 0) {
    text += 'No entries recorded yet.\n';
    return text;
  }
  
  // Sort entries by creation date
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  sortedEntries.forEach((entry, index) => {
    // Add title if it exists, otherwise use content preview
    const title = entry.title || entry.content.substring(0, 50) + '...';
    text += `${index + 1}. ${title}\n`;
    
    // Add timestamp and significance
    text += `   ${formatDate(entry.createdAt)} | [${formatSignificance(entry.significance)}]\n\n`;
    
    // Add content with indentation
    const contentLines = entry.content.split('\n');
    contentLines.forEach(line => {
      text += `   ${line}\n`;
    });
    text += '\n';
    
    // Add tags if they exist
    if (entry.metadata.tags && entry.metadata.tags.length > 0) {
      text += `   Tags: ${entry.metadata.tags.join(', ')}\n\n`;
    }
    
    text += '-'.repeat(50) + '\n\n';
  });
  
  return text;
}

/**
 * Downloads content as a file
 */
export function downloadAsFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Exports journal entries as markdown file
 */
export function exportJournalAsMarkdownFile(entries: JournalEntry[], storyTitle: string): void {
  const markdown = exportJournalToMarkdown(entries, storyTitle);
  const filename = `${storyTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_journal.md`;
  downloadAsFile(markdown, filename, 'text/markdown');
}

/**
 * Exports journal entries as text file
 */
export function exportJournalAsTextFile(entries: JournalEntry[], storyTitle: string): void {
  const text = exportJournalToText(entries, storyTitle);
  const filename = `${storyTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_journal.txt`;
  downloadAsFile(text, filename, 'text/plain');
}

/**
 * Copies journal content to clipboard
 */
export async function copyJournalToClipboard(entries: JournalEntry[], storyTitle: string, format: 'markdown' | 'text' = 'text'): Promise<void> {
  const content = format === 'markdown' 
    ? exportJournalToMarkdown(entries, storyTitle)
    : exportJournalToText(entries, storyTitle);
    
  await navigator.clipboard.writeText(content);
}