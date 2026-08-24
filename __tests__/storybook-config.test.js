import fs from 'fs';
import path from 'path';

import storybookConfig from '../.storybook/main.cjs';

const repoRoot = path.resolve(__dirname, '..');

describe('.storybook/main.cjs', () => {
  it('points nextConfigPath at a file that exists', () => {
    const nextConfigPath = storybookConfig.framework.options.nextConfigPath;
    expect(fs.existsSync(nextConfigPath)).toBe(true);
  });

  it('swaps the 11 MB Gemini tokenizer for the browser stub', async () => {
    const config = await storybookConfig.webpackFinal({ resolve: { alias: {} } });

    const stubPath = config.resolve.alias['@lenml/tokenizer-gemini'];
    expect(stubPath).toBe(
      path.join(repoRoot, 'src/lib/promptContext/geminiTokenizerBrowserStub.ts')
    );
    expect(fs.existsSync(stubPath)).toBe(true);
  });
});
