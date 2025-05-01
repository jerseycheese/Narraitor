// story-validation-utils.js
// Utility functions for validating and extracting information from GitHub issues

// Extract domain from issue
export function extractDomainFromIssue(issue) {
  // Try to extract from labels first
  if (issue.labels && Array.isArray(issue.labels)) {
    const domainLabel = issue.labels.find(label => 
      typeof label === 'object' && label.name && label.name.startsWith('domain:')
    );
    
    if (domainLabel) {
      return domainLabel.name.replace('domain:', '');
    }
  }
  
  // Try to extract from body
  if (issue.body) {
    // Check for domain in Markdown link
    const linkMatch = issue.body.match(/\[([^.]+)\.md\]\(https:\/\/github\.com\/[\w-]+\/[\w-]+\/blob\/(?:main|develop)\/docs\/requirements\/core\/([^)]+)\.md\)/);
    if (linkMatch) {
      return linkMatch[2];
    }
    
    // Check for domain:xyz in the body
    const domainMatch = issue.body.match(/domain:([a-z-]+)/i);
    if (domainMatch) {
      return domainMatch[1];
    }
  }
  
  // Default domain
  return 'utilities-and-helpers';
}

// Extract user story text from issue
export function extractUserStoryFromIssue(issue) {
  if (!issue.body) return '';
  
  const storyMatch = issue.body.match(/## User Story\n([\s\S]*?)(?=\n##)/);
  if (storyMatch) {
    return storyMatch[1].trim();
  }
  
  // Fall back to title if no user story section found
  if (issue.title && issue.title.startsWith('[USER STORY]')) {
    return issue.title.replace('[USER STORY]', '').trim();
  }
  
  return '';
}

// Helper function to extract complexity from issue body
export function extractComplexityFromIssue(issue) {
  if (!issue.body) return null;
  
  const complexitySection = issue.body.match(/## Estimated Complexity[\s\S]*?(?=\n##|$)/);
  if (!complexitySection) return null;
  
  const smallMatch = complexitySection[0].match(/\[x\]\s*Small/i);
  const mediumMatch = complexitySection[0].match(/\[x\]\s*Medium/i);
  const largeMatch = complexitySection[0].match(/\[x\]\s*Large/i);
  
  if (smallMatch) return 'Small';
  if (mediumMatch) return 'Medium';
  if (largeMatch) return 'Large';
  
  return null;
}

// Helper function to extract priority from issue body
export function extractPriorityFromIssue(issue) {
  if (!issue.body) return null;
  
  const prioritySection = issue.body.match(/## Priority[\s\S]*?(?=\n##|$)/);
  if (!prioritySection) return null;
  
  const highMatch = prioritySection[0].match(/\[x\]\s*High/i);
  const mediumMatch = prioritySection[0].match(/\[x\]\s*Medium/i);
  const lowMatch = prioritySection[0].match(/\[x\]\s*Low/i);
  const postMvpMatch = prioritySection[0].match(/\[x\]\s*Post-MVP/i);
  
  if (highMatch) return 'High';
  if (mediumMatch) return 'Medium';
  if (lowMatch) return 'Low';
  if (postMvpMatch) return 'Post-MVP';
  
  return null;
}

// Function to validate issues against requirement docs
export async function validateIssuesAgainstDocs(issues) {
  console.log(`\nValidating ${issues.length} issues against requirement docs...`);
  const inconsistencies = [];
  
  for (const [issue] of issues.entries()) {
    try {
      const domain = extractDomainFromIssue(issue);
      const storyText = extractUserStoryFromIssue(issue);
      
      // Skip issues without proper story text
      if (!storyText || storyText.length < 10) {
        console.log(`- Skipping issue #${issue.number} (no valid story text)`);
        continue;
      }
      
      // Get expected complexity and priority from mapping
      const { getStoryComplexityAndPriority } = await import('./story-complexity-mapping.js');
      const { complexity: expectedComplexity, priority: expectedPriority } = 
        getStoryComplexityAndPriority(storyText, domain);
      
      // Extract current values from issue body
      const currentComplexity = extractComplexityFromIssue(issue);
      const currentPriority = extractPriorityFromIssue(issue);
      
      // Check for existing complexity and priority labels
      let currentComplexityLabel = null;
      let currentPriorityLabel = null;
      
      for (const label of issue.labels) {
        const labelName = typeof label === 'object' ? label.name : label;
        const lowerName = labelName.toLowerCase();
        
        if (lowerName.startsWith('complexity:')) {
          currentComplexityLabel = labelName;
        } else if (lowerName.startsWith('priority:')) {
          currentPriorityLabel = labelName;
        }
      }
      
      // Check for inconsistencies
      const expectedComplexityLabel = `complexity:${expectedComplexity.toLowerCase()}`;
      const expectedPriorityLabel = `priority:${expectedPriority.toLowerCase().replace(/\s+/g, '-')}`;
      
      const hasBodyComplexityMismatch = currentComplexity !== expectedComplexity;
      const hasBodyPriorityMismatch = currentPriority !== expectedPriority;
      
      const hasLabelComplexityMismatch = currentComplexityLabel && 
        currentComplexityLabel.toLowerCase() !== expectedComplexityLabel.toLowerCase();
      
      const hasLabelPriorityMismatch = currentPriorityLabel && 
        currentPriorityLabel.toLowerCase() !== expectedPriorityLabel.toLowerCase();
      
      if (hasBodyComplexityMismatch || hasBodyPriorityMismatch || 
          hasLabelComplexityMismatch || hasLabelPriorityMismatch) {
        
        console.log(`- Issue #${issue.number} has inconsistencies:`);
        if (hasBodyComplexityMismatch) {
          console.log(`  * Body complexity: ${currentComplexity} (expected: ${expectedComplexity})`);
        }
        if (hasBodyPriorityMismatch) {
          console.log(`  * Body priority: ${currentPriority} (expected: ${expectedPriority})`);
        }
        if (hasLabelComplexityMismatch) {
          console.log(`  * Complexity label: ${currentComplexityLabel} (expected: ${expectedComplexityLabel})`);
        }
        if (hasLabelPriorityMismatch) {
          console.log(`  * Priority label: ${currentPriorityLabel} (expected: ${expectedPriorityLabel})`);
        }
        
        inconsistencies.push({
          issue: issue.number,
          title: issue.title,
          domain,
          storyText: storyText.substring(0, 50) + '...',
          expectedComplexity,
          currentComplexity,
          expectedPriority,
          currentPriority,
          expectedComplexityLabel,
          currentComplexityLabel,
          expectedPriorityLabel,
          currentPriorityLabel
        });
      } else {
        console.log(`- Issue #${issue.number} is consistent`);
      }
    } catch (err) {
      console.error(`❌ Error validating issue #${issue.number}: ${err.message}`);
    }
  }
  
  console.log(`\nFound ${inconsistencies.length} issues with inconsistencies.`);
  return inconsistencies;
}