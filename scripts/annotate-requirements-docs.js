import fs from 'fs/promises';
import path from 'path';
import { getStoryComplexityAndPriority } from './story-complexity-mapping.js';

const docsDir = path.resolve(process.cwd(), 'docs/requirements/core');

async function annotateFile(file) {
  const filePath = path.join(docsDir, file);
  let content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  let inSection = false;
  const resultLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Begin user stories section
    if (line.startsWith('## User Stories')) {
      inSection = true;
      resultLines.push(line);
      continue;
    }

    // End user stories when next heading appears
    if (inSection && line.startsWith('## ')) {
      inSection = false;
      resultLines.push(line);
      continue;
    }

    // Annotate stories in the user stories section
    if (
      inSection &&
      /^\s*-\s+As a (user|player|developer), I want/i.test(line)
    ) {
      // Strip any existing annotation before re-applying
      const rawLine = line.replace(/(\s*\([^)]*\))+$/,'').trim();
      const prefixMatch = rawLine.match(/^(\s*-\s+)/);
      const prefix = prefixMatch ? prefixMatch[1] : '';
      const rawStory = rawLine.replace(/^\s*-\s+/, '').trim();
      const domain = path.basename(file, '.md');
      const { complexity, priority } = getStoryComplexityAndPriority(rawStory, domain);
      const annotation = ` (Complexity: ${complexity}, Priority: ${priority})`;
      resultLines.push(prefix + rawStory + annotation);
    } else {
      resultLines.push(line);
    }
  }

  const newContent = resultLines.join('\n');
  await fs.writeFile(filePath, newContent, 'utf8');
  console.log(`Annotated ${file}`);
}

async function main() {
  const files = await fs.readdir(docsDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  for (const file of mdFiles) {
    await annotateFile(file);
  }
}

main().catch(console.error);