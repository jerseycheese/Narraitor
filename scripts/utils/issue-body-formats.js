// issue-body-formats.js
// Constants and formatters for issue body sections

// Domain mapping for checkboxes
export const DOMAIN_CHECKBOX_MAP = {
  "world-configuration": "World Configuration",
  "character-system": "Character System",
  "narrative-engine": "Narrative Engine",
  "journal-system": "Journal System",
  "state-management": "State Management",
  "ai-service": "AI Service Integration",
  "game-session": "Game Session UI",
  "world-interface": "World Interface",
  "character-interface": "Character Interface",
  "journal-interface": "Journal Interface",
  "utilities-and-helpers": "Utilities and Helpers",
  "devtools": "Devtools",
  "decision-relevance": "Decision Relevance System",
  "decision-relevance-system": "Decision Relevance System",
  "inventory-system": "Inventory System",
  "lore-management-system": "Lore Management System",
  "player-decision-system": "Player Decision System"
};

// Empty field patterns
export const EMPTY_PATTERNS = [
  'No technical requirements specified',
  'No implementation considerations specified',
  'No related documentation specified',
  'No plain language summary provided',
  'No acceptance criteria specified',
  'None',
  ''
];

// Format acceptance criteria correctly
export function formatAcceptanceCriteria(text) {
  if (!text) return '';

  const lines = text
    .replace(/\\n/g, '\n')  // Replace literal \n with actual newlines first
    .replace(/\r\n/g, '\n') // Normalize Windows line endings
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');

  const formatted = [];

  for (const line of lines) {
    // Remove any existing dash or checkbox
    const cleanLine = line.replace(/^-\s*/, '').replace(/^\[\s*\]\s*/, '').trim();

    if (cleanLine.endsWith(':')) {
      // This is a header line like "Decision interface components with:"
      formatted.push(`- [ ] ${cleanLine}`);
    } else if (cleanLine.includes('github.com') || cleanLine.includes('#')) {
      formatted.push(`- ${cleanLine} (See linked issue)`);
    } else {
      // Regular criteria - check if it should be indented
      if (formatted.length > 0 && formatted[formatted.length - 1].endsWith(':')) {
        formatted.push(`  - [ ] ${cleanLine}`);
      } else {
        formatted.push(`- [ ] ${cleanLine}`);
      }
    }
  }

  return formatted.join('\n');
}

// Format technical requirements (fix nested structure)
export function formatTechnicalRequirements(text) {
  if (!text) {
    return '';
  }

  const lines = text
    .split('\\n') // Split on literal "\n"
    .map(line => line.replace(/\\$/, "").trim()) // Remove trailing backslash and trim
    .filter(line => line !== ''); // Ignore empty lines

  if (lines.length === 1) {
    return lines[0]; // Return single line directly
  }

  const formatted = lines.map(line => `- ${line}`); // Prefix with bullet
  return formatted.join('\n'); // Join with actual newlines
}

export function formatImplementationConsiderations(text) {
  if (!text) {
    return '';
  }

  const lines = text
    .split('\\n') // Split on literal "\n"
    .map(line => line.replace(/\\$/, "").trim()) // Remove trailing backslash and trim
    .filter(line => line !== ''); // Ignore empty lines

  if (lines.length === 1) {
    return lines[0]; // Return single line directly
  }

  const formatted = lines.map(line => `- ${line}`); // Prefix with bullet
  return formatted.join('\n'); // Join with actual newlines
}

// Format related issues - handle literal \n characters from CSV
export function formatRelatedIssues(text) {
  if (!text || text.trim().toLowerCase() === 'n/a') return '';

  // The CSV has literal \n characters like "#220\n#217\n#234"
  const issues = text
    .replace(/\\n/g, '\n')  // Replace literal \n with actual newlines
    .split('\n')
    .map(item => item.trim())
    .filter(item => item !== '')
    .map(item => {
      // Handle issue numbers
      if (item.startsWith('#') || item.includes('github.com') || /\[.*\]\(.*\)/.test(item)) {
        return `- ${item}`;
      } else if (/^\d+$/.test(item)) {
        return `- #${item}`;
      } else {
        return `- ${item}`;
      }
    });

  return [...new Set(issues)].join('\n'); // Remove duplicates
}

// Format related documentation
export function formatRelatedDocumentation(text) {
  if (!text || text.trim().toLowerCase() === 'n/a') return '';

  const allDocLinks = [];
  const lineArray = text
    .replace(/\\n/g, '\n')  // Replace literal \n with actual newlines
    .replace(/\r\n/g, '\n')
    .split(/[\n,]/);

  for (const path of lineArray) {
    const trimmedPath = path.trim();
    if (trimmedPath) {
      let pathWithoutLeadingSlash = trimmedPath;
      if (pathWithoutLeadingSlash.startsWith('/')) {
        pathWithoutLeadingSlash = pathWithoutLeadingSlash.substring(1);
      }
      const absoluteUrl = `https://github.com/jerseycheese/Narraitor/blob/develop/${pathWithoutLeadingSlash}`;
      allDocLinks.push(`[${trimmedPath}](${absoluteUrl})`);
    }
  }

  return allDocLinks.map(link => `- ${link}`).join('\n');
}