// GitHub Label Creator Script
// This script reads the labels defined in .github/labels.md and creates/updates them in the repository
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GitHub repository information - update these values
const OWNER = 'jerseycheese';
const REPO = 'narraitor';
const TOKEN = process.env.GITHUB_TOKEN; // Set your GitHub token as an environment variable

// Default colors if not specified in the labels.md file
const defaultColors = {
  bug: 'd73a4a',
  enhancement: 'a2eeef',
  'user-story': '0075ca',
  epic: '6f42c1',
  documentation: '0075ca',
  domain: '5319e7',
  priority: 'f9d0c4',
  complexity: 'bfd4f2',
  status: 'c2e0c6',
  question: 'd876e3',
  'help-wanted': '008672',
  'good-first-issue': '7057ff'
};

// Parse labels from markdown file
function parseLabelsFromMarkdown(filePath) {
  console.log(`Reading file: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const labels = [];
  let currentSection = '';
  
  for (const line of lines) {
    // Check for section headers
    if (line.startsWith('## ')) {
      currentSection = line.substring(3).trim().toLowerCase();
      console.log(`Found section: ${currentSection}`);
      continue;
    }
    
    // Look for label definitions
    if (line.startsWith('- `') || line.match(/^- [^`].+: /)) {
      let labelName = '';
      let description = '';
      let color = '';
      
      // Extract label name and description for lines with backticks
      if (line.startsWith('- `')) {
        const nameMatch = line.match(/- `(.+?)`/);
        if (nameMatch) {
          labelName = nameMatch[1];
        }
        
        // Extract description if available
        const descMatch = line.match(/- `(.+?)` - (.+)$/);
        if (descMatch) {
          description = descMatch[2].trim();
        }
      } 
      // Extract lines like "- Bug: `#d73a4a` (red)"
      else if (line.match(/^- [^`].+?: `/)) {
        const colorMatch = line.match(/- ([^:]+): `(#[0-9a-f]{6})`/i);
        if (colorMatch) {
          const labelType = colorMatch[1].trim().toLowerCase();
          color = colorMatch[2].replace('#', '');
          
          // Store color mapping but don't create a label for this line
          if (labelType in defaultColors) {
            defaultColors[labelType] = color;
          }
          continue;
        }
        
        // Handle domain, priority, complexity, and status labels without backticks
        const nameMatch = line.match(/^- ([^:]+):/);
        if (nameMatch && currentSection.includes('domain')) {
          labelName = `domain:${nameMatch[1].toLowerCase().replace(/\s+/g, '-')}`;
          description = `Related to ${nameMatch[1]} system`;
        } else if (nameMatch && currentSection.includes('priority')) {
          labelName = `priority:${nameMatch[1].toLowerCase()}`;
          description = `${nameMatch[1]} priority item`;
        } else if (nameMatch && currentSection.includes('complexity')) {
          labelName = `complexity:${nameMatch[1].toLowerCase()}`;
          description = `${nameMatch[1]} complexity item`;
        } else if (nameMatch && currentSection.includes('status')) {
          labelName = `status:${nameMatch[1].toLowerCase().replace(/\s+/g, '-')}`;
          description = `Item is in ${nameMatch[1]} status`;
        }
      }
      
      if (labelName) {
        // Determine color based on label prefix or type
        if (!color) {
          if (labelName.startsWith('domain:')) {
            color = defaultColors.domain;
          } else if (labelName.startsWith('priority:')) {
            color = defaultColors.priority;
          } else if (labelName.startsWith('complexity:')) {
            color = defaultColors.complexity;
          } else if (labelName.startsWith('status:')) {
            color = defaultColors.status;
          } else if (labelName === 'bug') {
            color = defaultColors.bug;
          } else if (labelName === 'enhancement') {
            color = defaultColors.enhancement;
          } else if (labelName === 'user-story') {
            color = defaultColors['user-story'];
          } else if (labelName === 'epic') {
            color = defaultColors.epic;
          } else if (labelName === 'documentation') {
            color = defaultColors.documentation;
          } else if (labelName === 'question') {
            color = defaultColors.question;
          } else if (labelName === 'help-wanted') {
            color = defaultColors['help-wanted'];
          } else if (labelName === 'good-first-issue') {
            color = defaultColors['good-first-issue'];
          } else {
            // Default color for other labels
            color = 'ededed';
          }
        }
        
        labels.push({
          name: labelName,
          color: color,
          description: description
        });
        
        console.log(`Found label: ${labelName} (${color})`);
      }
    }
  }
  
  // Ensure we have all required labels by checking against our known lists
  const labelNames = labels.map(l => l.name);
  
  // Add base type labels if missing
  const typeLabels = [
    { name: 'bug', description: "Something isn't working correctly" },
    { name: 'enhancement', description: "Improvement to an existing feature" },
    { name: 'user-story', description: "New feature described from a user's perspective" },
    { name: 'epic', description: "Large feature that contains multiple user stories" },
    { name: 'documentation', description: "Improvements or additions to documentation" },
    { name: 'question', description: "Further information is requested" },
    { name: 'help-wanted', description: "Extra attention is needed" },
    { name: 'good-first-issue', description: "Good for newcomers" }
  ];
  
  typeLabels.forEach(label => {
    if (!labelNames.includes(label.name)) {
      labels.push({
        name: label.name,
        color: defaultColors[label.name] || 'ededed',
        description: label.description
      });
    }
  });
  
  // Ensure we have domain labels
  const domains = [
    'world-configuration', 'character-system', 'decision-tracking', 
    'decision-relevance', 'narrative-engine', 'journal-system', 
    'state-management', 'infrastructure', 'ai-service', 'world-interface',
    'character-interface', 'journal-interface', 'utilities-and-helpers'
  ];
  
  domains.forEach(domain => {
    const labelName = `domain:${domain}`;
    if (!labelNames.includes(labelName)) {
      labels.push({
        name: labelName,
        color: defaultColors.domain,
        description: `Related to ${domain.replace(/-/g, ' ')} system`
      });
    }
  });
  
  // Ensure we have priority labels
  const priorities = ['high', 'medium', 'low', 'post-mvp'];
  priorities.forEach(priority => {
    const labelName = `priority:${priority}`;
    if (!labelNames.includes(labelName)) {
      labels.push({
        name: labelName,
        color: defaultColors.priority,
        description: `${priority.charAt(0).toUpperCase() + priority.slice(1)} priority item`
      });
    }
  });
  
  // Ensure we have complexity labels
  const complexities = ['small', 'medium', 'large'];
  complexities.forEach(complexity => {
    const labelName = `complexity:${complexity}`;
    if (!labelNames.includes(labelName)) {
      labels.push({
        name: labelName,
        color: defaultColors.complexity,
        description: `${complexity.charAt(0).toUpperCase() + complexity.slice(1)} complexity item`
      });
    }
  });
  
  // Ensure we have status labels
  const statuses = ['backlog', 'ready', 'in-progress', 'in-review', 'blocked'];
  statuses.forEach(status => {
    const labelName = `status:${status}`;
    if (!labelNames.includes(labelName)) {
      labels.push({
        name: labelName,
        color: defaultColors.status,
        description: `Item is in ${status.replace(/-/g, ' ')} status`
      });
    }
  });
  
  return labels;
}

