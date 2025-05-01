// Unified User Story Migration Script
// This script extracts user stories from requirement documents and creates GitHub issues.

import fs from 'fs';
import path, { dirname } from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { getStoryComplexityAndPriority } from './story-complexity-mapping.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load GitHub issue template
const ISSUE_TEMPLATE_PATH = path.join(__dirname, '..', '.github', 'ISSUE_TEMPLATE', 'user-story.md');
const ISSUE_TEMPLATE_CONTENT = fs.readFileSync(ISSUE_TEMPLATE_PATH, 'utf8');
const ISSUE_TEMPLATE_FM_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
const ISSUE_TEMPLATE_FM_MATCH = ISSUE_TEMPLATE_CONTENT.match(ISSUE_TEMPLATE_FM_REGEX);
if (!ISSUE_TEMPLATE_FM_MATCH) {
  console.error('Invalid issue template format');
  process.exit(1);
}
const ISSUE_BODY_TEMPLATE = ISSUE_TEMPLATE_CONTENT.slice(ISSUE_TEMPLATE_FM_MATCH[0].length);


const OWNER = 'jerseycheese';
const REPO = 'narraitor';
const TOKEN = process.env.GITHUB_TOKEN;

// Display help information
function displayHelp() {
  console.log(`
User Stories Migration Script
-----------------------------
Usage: node scripts/migrate-user-stories.js [options]

Options:
  --help              Display this help text
  --list-domains      List all available domains and exit
  --domain NAME       Filter issues to a specific domain (e.g., world-configuration)
  --all-domains       Process all domains
  --dry-run           Preview issues without creating them
  --limit N           Limit the number of issues to process in one run
  --skip N            Skip the first N issues
`);
  process.exit(0);
}

// List available domains from docs/requirements/core
function listDomains() {
  const coreDir = path.join(__dirname, '..', 'docs', 'requirements', 'core');
  if (!fs.existsSync(coreDir)) {
    console.error(`Directory not found: ${coreDir}`);
    process.exit(1);
  }
  const domains = fs.readdirSync(coreDir)
    .filter(file => file.endsWith('.md'))
    .map(file => file.replace('.md', ''))
    .sort();
  console.log('\nAvailable domains:');
  domains.forEach(domain => console.log(`- ${domain}`));
  console.log('\nUse --all-domains to process all domains at once');
  process.exit(0);
}

// Get all available domains
function getAllDomains() {
  const coreDir = path.join(__dirname, '..', 'docs', 'requirements', 'core');
  if (!fs.existsSync(coreDir)) {
    console.error(`Directory not found: ${coreDir}`);
    process.exit(1);
  }
  return fs.readdirSync(coreDir)
    .filter(file => file.endsWith('.md'))
    .map(file => file.replace('.md', ''))
    .sort();
}

