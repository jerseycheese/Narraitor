#!/usr/bin/env node

/**
 * Batch utility application script for PR #615
 * Applies formatting and object access utilities systematically across the codebase
 */

const fs = require('fs');
const path = require('path');

// Utility patterns to replace
const patterns = [
  // .trim() replacements
  {
    regex: /(?<![\w])([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*|[a-zA-Z_$][\w$]*(?:\[[^\]]+\]))\.trim\(\)/g,
    replacement: 'safeTrim($1)',
    utilityNeeded: 'safeTrim'
  },
  
  // Simple nested property access
  {
    regex: /([a-zA-Z_$][\w$]*)\.([a-zA-Z_$][\w$]*)\.([a-zA-Z_$][\w$]*)/g,
    replacement: "getNestedValue($1, '$2.$3')",
    utilityNeeded: 'getNestedValue'
  },
  
  // Optional chaining to getNestedValue
  {
    regex: /([a-zA-Z_$][\w$]*)\?\.([a-zA-Z_$][\w$]*)\?\.([a-zA-Z_$][\w$]*)/g,
    replacement: "getNestedValue($1, '$2.$3')",
    utilityNeeded: 'getNestedValue'
  },
  
  // Array access patterns
  {
    regex: /([a-zA-Z_$][\w$]*)\[(\d+)\]\.([a-zA-Z_$][\w$]*)/g,
    replacement: "getNestedValue($1, '[$2].$3')",
    utilityNeeded: 'getNestedValue'
  },
  
  // Date formatting patterns
  {
    regex: /new Date\(\)\.toISOString\(\)/g,
    replacement: 'formatDateTime(new Date())',
    utilityNeeded: 'formatDateTime'
  },
  
  {
    regex: /new Date\(\)\.toLocaleDateString\(\)/g,
    replacement: 'formatDate(new Date())',
    utilityNeeded: 'formatDate'
  },
  
  // Manual truncation patterns
  {
    regex: /([a-zA-Z_$][\w$]*)\.substring\(0,\s*(\d+)\)\s*\+\s*["'`]\.\.\.["'`]/g,
    replacement: 'truncate($1, $2)',
    utilityNeeded: 'truncate'
  },
  
  // Capitalization patterns
  {
    regex: /([a-zA-Z_$][\w$]*)\.charAt\(0\)\.toUpperCase\(\)\s*\+\s*\1\.slice\(1\)\.toLowerCase\(\)/g,
    replacement: 'capitalize($1)',
    utilityNeeded: 'capitalize'
  }
];

// Files to process (from our search results)
const filesToProcess = [
  'src/components/CharacterCard/CharacterCard.tsx',
  'src/components/WorldCard/WorldCard.tsx',
  'src/components/Narrative/NarrativeController.tsx',
  'src/components/GameSession/ActiveGameSession.tsx',
  'src/lib/ai/choiceGenerator.ts',
  'src/lib/ai/portraitGenerator.ts',
  'src/lib/ai/goalExtractor.ts',
  'src/lib/ai/narrativeGenerator.ts',
  'src/state/narrativeStore.ts',
  'src/state/journalStore.ts',
  'src/state/worldStore.ts',
  'src/state/characterStore.ts',
  'src/components/world/SkillEditor/SkillEditor.tsx',
  'src/components/world/AttributeEditor/AttributeEditor.tsx',
  'src/components/shared/ChoiceSelector/ChoiceSelector.tsx',
  'src/components/GenerateCharacterDialog/GenerateCharacterDialog.tsx',
  'src/components/GameSession/EndingScreen.tsx',
  'src/components/StoryEndingDialog/StoryEndingDialog.tsx',
  'src/components/Narrative/NarrativeDisplay.tsx',
  'src/app/api/generate-character/route.ts',
  'src/app/api/generate-world/route.ts',
  'src/app/api/narrative/generate/route.ts',
  'src/app/api/ai/generate-template/route.ts',
  'src/app/api/ai/detect-skills/route.ts',
  'src/app/api/ai/analyze-world/route.ts'
];

function processFile(filePath) {
  try {
    const fullPath = path.join('/Users/jackhaas/Projects/narraitor', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    const utilitiesNeeded = new Set();
    let changesMade = false;

    // Apply each pattern
    patterns.forEach(pattern => {
      const matches = content.match(pattern.regex);
      if (matches && matches.length > 0) {
        content = content.replace(pattern.regex, pattern.replacement);
        utilitiesNeeded.add(pattern.utilityNeeded);
        changesMade = true;
      }
    });

    if (changesMade) {
      // Check if imports need to be updated
      const importLine = content.match(/import\s+\{[^}]*\}\s+from\s+['"`]@\/lib\/utils['"`];?/);
      
      if (importLine) {
        // Extract existing imports
        const existingImports = importLine[0].match(/\{([^}]*)\}/)[1]
          .split(',')
          .map(imp => imp.trim())
          .filter(imp => imp.length > 0);
        
        // Add new utilities
        const allImports = [...new Set([...existingImports, ...utilitiesNeeded])];
        const newImportLine = `import { ${allImports.join(', ')} } from '@/lib/utils';`;
        
        content = content.replace(importLine[0], newImportLine);
      } else {
        // Add new import line
        const utilityImports = Array.from(utilitiesNeeded).join(', ');
        const importToAdd = `import { ${utilityImports} } from '@/lib/utils';\n`;
        
        // Find the best place to insert the import
        const importRegex = /^import\s+.*from\s+['"`][^'"`]*['"`];?$/gm;
        const imports = content.match(importRegex);
        
        if (imports && imports.length > 0) {
          const lastImport = imports[imports.length - 1];
          const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
          content = content.slice(0, lastImportIndex) + '\n' + importToAdd + content.slice(lastImportIndex);
        } else {
          // Insert at the top after any leading comments/directives
          const firstLineWithContent = content.split('\n').findIndex(line => 
            line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('/*') && !line.trim().startsWith('*')
          );
          const lines = content.split('\n');
          lines.splice(firstLineWithContent, 0, importToAdd.trim());
          content = lines.join('\n');
        }
      }

      // Write the file back
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated: ${filePath} (${Array.from(utilitiesNeeded).join(', ')})`);
      return true;
    } else {
      console.log(`⚪ No changes: ${filePath}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all files
console.log('🚀 Starting batch utility application...\n');

let processedCount = 0;
let updatedCount = 0;

filesToProcess.forEach(filePath => {
  processedCount++;
  if (processFile(filePath)) {
    updatedCount++;
  }
});

console.log(`\n📊 Summary: ${updatedCount}/${processedCount} files updated`);
console.log('✨ Batch utility application complete!');