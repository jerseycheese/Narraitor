import { fromPreTrained as fromPreTrainedBrowser } from '../geminiTokenizerBrowserStub';
import { fromPreTrained } from '@lenml/tokenizer-gemini';

/**
 * The stub only ever runs behind the client-side webpack alias, so nothing else
 * exercises it. What matters is that it stays a safe stand-in: same call shape
 * as the real package, and an estimate that runs high, since `applyBudget`
 * truncates against whatever number it gets.
 */
const countBrowser = (text: string) =>
  fromPreTrainedBrowser().encode(text, { add_special_tokens: false }).length;

const countExact = (text: string) =>
  fromPreTrained().encode(text, { add_special_tokens: false }).length;

const NARRATIVE_SAMPLES = [
  'The bandit captain blocks the road and asks for a toll.',
  'You are traveling through a dark forest when a group of armed bandits steps out from behind the trees, weapons drawn.',
  'Location: Forest Path\nSituation: A group of bandits blocks your path\n',
];

describe('geminiTokenizerBrowserStub', () => {
  it('returns 0 for empty text', () => {
    expect(countBrowser('')).toBe(0);
  });

  it('never undercounts narrative prose against the real tokenizer', () => {
    NARRATIVE_SAMPLES.forEach((sample) => {
      expect(countBrowser(sample)).toBeGreaterThanOrEqual(countExact(sample));
    });
  });
});