// Get existing labels from GitHub
function getExistingLabels() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/labels`,
      method: 'GET',
      headers: {
        'User-Agent': 'Label-Creator-Script',
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const labels = JSON.parse(data);
            resolve(labels);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Create a new label
function createLabel(label) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      name: label.name,
      color: label.color,
      description: label.description || ''
    });
    
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/labels`,
      method: 'POST',
      headers: {
        'User-Agent': 'Label-Creator-Script',
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
          resolve();
        } else if (res.statusCode === 422 && responseData.includes('already_exists')) {
          // This is not an error, the label already exists
          resolve();
        } else {
          reject(new Error(`Failed to create label "${label.name}": ${responseData}`));
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

// Update an existing label
function updateLabel(label, oldName) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      new_name: label.name,
      color: label.color,
      description: label.description || ''
    });
    
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/labels/${encodeURIComponent(oldName)}`,
      method: 'PATCH',
      headers: {
        'User-Agent': 'Label-Creator-Script',
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
          resolve();
        } else {
          reject(new Error(`Failed to update label "${oldName}": ${responseData}`));
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

// Create or update labels
async function createOrUpdateLabels(labels) {
  try {
    const existingLabels = await getExistingLabels();
    const existingLabelMap = {};
    
    existingLabels.forEach(label => {
      existingLabelMap[label.name] = label;
    });
    
    let created = 0;
    let updated = 0;
    let unchanged = 0;
    let errors = 0;
    
    for (const label of labels) {
      try {
        if (existingLabelMap[label.name]) {
          const existingLabel = existingLabelMap[label.name];
          
          // Check if update is needed
          if (
            existingLabel.color !== label.color || 
            existingLabel.description !== label.description
          ) {
            await updateLabel(label, label.name);
            console.log(`Updated label: ${label.name}`);
            updated++;
          } else {
            console.log(`Label already exists and is up to date: ${label.name}`);
            unchanged++;
          }
        } else {
          await createLabel(label);
          console.log(`Created label: ${label.name}`);
          created++;
        }
      } catch (error) {
        // Check if error is because label already exists
        if (error.message.includes('already_exists')) {
          console.log(`Label already exists (caught in error handler): ${label.name}`);
          unchanged++;
        } else {
          console.error(`Error processing label "${label.name}":`, error.message);
          errors++;
        }
      }
    }
    
    return { created, updated, unchanged, errors };
  } catch (error) {
    console.error('Error getting existing labels:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    if (!TOKEN) {
      console.error('GitHub token not found. Please set the GITHUB_TOKEN environment variable.');
      process.exit(1);
    }
    
    // Adjust path to account for new directory structure
    const labelsFilePath = path.join(__dirname, '..', '..', '.github', 'labels.md');
    
    if (!fs.existsSync(labelsFilePath)) {
      console.error(`Labels file not found: ${labelsFilePath}`);
      process.exit(1);
    }
    
    console.log('Parsing labels from markdown file...');
    const labels = parseLabelsFromMarkdown(labelsFilePath);
    console.log(`Found ${labels.length} labels in markdown file.`);
    
    console.log('Creating/updating labels in GitHub...');
    const result = await createOrUpdateLabels(labels);
    
    console.log('\nSummary:');
    console.log(`- Created: ${result.created}`);
    console.log(`- Updated: ${result.updated}`);
    console.log(`- Unchanged: ${result.unchanged}`);
    console.log(`- Errors: ${result.errors}`);
    console.log(`- Total processed: ${labels.length}`);
  } catch (error) {
    console.error('Unhandled error:', error);
    process.exit(1);
  }
}

// Run the script
main();