// Extract acceptance criteria from the markdown content
function extractAcceptanceCriteria(content, userStory) {
  // Extract the "Acceptance Criteria" section
  const acMatch = content.match(/## Acceptance Criteria\n([\s\S]*?)(?=\n##|$)/);
  if (!acMatch) return [];
  
  const acSection = acMatch[1].trim();
  const criteria = acSection.split('\n').filter(line => line.trim().startsWith('1.') || line.trim().startsWith('-'));
  
  // Take the top 3-5 most relevant acceptance criteria for this user story
  const relevantCriteria = criteria
    .filter(criterion => {
      const storyKeywords = userStory.toLowerCase().split(' ');
      return storyKeywords.some(keyword => 
        keyword.length > 4 && criterion.toLowerCase().includes(keyword)
      );
    })
    .slice(0, 4);
  
  // If no relevant criteria found, take the first 3 general ones
  return relevantCriteria.length > 0 ? relevantCriteria : criteria.slice(0, 3);
}

// Extract technical requirements from the markdown content
function extractTechnicalRequirements(content) {
  // Extract the "MVP Scope Boundaries" section, focusing on "Included"
  const mvpMatch = content.match(/### Included\n([\s\S]*?)(?=\n###|$)/);
  if (!mvpMatch) return [];
  
  const mvpSection = mvpMatch[1].trim();
  
  // Extract bullet points, focusing on the first level ones
  const requirements = mvpSection
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.trim().replace(/^- \*\*([^*]+)\*\*:/, '- $1:')) // Normalize formatting
    .slice(0, 3); // Take top 3 to keep it concise
  
  return requirements;
}

// Generate implementation notes based on user story content and technical requirements
function generateImplementationNotes(story, technicalRequirements) {
  const storyContent = story.content || '';
  const category = story.category || '';
  const lowerStory = storyContent.toLowerCase();
  
  let notes = [];
  
  // First note based on story pattern and category
  const actionWords = ['create', 'implement', 'develop', 'build', 'integrate', 'manage', 'track', 'handle'];
  const actionMatch = actionWords.find(word => lowerStory.includes(word));
  
  if (category && actionMatch) {
    notes.push(`Follow the ${category} module pattern for the ${actionMatch} functionality`);
  } else {
    notes.push(`Use standard implementation approach for this feature`);
  }
  
  // Second note based on technical requirements
  if (technicalRequirements && technicalRequirements.length > 0) {
    const req = technicalRequirements[0].toLowerCase();
    if (req.includes('api') || req.includes('service')) {
      notes.push(`Implement with service interface design patterns`);
    } else if (req.includes('storage') || req.includes('data')) {
      notes.push(`Consider data persistence and state management requirements`);
    } else {
      notes.push(`Ensure compatibility with existing system architecture`);
    }
  }
  
  // Third note - always include testing recommendation
  notes.push(`Write tests first following TDD approach`);
  
  return notes;
}

// Extract related documentation links
function buildRelatedDocumentationLink(domain) {
  return `- [${domain}.md](https://github.com/${OWNER}/${REPO}/blob/develop/docs/requirements/core/${domain}.md) - Source requirements document`;
}

// Generate user stories from GitHub Issues section if no User Stories section exists
function generateUserStoriesFromGitHubIssues(content, domainName) {
  const gitHubIssuesMatch = content.match(/## GitHub Issues\n([\s\S]*?)(?=\n##|$)/);
  if (!gitHubIssuesMatch) return [];
  
  const gitHubIssuesSection = gitHubIssuesMatch[1].trim();
  const issues = gitHubIssuesSection.split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.trim().replace(/^- \[([^\]]+)\].*$/, '$1'));
  
  return issues.map(issue => {
    // Convert GitHub issue title to user story format
    let storyContent = '';
    
    // Look for key action words to create user story pattern
    if (issue.toLowerCase().startsWith('implement') || 
        issue.toLowerCase().startsWith('create') || 
        issue.toLowerCase().startsWith('build') || 
        issue.toLowerCase().startsWith('develop')) {
      
      // Extract the main functionality
      
      // Transform to user story format
      storyContent = `As a developer, I want to ${issue.toLowerCase()} so that the application has proper utility functions and infrastructure.`;
    } else {
      // Default transformation
      storyContent = `As a developer, I want to implement ${issue.toLowerCase()} so that the application has the necessary utility functions.`;
    }
    
    return {
      domain: domainName,
      priority: 'Medium',
      content: storyContent,
      category: 'Core Utilities'
    };
  });
}

