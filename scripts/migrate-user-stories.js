// User Story Migration Script
// This script reads user stories from docs/user-stories.md and creates GitHub issues for them
const fs = require('fs');
const path = require('path');
const https = require('https');

// GitHub repository information - update these values
const OWNER = 'jerseycheese';
const REPO = 'narraitor';
const TOKEN = process.env.GITHUB_TOKEN; // Set your GitHub token as an environment variable

// Parse user stories from markdown file
function parseUserStoriesFromMarkdown(filePath) {
  console.log(`Reading file: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Split content by headers
  const sections = content.split(/^## /m).slice(1); // Skip the first part (overview)
  
  const userStories = [];
  
  // Process each section (domain)
  for (const section of sections) {
    const lines = section.split('\n');
    const domain = lines[0].trim();
    console.log(`Processing domain: ${domain}`);
    
    // Handle priority subsections within the domain
    let currentPriority = '';
    let storyContent = '';
    let inStory = false;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for priority headers
      if (line.startsWith('### ')) {
        currentPriority = line.replace('### ', '').trim();
        console.log(`  Found priority section: ${currentPriority}`);
        continue;
      }
      
      // Check for user story bullet points
      if (line.trim().startsWith('- As a ')) {
        if (inStory) {
          // Save the previous story before starting a new one
          userStories.push({
            domain,
            priority: currentPriority,
            content: storyContent
          });
        }
        
        // Start a new story
        storyContent = line.trim().substring(2); // Remove the "- " prefix
        inStory = true;
      } 
      // Skip empty lines or other bullet points between user stories
      else if (inStory && !line.trim().startsWith('-') && line.trim() !== '') {
        // Continue with the same story (for multi-line stories)
        storyContent += '\n' + line.trim();
      }
      // End of a story
      else if (inStory && (line.trim().startsWith('-') || line.trim() === '')) {
        // Save this story
        userStories.push({
          domain,
          priority: currentPriority,
          content: storyContent
        });
        inStory = false;
        
        // If this is a new story, process it
        if (line.trim().startsWith('- As a ')) {
          storyContent = line.trim().substring(2);
          inStory = true;
        }
      }
    }
    
    // Don't forget the last story in a section
    if (inStory) {
      userStories.push({
        domain,
        priority: currentPriority,
        content: storyContent
      });
    }
  }
  
  // Process user stories to extract title and description
  return userStories.map(story => {
    // First line becomes the title
    const lines = story.content.split('\n');
    const title = lines[0];
    const description = lines.length > 1 ? lines.slice(1).join('\n') : '';
    
    // Extract priority level
    let priorityLevel = 'Medium';
    if (story.priority.includes('High') || story.priority.includes('MVP')) {
      priorityLevel = 'High (MVP)';
    } else if (story.priority.includes('Low')) {
      priorityLevel = 'Low';
    } else if (story.priority.includes('Post-MVP')) {
      priorityLevel = 'Post-MVP';
    }
    
    // Normalize domain name for labels
    let domainLabel = story.domain.toLowerCase().replace(/\s+/g, '-');
    if (!domainLabel.startsWith('domain:')) {
      domainLabel = `domain:${domainLabel}`;
    }
    
    return {
      title: `[USER STORY] ${title}`,
      body: formatIssueBody(title, description, story.domain, priorityLevel),
      labels: ['user-story', domainLabel, `priority:${priorityLevel.toLowerCase().replace(/\s+|\(|\)/g, '-')}`]
    };
  });
}

// Format the issue body according to the template
function formatIssueBody(title, description, domain, priority) {
  return `## User Story
${title}

## Domain
${domain}

## Priority
${priority}

## Acceptance Criteria
1. _[Add acceptance criteria]_

## Additional Context
${description || '_[Add any additional context here]_'}

## Related Issues/Stories
_[Link to any related issues or stories]_

---
*Migrated from user-stories.md*`;
}

// Create a GitHub issue
function createIssue(issue) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      title: issue.title,
      body: issue.body,
      labels: issue.labels
    });
    
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
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const issueData = JSON.parse(responseData);
            resolve(issueData);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        } else {
          reject(new Error(`Failed to create issue: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Create GitHub issues for user stories
async function createIssuesForUserStories(userStories) {
  // Ask for confirmation before proceeding
  const count = userStories.length;
  console.log(`Ready to create ${count} GitHub issues. Continue? (y/n)`);
  
  // Mock user confirmation for this script (you'd replace this with actual user input)
  const proceed = await new Promise(resolve => {
    process.stdin.once('data', data => {
      resolve(data.toString().trim().toLowerCase() === 'y');
    });
  });
  
  if (!proceed) {
    console.log('Operation cancelled');
    return { created: 0, errors: 0 };
  }
  
  let created = 0;
  let errors = 0;
  
  console.log('Creating GitHub issues...');
  for (const [index, story] of userStories.entries()) {
    try {
      console.log(`Creating issue ${index + 1}/${count}: ${story.title}`);
      const issue = await createIssue(story);
      console.log(`Created issue #${issue.number}: ${issue.html_url}`);
      created++;
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error creating issue: ${error.message}`);
      errors++;
    }
  }
  
  return { created, errors };
}

// Main function
async function main() {
  try {
    if (!TOKEN) {
      console.error('GitHub token not found. Please set the GITHUB_TOKEN environment variable.');
      process.exit(1);
    }
    
    const userStoriesFilePath = path.join(__dirname, '..', 'docs', 'user-stories.md');
    
    if (!fs.existsSync(userStoriesFilePath)) {
      console.error(`User stories file not found: ${userStoriesFilePath}`);
      process.exit(1);
    }
    
    console.log('Parsing user stories from markdown file...');
    const userStories = parseUserStoriesFromMarkdown(userStoriesFilePath);
    console.log(`Found ${userStories.length} user stories.`);
    
    // Display the first user story as an example
    if (userStories.length > 0) {
      console.log('\nExample of the first user story to be created:');
      console.log(`Title: ${userStories[0].title}`);
      console.log(`Labels: ${userStories[0].labels.join(', ')}`);
      console.log(`Body:\n${userStories[0].body.substring(0, 200)}...`);
    }
    
    const result = await createIssuesForUserStories(userStories);
    
    console.log('\nSummary:');
    console.log(`- Created: ${result.created}`);
    console.log(`- Errors: ${result.errors}`);
    console.log(`- Total processed: ${userStories.length}`);
  } catch (error) {
    console.error('Unhandled error:', error);
    process.exit(1);
  }
}

// Only run the script if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  parseUserStoriesFromMarkdown,
  createIssuesForUserStories
};
