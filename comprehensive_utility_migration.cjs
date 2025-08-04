#!/usr/bin/env node

/**
 * Comprehensive utility migration script for PR #615
 * Applies ALL utility patterns across the entire codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript/JavaScript files to process
function getAllFiles() {
  try {
    const output = execSync(`find /Users/jackhaas/Projects/narraitor/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v __tests__ | grep -v .test. | grep -v .stories.`, { encoding: 'utf8' });
    return output.trim().split('\n').filter(line => line.length > 0);
  } catch (error) {
    console.error('Error finding files:', error);
    return [];
  }
}

// Comprehensive utility patterns
const comprehensivePatterns = [
  // Basic .trim() replacements
  {
    regex: /\.trim\(\)/g,
    replacement: (match, fullMatch, preceding) => {
      // Get the preceding part to determine what to wrap with safeTrim
      const beforeTrim = preceding.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*(?:\[[^\]]*\])?)\s*$/);
      if (beforeTrim) {
        return `safeTrim(${beforeTrim[1]})`;
      }
      return 'safeTrim(/* could not parse */)';
    },
    utilityNeeded: ['safeTrim'],
    isFunction: true
  },
  
  // Date formatting
  {
    regex: /new Date\(\)\.toISOString\(\)/g,
    replacement: 'formatDateTime(new Date())',
    utilityNeeded: ['formatDateTime']
  },
  
  {
    regex: /new Date\(\)\.toLocaleDateString\(\)/g,
    replacement: 'formatDate(new Date())',
    utilityNeeded: ['formatDate']
  },
  
  {
    regex: /\.toLocaleDateString\(\)/g,
    replacement: (match, fullMatch, preceding) => {
      const beforeMethod = preceding.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*(?:\[[^\]]*\])?)\s*$/);
      if (beforeMethod) {
        return `formatDate(${beforeMethod[1]})`;
      }
      return 'formatDate(/* could not parse */)';
    },
    utilityNeeded: ['formatDate'],
    isFunction: true
  },
  
  // Optional chaining patterns
  {
    regex: /([a-zA-Z_$][\w$]*)\?\.[a-zA-Z_$][\w$]*\?\.[a-zA-Z_$][\w$]*/g,
    replacement: (match) => {
      const parts = match.split('?.');
      const baseName = parts[0];
      const path = parts.slice(1).join('.');
      return `getNestedValue(${baseName}, '${path}')`;
    },
    utilityNeeded: ['getNestedValue'],
    isFunction: true
  },
  
  // Simple property chains
  {
    regex: /([a-zA-Z_$][\w$]*)\.([a-zA-Z_$][\w$]*)\.([a-zA-Z_$][\w$]*)/g,
    replacement: (match, obj, prop1, prop2) => {
      // Skip if this is already a utility call
      if (obj === 'getNestedValue' || obj === 'hasNestedProperty') return match;
      return `getNestedValue(${obj}, '${prop1}.${prop2}')`;
    },
    utilityNeeded: ['getNestedValue'],
    isFunction: true
  },
  
  // Manual truncation
  {
    regex: /([a-zA-Z_$][\w$]*)\.substring\(0,\s*(\d+)\)\s*\+\s*["'`]\.\.\.["'`]/g,
    replacement: (match, str, length) => `truncate(${str}, ${length})`,
    utilityNeeded: ['truncate'],
    isFunction: true
  },
  
  // Capitalization
  {
    regex: /([a-zA-Z_$][\w$]*)\.charAt\(0\)\.toUpperCase\(\)\s*\+\s*\1\.slice\(1\)\.toLowerCase\(\)/g,
    replacement: (match, str) => `capitalize(${str})`,
    utilityNeeded: ['capitalize'],
    isFunction: true
  }
];

