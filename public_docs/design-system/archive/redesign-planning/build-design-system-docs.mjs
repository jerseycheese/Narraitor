import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archived 2026-07-15: this prototype predates DS3 and is no longer published.
// Storybook's src/stories/00-foundation/DesignSystemShowcase.stories.tsx is the
// live, canon design-system reference now (ADR-012). Kept here, inert, for
// historical reference only — this script intentionally no longer writes to
// public/, so running it can't silently republish a stale page.
const baseDir = __dirname;
const sourceDir = path.join(baseDir, 'src');
const outputFile = path.join(baseDir, 'design-system.html');

const staticSources = {
  '{{INLINE_CSS}}': path.join(sourceDir, 'styles.css'),
  '{{GAME_SESSION_SECTION}}': path.join(sourceDir, 'sections', 'game-session-compositions.html'),
  '{{INLINE_JS}}': path.join(sourceDir, 'scripts', 'design-system.js'),
};

const templatePath = path.join(sourceDir, 'template.html');
const contentTopFilePath = path.join(sourceDir, 'content-top.html');
const contentTopDirPath = path.join(sourceDir, 'content-top');
const contentBottomFilePath = path.join(sourceDir, 'content-bottom.html');
const contentBottomDirPath = path.join(sourceDir, 'content-bottom');

async function readRequiredFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Missing required file: ${filePath}\n${error.message}`);
  }
}

async function buildDesignSystemDoc() {
  const template = await readRequiredFile(templatePath);
  let output = template;

  for (const [placeholder, filePath] of Object.entries(staticSources)) {
    const content = await readRequiredFile(filePath);
    if (!output.includes(placeholder)) {
      throw new Error(`Template is missing placeholder: ${placeholder}`);
    }
    output = output.replace(placeholder, content);
  }

  const contentTop = await readCompositeContent(contentTopDirPath, contentTopFilePath);
  const contentBottom = await readCompositeContent(contentBottomDirPath, contentBottomFilePath);

  if (!output.includes('{{CONTENT_TOP}}')) {
    throw new Error('Template is missing placeholder: {{CONTENT_TOP}}');
  }
  if (!output.includes('{{CONTENT_BOTTOM}}')) {
    throw new Error('Template is missing placeholder: {{CONTENT_BOTTOM}}');
  }

  output = output.replace('{{CONTENT_TOP}}', contentTop);
  output = output.replace('{{CONTENT_BOTTOM}}', contentBottom);

  await fs.writeFile(outputFile, output, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Built ${outputFile}`);
}

async function readCompositeContent(dirPath, fallbackFilePath) {
  const directoryContent = await readHtmlDirectory(dirPath);
  if (directoryContent !== null) {
    return directoryContent;
  }
  return readRequiredFile(fallbackFilePath);
}

async function readHtmlDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));

    if (files.length === 0) {
      return null;
    }

    const parts = await Promise.all(
      files.map((name) => fs.readFile(path.join(dirPath, name), 'utf8')),
    );
    return parts.join('\n');
  } catch {
    return null;
  }
}

buildDesignSystemDoc().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error.message);
  process.exit(1);
});
