import { worldDescriptionBlock } from '../worldDescriptionBlock';

describe('worldDescriptionBlock', () => {
  it('renders nothing when the description is absent', () => {
    expect(worldDescriptionBlock(undefined)).toBe('');
  });

  it('renders nothing when the description is blank', () => {
    expect(worldDescriptionBlock('   ')).toBe('');
  });

  it('renders the description under its header when present', () => {
    const block = worldDescriptionBlock('The council votes in six weeks.');
    expect(block).toContain(
      'WORLD DESCRIPTION (established at creation — the pressures this world was built around):'
    );
    expect(block).toContain('The council votes in six weeks.');
  });

  it('trims a long description at a word boundary with an ellipsis', () => {
    const long = 'A pressing deadline looms over the town. '.repeat(20).trim();
    const block = worldDescriptionBlock(long);
    expect(block).not.toContain(long);
    expect(block).toContain('...');
    expect(block.length).toBeLessThan(long.length);
  });
});
