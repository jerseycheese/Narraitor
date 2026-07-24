// src/lib/promptTemplates/templates/__tests__/endingTemplates.closureRequirement.test.ts
//
// Template-level regression guard for #1578: the epilogue's closure
// requirement must apply to every tone, not just tragic. This can't assert
// on generated prose (that's how a test gets rigged) — it pins the template
// TEXT itself, so a future edit that re-scopes closure back to tragic-only
// fails loudly here instead of silently reintroducing cliffhangers.

import { endingTemplate } from '../endingTemplates';

describe('endingTemplates - epilogue closure requirement (#1578)', () => {
  const content = endingTemplate.content;

  it('states a closure requirement in the EPILOGUE block that is not gated by tone', () => {
    const epilogueBlockStart = content.indexOf('2. EPILOGUE');
    const tragicSubBlockStart = content.indexOf('For TRAGIC endings');
    expect(epilogueBlockStart).toBeGreaterThan(-1);
    expect(tragicSubBlockStart).toBeGreaterThan(epilogueBlockStart);

    const globalEpilogueInstructions = content.slice(epilogueBlockStart, tragicSubBlockStart);
    expect(globalEpilogueInstructions).toMatch(/REQUIRED FOR EVERY TONE/i);
    expect(globalEpilogueInstructions).toMatch(/MYSTERIOUS/);
  });

  it('does not ask the model to leave narrative room for imagination', () => {
    expect(content).not.toMatch(/leaving room for imagination/i);
  });

  it('does not tell MYSTERIOUS endings to leave the plot itself unresolved', () => {
    const mysteriousStart = content.indexOf('MYSTERIOUS:');
    const tragicStart = content.indexOf('TRAGIC:');
    expect(mysteriousStart).toBeGreaterThan(-1);
    expect(tragicStart).toBeGreaterThan(mysteriousStart);

    const mysteriousBlock = content.slice(mysteriousStart, tragicStart);
    expect(mysteriousBlock).not.toMatch(/the ending raises new questions/i);
  });
});
