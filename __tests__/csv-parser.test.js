import fs from 'fs';
import { parseCsvRows } from '../scripts/user-stories/modules/csv-parser';

describe('parseCsvRows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns parsed objects for valid CSV', () => {
    const csv = [
      'User Story Title Summary,User Story,Priority,Estimated Complexity,Acceptance Criteria,GitHub Issue Link,Related Issues/Stories,Technical Requirements,Implementation Considerations,Related Documentation,Plain Language Summary',
      '"Title1","As a user, I want to login","High","5","Should login successfully","http://github.com","ISSUE-1","TechReq","ImplConsider","docs/path","Summary1"'
    ].join('\n');
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(csv);
    const rows = parseCsvRows('dummy.csv');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      titleSummary: 'Title1',
      userStory: 'As a user, I want to login',
      priority: 'High',
      complexity: '5',
      acceptanceCriteriaRaw: 'Should login successfully',
      gitHubIssueLink: 'http://github.com',
      relatedIssues: 'ISSUE-1',
      technicalRequirements: 'TechReq',
      implementationConsiderations: 'ImplConsider',
      relatedDocumentation: 'docs/path',
      plainLanguageSummary: 'Summary1'
    });
  });

  it('returns empty array when file does not exist', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const rows = parseCsvRows('missing.csv');
    expect(rows).toEqual([]);
  });

  it('handles malformed CSV with inconsistent columns gracefully', () => {
    const csv = [
      'User Story Title Summary,User Story,Priority',
      '"OnlyTitle","OnlyStory"'
    ].join('\n');
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(csv);
    const rows = parseCsvRows('malformed.csv');
    expect(rows).toHaveLength(1);
    expect(rows[0].titleSummary).toBe('OnlyTitle');
    expect(rows[0].userStory).toBe('OnlyStory');
    expect(rows[0].priority).toBe(''); // missing value default ''
  });

  it('preserves literal \\n sequences in acceptanceCriteriaRaw and implementationConsiderations', () => {
    const csv = [
      'User Story Title Summary,User Story,Priority,Estimated Complexity,Acceptance Criteria,GitHub Issue Link,Related Issues/Stories,Technical Requirements,Implementation Considerations,Related Documentation,Plain Language Summary',
      '"Title2","Story2","Low","3","Criteria with \\n newline","link","","Tech \\n req","Impl \\n cons","","Summary2"'
    ].join('\n');
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(csv);
    const rows = parseCsvRows('newline.csv');
    expect(rows).toHaveLength(1);
    expect(rows[0].acceptanceCriteriaRaw).toContain('\\n');
    expect(rows[0].implementationConsiderations).toContain('\\n');
  });
});