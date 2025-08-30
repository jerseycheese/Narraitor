#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Update story titles to match atomic design structure
function fixStoryTitles() {
  const storyDirs = [
    { dir: 'src/stories/01-atoms', prefix: '01-Atoms' },
    { dir: 'src/stories/02-molecules', prefix: '02-Molecules' },
    { dir: 'src/stories/03-organisms', prefix: '03-Organisms' },
    { dir: 'src/stories/04-templates', prefix: '04-Templates' },
    { dir: 'src/stories/05-pages', prefix: '05-Pages' },
    { dir: 'src/stories/06-patterns', prefix: '06-Patterns' }
  ];

  let totalFiles = 0;
  let fixedFiles = 0;

  storyDirs.forEach(({ dir, prefix }) => {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir).filter(file => file.endsWith('.stories.tsx'));
    files.forEach(file => {
      const filePath = path.join(dir, file);
      totalFiles++;
      
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;
        
        // Find and replace story title
        const titleRegex = /title:\s*['"`]([^'"`]+)['"`]/;
        const match = content.match(titleRegex);
        
        if (match) {
          const oldTitle = match[1];
          const componentName = file.replace('.stories.tsx', '');
          const newTitle = `${prefix}/${componentName}`;
          
          content = content.replace(titleRegex, `title: '${newTitle}'`);
          changed = true;
          console.log(`${filePath}: "${oldTitle}" -> "${newTitle}"`);
        }
        
        if (changed) {
          fs.writeFileSync(filePath, content);
          fixedFiles++;
        }
        
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
      }
    });
  });

  console.log(`\nProcessed ${totalFiles} story files, updated titles in ${fixedFiles} files.`);
}

// Run the fix
console.log('Updating story titles to atomic design structure...\n');
fixStoryTitles();