// Verify labels in repository
async function verifyLabels() {
  try {
    // Check for complexity labels
    console.log('Checking for complexity labels...');
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/labels`,
      method: 'GET',
      headers: {
        'User-Agent': 'User-Story-Migration-Script',
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const labels = await new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        let responseData = '';
        res.on('data', chunk => (responseData += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(responseData));
            } catch (err) {
              reject(new Error(`Failed to parse response: ${err.message}`));
            }
          } else {
            reject(new Error(`Failed to get labels: ${responseData}`));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    // Check for complexity labels
    const complexityLabels = ['complexity:small', 'complexity:medium', 'complexity:large'];
    const missingLabels = complexityLabels.filter(
      label => !labels.some(l => l.name === label)
    );
    
    if (missingLabels.length > 0) {
      console.warn(`Warning: Missing complexity labels: ${missingLabels.join(', ')}`);
      console.warn('Run "node scripts/github-label-creator.js" to create all required labels before proceeding.');
    } else {
      console.log('All complexity labels exist.');
    }
  } catch (err) {
    console.warn(`Warning: Could not verify labels: ${err.message}`);
    console.warn('Run "node scripts/github-label-creator.js" to ensure all required labels exist.');
  }
}

// Check if a user story has already been migrated
async function checkExistingStories(domain) {
  try {
    console.log(`Checking for existing stories in domain: ${domain}...`);
    const labels = [`domain:${domain}`, 'user-story'];
    const labelsParam = `labels=${labels.map(encodeURIComponent).join(',')}`;
    
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/issues?${labelsParam}&state=all&per_page=100`,
      method: 'GET',
      headers: {
        'User-Agent': 'User-Story-Migration-Script',
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const existingIssues = await new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        let responseData = '';
        res.on('data', chunk => (responseData += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(responseData));
            } catch (err) {
              reject(new Error(`Failed to parse response: ${err.message}`));
            }
          } else {
            reject(new Error(`Failed to get issues: ${responseData}`));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    console.log(`Found ${existingIssues.length} existing stories for domain: ${domain}`);
    return existingIssues.map(issue => issue.title);
  } catch (err) {
    console.warn(`Warning: Could not check existing stories: ${err.message}`);
    return [];
  }
}

// Parse user stories from markdown file
function parseUserStoriesFromMarkdown(filePath) {
  console.log(`Reading file: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  const sections = content.split(/^## /m).slice(1);
  let userStories = [];
  
  // Extract the domain name from the file path
  const domainName = path.basename(filePath, '.md');
  console.log(`Domain name: ${domainName}`);
  
  // First, check if there's a dedicated User Stories section
  let hasUserStoriesSection = false;
  
  for (const section of sections) {
    const lines = section.split('\n');
    const sectionTitle = lines[0].trim();
    console.log(`Processing section: ${sectionTitle}`);
    
    if (sectionTitle.toLowerCase().includes('user stories')) {
      hasUserStoriesSection = true;
      let currentPriority = '';
      let storyContent = '';
      let storyCategory = '';
      let inStory = false;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.match(/^\d+\.\s+\*\*(.+)\*\*/)) {
          // This is a category header like "1. **World Creation**"
          storyCategory = line.match(/^\d+\.\s+\*\*(.+)\*\*/)[1];
          console.log(`  Found category: ${storyCategory}`);
          continue;
        }
        
        if (line.startsWith('### ')) {
          currentPriority = line.replace('### ', '').trim();
          console.log(`  Found priority section: ${currentPriority}`);
          continue;
        }
        
        if (line.trim().startsWith('- As a ')) {
          if (inStory) {
            userStories.push({ 
              domain: domainName, 
              priority: currentPriority, 
              content: storyContent,
              category: storyCategory 
            });
          }
          storyContent = line.trim().substring(2);
          inStory = true;
        } else if (inStory && !line.trim().startsWith('-') && line.trim() !== '') {
          storyContent += '\n' + line.trim();
        } else if (inStory && (line.trim().startsWith('-') || line.trim() === '')) {
          userStories.push({ 
            domain: domainName, 
            priority: currentPriority, 
            content: storyContent,
            category: storyCategory 
          });
          inStory = false;
          if (line.trim().startsWith('- As a ')) {
            storyContent = line.trim().substring(2);
            inStory = true;
          }
        }
      }
      
      if (inStory) {
        userStories.push({ 
          domain: domainName, 
          priority: currentPriority, 
          content: storyContent,
          category: storyCategory 
        });
      }
    }
  }
  
  // If no User Stories section found, try to generate from GitHub Issues
  if (!hasUserStoriesSection || userStories.length === 0) {
    console.log(`No User Stories section found, generating from GitHub Issues...`);
    userStories = generateUserStoriesFromGitHubIssues(content, domainName);
    console.log(`Generated ${userStories.length} user stories from GitHub Issues section`);
  }
  
  // Extract acceptance criteria and technical requirements
  const technicalRequirements = extractTechnicalRequirements(content);
  
  // Get acceptance criteria for each user story and add the new properties
  userStories.forEach(story => {
    story.acceptanceCriteria = extractAcceptanceCriteria(content, story.content);
    story.technicalRequirements = technicalRequirements;
    story.relatedDocumentation = buildRelatedDocumentationLink(domainName);
    
    // Add implementation notes
    story.implementationNotes = generateImplementationNotes(story, story.technicalRequirements);
    
    // Add complexity and priority using our mapping
    const { complexity, priority } = getStoryComplexityAndPriority(story.content, domainName);
    story.complexity = complexity;
    
    // Only override the story priority if it doesn't already have one or if it's empty
    if (!story.priority || story.priority.trim() === '') {
      story.priority = priority;
    }
    
    console.log(`Story complexity: ${story.complexity}, priority: ${story.priority}`);
  });
  
  return userStories.map(story => {
    const lines = story.content.split('\n');
    const title = lines[0];
    let priorityLevel = story.priority || 'Medium';
    
    // Format domain label correctly
    let domainLabel = story.domain.toLowerCase().replace(/\s+/g, '-');
    if (!domainLabel.startsWith('domain:')) {
      domainLabel = `domain:${domainLabel}`;
    }
    
    // Format complexity label
    const complexityLabel = `complexity:${story.complexity.toLowerCase()}`;
    
    // Format priority label
    const priorityLabelValue = `priority:${priorityLevel.toLowerCase().replace(/\s+|\(|\)/g, '-')}`;
    
    // Populate the issue body template
    const issueTitle = `[USER STORY] ${title}`;
    
    // Start with the original template
    let body = ISSUE_BODY_TEMPLATE;
    
    // Replace the user story placeholder with actual content
    body = body.replace(
      'As a [type of user], I want [goal/need] so that [benefit/value].',
      story.content
    );
    
    // Remove the entire domain section
    body = body.replace(/## Domain[\s\S]*?(?=\n##)/, '');
    
    // Populate acceptance criteria
    let acText = '';
    if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
      acText = story.acceptanceCriteria.map(ac => `- [ ] ${ac.replace(/^\d+\.\s+/, '')}`).join('\n');
    } else {
      acText = '- [ ] TBD';
    }
    body = body.replace(/<!-- List the specific[\s\S]*?- \[ \] [\s\S]*?- \[ \] [\s\S]*?- \[ \] [\s\S]*?- \[ \] /, `<!-- List the specific, measurable conditions that must be met for this story to be considered complete -->\n${acText}\n`);
    
    // Populate technical requirements
    let trText = '';
    if (story.technicalRequirements && story.technicalRequirements.length > 0) {
      trText = story.technicalRequirements.join('\n');
    } else {
      trText = '- TBD';
    }
    body = body.replace(/<!-- List technical[\s\S]*?- [\s\S]*?- [\s\S]*?- /, `<!-- List technical implementation details, constraints, or dependencies -->\n${trText}\n`);
    
    // Populate related documentation
    body = body.replace(/<!-- Link to requirements[\s\S]*?- /, `<!-- Link to requirements documents and other references -->\n${story.relatedDocumentation}\n`);
    
    // Populate implementation notes
    const implNotes = story.implementationNotes || [];
    const implNotesText = implNotes.map(note => `- ${note}`).join('\n');
    body = body.replace(/<!-- Add guidance[\s\S]*?- [\s\S]*?- [\s\S]*?- /, 
                      `<!-- Add guidance on implementation approach, architecture considerations, etc. -->\n${implNotesText}\n`);
    
    // Check the correct priority checkbox
    const prioritySection = body.match(/## Priority[\s\S]*?(?=\n##|$)/);
    if (prioritySection) {
      let priorityText = prioritySection[0];
      
      if (priorityLevel.includes('High')) {
        priorityText = priorityText.replace('- [ ] High (MVP)', '- [x] High (MVP)');
      } else if (priorityLevel.includes('Medium')) {
        priorityText = priorityText.replace('- [ ] Medium (MVP Enhancement)', '- [x] Medium (MVP Enhancement)');
      } else if (priorityLevel.includes('Low')) {
        priorityText = priorityText.replace('- [ ] Low (Nice to Have)', '- [x] Low (Nice to Have)');
      } else if (priorityLevel.includes('Post-MVP')) {
        priorityText = priorityText.replace('- [ ] Post-MVP', '- [x] Post-MVP');
      }
      
      body = body.replace(/## Priority[\s\S]*?(?=\n##|$)/, priorityText);
    }
    
    // Set the estimated complexity checkbox
    const complexitySection = body.match(/## Estimated Complexity[\s\S]*?(?=\n##|$)/);
    if (complexitySection) {
      let complexityText = complexitySection[0];
      
      if (story.complexity === 'Small') {
        complexityText = complexityText.replace('- [ ] Small (1-2 days)', '- [x] Small (1-2 days)');
      } else if (story.complexity === 'Medium') {
        complexityText = complexityText.replace('- [ ] Medium (3-5 days)', '- [x] Medium (3-5 days)');
      } else if (story.complexity === 'Large') {
        complexityText = complexityText.replace('- [ ] Large (1+ week)', '- [x] Large (1+ week)');
      }
      
      body = body.replace(/## Estimated Complexity[\s\S]*?(?=\n##|$)/, complexityText);
    }
    
    return {
      title: issueTitle,
      body,
      labels: ['user-story', domainLabel, priorityLabelValue, complexityLabel]
    };
  });
}

// Create a GitHub issue
function createIssue(issue) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ title: issue.title, body: issue.body, labels: issue.labels });
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/issues`,
      method: 'POST',
      headers: {
        'User-Agent': 'User-Story-Migration-Script',
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    const req = https.request(options, res => {
      let responseData = '';
      res.on('data', chunk => (responseData += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (err) {
            reject(new Error(`Failed to parse response: ${err.message}`));
          }
        } else {
          reject(new Error(`Failed to create issue: ${responseData}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Filter user stories that already exist in GitHub
async function filterExistingStories(userStories, domain) {
  try {
    const existingTitles = await checkExistingStories(domain);
    const filtered = userStories.filter(story => {
      const exists = existingTitles.includes(story.title);
      if (exists) {
        console.log(`Skipping existing story: ${story.title}`);
      }
      return !exists;
    });
    
    console.log(`Found ${userStories.length - filtered.length} existing stories that will be skipped.`);
    return filtered;
  } catch (error) {
    console.warn(`Error while filtering existing stories: ${error.message}`);
    return userStories;
  }
}

// Create GitHub issues for user stories
async function createIssuesForUserStories(userStories) {
  const count = userStories.length;
  if (count === 0) {
    console.log('No new user stories to create.');
    return { created: 0, errors: 0, skipped: 0 };
  }
  
  console.log(`Ready to create ${count} GitHub issues. Continue? (y/n)`);
  const proceed = await new Promise(resolve =>
    process.stdin.once('data', data => resolve(data.toString().trim().toLowerCase() === 'y'))
  );
  if (!proceed) {
    console.log('Operation cancelled');
    return { created: 0, errors: 0, skipped: count };
  }
  let created = 0, errors = 0;
  console.log('Creating GitHub issues...');
  for (const [index, story] of userStories.entries()) {
    try {
      console.log(`Creating issue ${index + 1}/${count}: ${story.title}`);
      const issue = await createIssue(story);
      console.log(`Created issue #${issue.number}: ${issue.html_url}`);
      created++;
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`Error creating issue: ${err.message}`);
      errors++;
    }
  }
  return { created, errors, skipped: 0 };
}

// Process a single domain
async function processDomain(domain, skip, limit, dryRun) {
  const userStoriesFilePath = path.join(__dirname, '..', 'docs', 'requirements', 'core', `${domain}.md`);
  if (!fs.existsSync(userStoriesFilePath)) {
    console.error(`User stories file not found: ${userStoriesFilePath}`);
    return { created: 0, errors: 0, skipped: 0 };
  }
  
  console.log(`\nProcessing domain: ${domain}`);
  console.log('Parsing user stories from markdown file...');
  let userStories = parseUserStoriesFromMarkdown(userStoriesFilePath);
  
  // Filter out existing stories
  userStories = await filterExistingStories(userStories, domain);
  
  if (skip) {
    console.log(`Skipping first ${skip} user stories.`);
    userStories = userStories.slice(skip);
  }
  if (limit) {
    console.log(`Limiting to first ${limit} user stories.`);
    userStories = userStories.slice(0, limit);
  }
  console.log(`Found ${userStories.length} new user stories to process.`);
  if (userStories.length > 0) {
    console.log('\nExample of the first user story to be created:');
    console.log(`Title: ${userStories[0].title}`);
    console.log(`Labels: ${userStories[0].labels.join(', ')}`);
    console.log(`Body:\n${userStories[0].body}`);
  }
  if (dryRun) {
    console.log(`\nDRY RUN COMPLETED for domain: ${domain} - No issues were created`);
    return { created: 0, errors: 0, skipped: userStories.length };
  }
  
  return await createIssuesForUserStories(userStories);
}

// Process all domains
async function processAllDomains(skip, limit, dryRun) {
  console.log('Processing all domains...');
  const domains = getAllDomains();
  
  let totalCreated = 0, totalErrors = 0, totalSkipped = 0;
  
  for (const domain of domains) {
    const result = await processDomain(domain, skip, limit, dryRun);
    totalCreated += result.created;
    totalErrors += result.errors;
    totalSkipped += result.skipped;
  }
  
  return { created: totalCreated, errors: totalErrors, skipped: totalSkipped };
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) displayHelp();
  if (args.includes('--list-domains')) listDomains();
  if (!TOKEN) {
    console.error('GitHub token not found. Set GITHUB_TOKEN environment variable.');
    process.exit(1);
  }
  
  const dryRun = args.includes('--dry-run');
  const skipIndex = args.indexOf('--skip');
  const skip = skipIndex !== -1 && args[skipIndex + 1] ? parseInt(args[skipIndex + 1], 10) : 0;
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 && args[limitIndex + 1] ? parseInt(args[limitIndex + 1], 10) : null;
  
  const allDomains = args.includes('--all-domains');
  const domainIndex = args.indexOf('--domain');
  const DOMAIN = domainIndex !== -1 && args[domainIndex + 1] ? args[domainIndex + 1] : null;
  
  if (!allDomains && !DOMAIN) {
    console.error('No domain specified. Use --domain <domain> or --all-domains');
    process.exit(1);
  }
  
  // Verify required labels exist
  await verifyLabels();
  
  let result;
  if (allDomains) {
    result = await processAllDomains(skip, limit, dryRun);
  } else {
    result = await processDomain(DOMAIN, skip, limit, dryRun);
  }
  
  // Show summary
  console.log('\nSummary:');
  console.log(`- Created: ${result.created}`);
  console.log(`- Errors: ${result.errors}`);
  console.log(`- Skipped: ${result.skipped}`);
  console.log(`- Total processed: ${result.created + result.errors + result.skipped}`);
}

// Start execution
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

export { parseUserStoriesFromMarkdown, createIssuesForUserStories };