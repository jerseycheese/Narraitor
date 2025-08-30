#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Mapping of incorrect import paths to correct ones
const importFixes = {
  // UI components
  '@/components/ui/EmptyState': '@/components/ui/EmptyState/EmptyState',
  '@/components/ui/FloatingActionButton': '@/components/ui/FloatingActionButton/FloatingActionButton',
  
  // Shared components  
  '@/components/ActiveStateCard': '@/components/shared/cards/ActiveStateCard',
  '@/components/CardActionGroup': '@/components/shared/cards/CardActionGroup',
  '@/components/CustomActionProcessor': '@/components/shared/CustomActionProcessor/CustomActionProcessor',
  '@/components/DataField': '@/components/shared/DataField/DataField',
  '@/components/LoadingOverlay': '@/components/shared/LoadingOverlay',
  '@/components/NavigationPersistenceProvider': '@/components/shared/NavigationPersistenceProvider',
  '@/components/PointPoolManager': '@/components/shared/PointPoolManager/PointPoolManager',
  '@/components/TemplateSelector': '@/components/world/TemplateSelector/TemplateSelector',
  '@/components/WorldCardActions': '@/components/WorldCardActions/WorldCardActions',
  
  // Form components
  '@/components/ToneSettingsForm': '@/components/forms/ToneSettingsForm',
  '@/components/components/forms/WorldAttributesForm': '@/components/forms/WorldAttributesForm',
  '@/components/components/forms/WorldBasicInfoForm': '@/components/forms/WorldBasicInfoForm', 
  '@/components/components/forms/WorldSettingsForm': '@/components/forms/WorldSettingsForm',
  '@/components/components/forms/WorldSkillsForm': '@/components/forms/WorldSkillsForm',
  
  // Devtools components
  '@/components/AITestingPanel': '@/components/devtools/AITestingPanel/AITestingPanel',
  '@/components/ErrorSection': '@/components/devtools/ErrorSection/ErrorSection',
  
  // Character components
  '@/components/CharacterDetailsDisplay': '@/components/characters/CharacterDetailsDisplay',
  '@/components/CharacterHeader': '@/components/characters/CharacterHeader',
  '@/components/CharacterSummary': '@/components/GameSession/CharacterSummary',
  
  // Game components
  '@/components/ChoiceSelector': '@/components/shared/ChoiceSelector/ChoiceSelector',
  '@/components/JournalFloatingButton': '@/components/GameSession/JournalFloatingButton',
  '@/components/JournalModal': '@/components/GameSession/JournalModal',
  
  // Navigation components
  '@/components/MobileNavigationMenu': '@/components/Navigation/MobileNavigationMenu',
  
  // Narrative components
  '@/components/NarrativeHistory': '@/components/Narrative/NarrativeHistory',
  '@/components/NarrativeController': '@/components/Narrative/NarrativeController',
  '@/components/NarrativeDisplay': '@/components/Narrative/NarrativeDisplay',
  
  // World components
  '@/components/AttributeEditor': '@/components/world/AttributeEditor/AttributeEditor',
  
  // Store imports
  '@/components/state/characterStore': '@/state/characterStore',
  '@/components/state/worldStore': '@/state/worldStore',
  '@/components/state/journalStore': '@/state/journalStore',
  '@/components/state/navigationStore': '@/state/navigationStore',
  
  // Type imports
  '@/components/types/tone-settings.types': '@/types/tone-settings.types',
  '@/components/types/runtime-error.types': '@/types/runtime-error.types',
  '@/components/types/journal.types': '@/types/journal.types',
  
  // Lib imports
  '@/components/lib/constants/skillDifficultyLevels': '@/lib/constants/skillDifficultyLevels',
  '@/components/lib/constants/skillLevelDescriptions': '@/lib/constants/skillLevelDescriptions',
  '@/components/lib/devtools/runtimeErrorLogger': '@/lib/devtools/runtimeErrorLogger',
  
  // UI component fixes
  '@/components/components/ui/LoadingState': '@/components/ui/LoadingState/LoadingState',
  '@/components/components/ui/ErrorDisplay': '@/components/ui/ErrorDisplay/ErrorDisplay',
  
  // Additional missing imports from build errors
  '@/components/state/sessionStore': '@/state/sessionStore',
  '@/components/state/narrativeStore': '@/state/narrativeStore',
  '@/components/EndingScreen': '@/components/GameSession/EndingScreen',
  '@/components/GameSessionError': '@/components/GameSession/GameSessionError', 
  '@/components/GameSessionLoading': '@/components/GameSession/GameSessionLoading',
  '@/components/QuickPlay.stories.helpers': '@/components/QuickPlay/QuickPlay.stories.helpers',
  '@/components/app/settings/page': '@/app/settings/page',
  '@/components/ActiveGameSession': '@/components/GameSession/ActiveGameSession',
  '@/components/WorldListScreen': '@/components/world/WorldListScreen',
  '@/components/SkillsStep': '@/components/CharacterCreationWizard/SkillsStep',
  '@/components/components/shared/wizard': '@/components/shared/wizard',
  '@/components/ImageGenerationStep': '@/components/WorldCreationWizard/steps/ImageGenerationStep',
  '@/components/PageLayout': '@/components/shared/PageLayout',
  '@/components/PortraitStep': '@/components/CharacterCreationWizard/steps/PortraitStep',
  '@/components/GameStartWizard.stories.helpers': '@/components/GameStartWizard/GameStartWizard.stories.helpers',
  '@/components/AISuggestions': '@/components/WorldCreationWizard/AISuggestions',
  '@/components/AttributesStep': '@/components/CharacterCreationWizard/steps/AttributesStep',
  '@/components/BackgroundStep': '@/components/CharacterCreationWizard/steps/BackgroundStep',
  '@/components/BasicInfoStep': '@/components/CharacterCreationWizard/steps/BasicInfoStep',
  '@/components/CharacterCreationWizard/SkillsStep': '@/components/CharacterCreationWizard/steps/SkillsStep',
  '@/components/world/WorldListScreen': '@/components/WorldListScreen/WorldListScreen',
  '@/components/WorldList': '@/components/WorldList/WorldList',
  '@/components/WorldAttributesList': '@/components/world/WorldAttributesList',
  '@/components/WorldDetailsDisplay': '@/components/world/WorldDetailsDisplay',
  '@/components/WorldInfoSection': '@/components/world/WorldInfoSection',
  '@/components/WorldSettingsDisplay': '@/components/world/WorldSettingsDisplay',
  '@/components/WorldSkillsList': '@/components/world/WorldSkillsList',
  '@/components/QuickStartCharacters': '@/components/QuickStartCharacters/QuickStartCharacters',
  '@/components/RecentPagesDropdown': '@/components/Navigation/RecentPagesDropdown',
  '@/components/SessionControls': '@/components/GameSession/SessionControls',
  '@/components/SkillEditor': '@/components/world/SkillEditor/SkillEditor',
  
  // Fix relative imports
  '../CollapsibleSection': '@/components/devtools/CollapsibleSection/CollapsibleSection',
  '../JsonViewer': '@/components/devtools/JsonViewer/JsonViewer',
  
  // Fix final import
  '@/components/components/shared/NavigationLoadingProvider': '@/components/shared/NavigationLoadingProvider',
};

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Fix each import path
    for (const [wrong, correct] of Object.entries(importFixes)) {
      const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(wrong)) {
        content = content.replace(regex, correct);
        changed = true;
        console.log(`Fixed in ${filePath}: ${wrong} -> ${correct}`);
      }
    }
    
    // Fix relative imports that shouldn't be relative
    const relativeImportRegex = /from '\.\.\/(DevToolsContext)'/g;
    const relativeMatch = content.match(relativeImportRegex);
    if (relativeMatch) {
      content = content.replace(relativeImportRegex, "from '@/components/devtools/DevToolsContext'");
      changed = true;
      console.log(`Fixed relative import in ${filePath}`);
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content);
    }
    
    return changed;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all story files
function fixAllStoryImports() {
  const storyDirs = [
    'src/stories/01-atoms',
    'src/stories/02-molecules', 
    'src/stories/03-organisms',
    'src/stories/04-templates',
    'src/stories/05-pages',
    'src/stories/06-patterns'
  ];
  
  let totalFiles = 0;
  let fixedFiles = 0;
  
  storyDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir).filter(file => file.endsWith('.stories.tsx'));
    files.forEach(file => {
      const filePath = path.join(dir, file);
      totalFiles++;
      if (fixImportsInFile(filePath)) {
        fixedFiles++;
      }
    });
  });
  
  console.log(`\nProcessed ${totalFiles} story files, fixed imports in ${fixedFiles} files.`);
}

// Run the fix
console.log('Fixing import paths in story files...\n');
fixAllStoryImports();