function processFileContent(content, filePath) {
  let modifiedContent = content;
  const utilitiesNeeded = new Set();
  let changesMade = false;

  // Apply patterns with custom functions
  comprehensivePatterns.forEach(pattern => {
    if (pattern.isFunction) {
      // Handle function-based replacements
      let matches;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      
      while ((matches = regex.exec(modifiedContent)) !== null) {
        const fullMatch = matches[0];
        const preceding = modifiedContent.substring(0, matches.index);
        
        try {
          let replacement;
          if (typeof pattern.replacement === 'function') {
            replacement = pattern.replacement(fullMatch, matches, preceding);
          } else {
            replacement = pattern.replacement;
          }
          
          if (replacement !== fullMatch) {
            modifiedContent = modifiedContent.substring(0, matches.index) + 
                            replacement + 
                            modifiedContent.substring(matches.index + fullMatch.length);
            
            pattern.utilityNeeded.forEach(util => utilitiesNeeded.add(util));
            changesMade = true;
            
            // Reset regex to continue from beginning due to content change
            regex.lastIndex = 0;
          }
        } catch (error) {
          console.warn(`Pattern replacement error in ${filePath}:`, error);
        }
      }
    } else {
      // Handle simple string replacements
      const originalContent = modifiedContent;
      modifiedContent = modifiedContent.replace(pattern.regex, pattern.replacement);
      
      if (modifiedContent !== originalContent) {
        pattern.utilityNeeded.forEach(util => utilitiesNeeded.add(util));
        changesMade = true;
      }
    }
  });

  return { content: modifiedContent, utilitiesNeeded, changesMade };
}

function updateImports(content, utilitiesNeeded, filePath) {
  if (utilitiesNeeded.size === 0) return content;

  // Check if utils import already exists
  const utilsImportRegex = /import\s*\{\s*([^}]*)\s*\}\s*from\s*['"`]@\/lib\/utils['"`];?/;
  const existingImport = content.match(utilsImportRegex);

  if (existingImport) {
    // Parse existing imports
    const existingImports = existingImport[1]
      .split(',')
      .map(imp => imp.trim())
      .filter(imp => imp.length > 0);

    // Merge with new utilities
    const allUtilities = [...new Set([...existingImports, ...utilitiesNeeded])];
    const newImportLine = `import { ${allUtilities.join(', ')} } from '@/lib/utils';`;
    
    return content.replace(utilsImportRegex, newImportLine);
  } else {
    // Add new import line
    const utilityList = Array.from(utilitiesNeeded).join(', ');
    const newImport = `import { ${utilityList} } from '@/lib/utils';`;
    
    // Find the best place to insert
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Skip initial comments and directives
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*') && !line.startsWith("'use")) {
        // Find the last import line
        if (line.startsWith('import')) {
          insertIndex = i + 1;
        } else {
          break;
        }
      }
    }
    
    lines.splice(insertIndex, 0, newImport);
    return lines.join('\n');
  }
}

function processFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const result = processFileContent(content, filePath);
    
    if (result.changesMade) {
      const finalContent = updateImports(result.content, result.utilitiesNeeded, filePath);
      fs.writeFileSync(filePath, finalContent, 'utf8');
      
      const shortPath = filePath.replace('/Users/jackhaas/Projects/narraitor/', '');
      console.log(`✅ Updated: ${shortPath} (${Array.from(result.utilitiesNeeded).join(', ')})`);
      return true;
    } else {
      const shortPath = filePath.replace('/Users/jackhaas/Projects/narraitor/', '');
      console.log(`⚪ No changes: ${shortPath}`);
      return false;
    }
  } catch (error) {
    const shortPath = filePath.replace('/Users/jackhaas/Projects/narraitor/', '');
    console.error(`❌ Error processing ${shortPath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🚀 Starting comprehensive utility migration...\n');

const allFiles = getAllFiles();
console.log(`📁 Found ${allFiles.length} files to process\n`);

let processedCount = 0;
let updatedCount = 0;

allFiles.forEach(filePath => {
  processedCount++;
  if (processFile(filePath)) {
    updatedCount++;
  }
});

console.log(`\n📊 Summary: ${updatedCount}/${processedCount} files updated`);
console.log('✨ Comprehensive utility migration complete!');

// Clean up temporary files
try {
  fs.unlinkSync('/Users/jackhaas/Projects/narraitor/batch_apply_utilities.cjs');
  console.log('🧹 Cleaned up temporary files');
} catch (error) {
  // Ignore cleanup errors
}