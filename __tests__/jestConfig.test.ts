import jestConfig from '../jest.config.cjs';

describe('jest.config.cjs', () => {
  it('ignores .claude worktrees in testPathIgnorePatterns', () => {
    expect(jestConfig.testPathIgnorePatterns).toContain('<rootDir>/.claude/worktrees/');
  });

  it('ignores .claude worktrees in modulePathIgnorePatterns', () => {
    expect(jestConfig.modulePathIgnorePatterns).toContain('<rootDir>/.claude/worktrees/');
  });
});
