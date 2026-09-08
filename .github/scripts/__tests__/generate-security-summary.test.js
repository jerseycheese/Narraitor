/**
 * @jest-environment node
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  formatProductionAudit,
  formatFullAudit,
  formatOutdated,
  buildSummaryMarkdown,
  generateSecuritySummary,
} from '../generate-security-summary.js';

describe('generate-security-summary', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-security-test-'));
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('formatProductionAudit', () => {
    it('formats a clean production audit with passed status and zero counts', () => {
      const prodAudit = {
        metadata: {
          vulnerabilities: {
            info: 0,
            low: 0,
            moderate: 0,
            high: 0,
            critical: 0,
            total: 0,
          },
        },
        vulnerabilities: {},
      };

      const lines = formatProductionAudit(prodAudit);
      expect(lines).toContain('## Production Dependencies Audit (Blocking Gate)');
      expect(lines).toContain('Status: Passed (0 vulnerabilities detected)');
      expect(lines).toContain('- Critical: 0');
      expect(lines).toContain('- High: 0');
      expect(lines).toContain('- Moderate: 0');
      expect(lines).toContain('- Low: 0');
      expect(lines.join('\n')).not.toContain('Packages requiring attention');
    });

    it('formats an audit report with vulnerabilities requiring action', () => {
      const prodAudit = {
        metadata: {
          vulnerabilities: {
            critical: 1,
            high: 2,
            moderate: 0,
            low: 0,
          },
        },
        vulnerabilities: {
          foo: {
            severity: 'critical',
            via: [{ title: 'Remote Code Execution' }],
          },
        },
      };

      const lines = formatProductionAudit(prodAudit);
      expect(lines).toContain('## Production Dependencies Audit (Blocking Gate)');
      expect(lines).toContain('Status: Action required (3 total vulnerabilities detected)');
      expect(lines).toContain('- Critical: 1');
      expect(lines).toContain('- High: 2');
      expect(lines).toContain('- Moderate: 0');
      expect(lines).toContain('- Low: 0');
      expect(lines).toContain('- foo (critical) - Remote Code Execution');
    });

    it('handles missing audit data gracefully', () => {
      const lines = formatProductionAudit(null);
      expect(lines).toContain('## Production Dependencies Audit (Blocking Gate)');
      expect(lines).toContain('*No production audit report generated.*');
    });
  });

  describe('formatFullAudit', () => {
    it('formats advisory full dependency audit with totals, severity breakdown, and package list', () => {
      const fullAudit = {
        metadata: {
          vulnerabilities: {
            critical: 3,
            high: 14,
            moderate: 6,
            low: 11,
          },
        },
        vulnerabilities: {
          'form-data': {
            severity: 'critical',
            via: [{ title: 'unsafe form data parsing' }],
          },
          yaml: {
            severity: 'moderate',
            via: [{ title: 'Stack Overflow' }],
          },
        },
      };

      const lines = formatFullAudit(fullAudit);
      expect(lines).toContain('## Full Dependency Audit (Dev & Tooling - Advisory / Non-blocking)');
      expect(lines).toContain('Detected 34 total vulnerabilities across severity levels.');
      expect(lines).toContain('- Critical: 3');
      expect(lines).toContain('- High: 14');
      expect(lines).toContain('- Moderate: 6');
      expect(lines).toContain('- Low: 11');
      expect(lines).toContain('Packages requiring attention (up to 5):');
      expect(lines).toContain('- form-data (critical) - unsafe form data parsing');
      expect(lines).toContain('- yaml (moderate) - Stack Overflow');
    });

    it('formats a clean full dependency audit when zero vulnerabilities exist', () => {
      const fullAudit = {
        metadata: {
          vulnerabilities: {
            critical: 0,
            high: 0,
            moderate: 0,
            low: 0,
          },
        },
        vulnerabilities: {},
      };

      const lines = formatFullAudit(fullAudit);
      expect(lines).toContain('## Full Dependency Audit (Dev & Tooling - Advisory / Non-blocking)');
      expect(lines).toContain('No vulnerabilities detected.');
      expect(lines.join('\n')).not.toContain('Packages requiring attention');
    });

    it('handles missing full audit data gracefully', () => {
      const lines = formatFullAudit(null);
      expect(lines).toContain('## Full Dependency Audit (Dev & Tooling - Advisory / Non-blocking)');
      expect(lines).toContain('*No full dependency audit report generated.*');
    });
  });

  describe('formatOutdated', () => {
    it('formats outdated dependencies list', () => {
      const outdated = {
        next: {
          current: '15.5.0',
          wanted: '15.5.25',
          latest: '16.0.0',
          type: 'dependencies',
        },
      };

      const lines = formatOutdated(outdated);
      expect(lines).toContain('## Outdated dependencies (1)');
      expect(lines).toContain('- next (dependencies) - current: 15.5.0, wanted: 15.5.25, latest: 16.0.0');
    });

    it('handles empty outdated dependencies', () => {
      const lines = formatOutdated({});
      expect(lines).toContain('## Outdated dependencies');
      expect(lines).toContain('No outdated packages detected.');
    });
  });

  describe('buildSummaryMarkdown', () => {
    it('assembles a full summary document with timestamp and artifacts footer', () => {
      const markdown = buildSummaryMarkdown({
        prodAudit: null,
        fullAudit: null,
        outdatedData: null,
        timestamp: '2026-09-08T12:00:00.000Z',
      });

      expect(markdown).toContain('# CI Security Scan Summary');
      expect(markdown).toContain('Generated: 2026-09-08T12:00:00.000Z');
      expect(markdown).toContain('## Production Dependencies Audit (Blocking Gate)');
      expect(markdown).toContain('## Full Dependency Audit (Dev & Tooling - Advisory / Non-blocking)');
      expect(markdown).toContain('## Outdated dependencies');
      expect(markdown).toContain('Reports are attached as workflow artifacts.');
    });
  });

  describe('generateSecuritySummary', () => {
    it('reads audit JSON files from directory and outputs summary.md with both audit sections', () => {
      const prodAudit = {
        metadata: {
          vulnerabilities: {
            critical: 0,
            high: 0,
            moderate: 0,
            low: 0,
          },
        },
        vulnerabilities: {},
      };
      const fullAudit = {
        metadata: {
          vulnerabilities: {
            critical: 3,
            high: 14,
            moderate: 6,
            low: 11,
          },
        },
        vulnerabilities: {
          'form-data': {
            severity: 'critical',
            via: [{ title: 'unsafe form data' }],
          },
        },
      };
      const outdated = {
        next: {
          current: '15.5.0',
          wanted: '15.5.25',
          latest: '16.0.0',
          type: 'dependencies',
        },
      };

      fs.writeFileSync(path.join(tempDir, 'npm-audit.json'), JSON.stringify(prodAudit));
      fs.writeFileSync(path.join(tempDir, 'npm-audit-full.json'), JSON.stringify(fullAudit));
      fs.writeFileSync(path.join(tempDir, 'npm-outdated.json'), JSON.stringify(outdated));

      const summaryPath = generateSecuritySummary(tempDir);
      expect(fs.existsSync(summaryPath)).toBe(true);

      const summaryContent = fs.readFileSync(summaryPath, 'utf8');

      // Check production section
      expect(summaryContent).toContain('## Production Dependencies Audit (Blocking Gate)');
      expect(summaryContent).toContain('Status: Passed (0 vulnerabilities detected)');

      // Check full dependency advisory section
      expect(summaryContent).toContain('## Full Dependency Audit (Dev & Tooling - Advisory / Non-blocking)');
      expect(summaryContent).toContain('Detected 34 total vulnerabilities across severity levels.');
      expect(summaryContent).toContain('- form-data (critical) - unsafe form data');

      // Check outdated section
      expect(summaryContent).toContain('## Outdated dependencies (1)');
      expect(summaryContent).toContain('- next (dependencies) - current: 15.5.0, wanted: 15.5.25, latest: 16.0.0');
      expect(summaryContent).toContain('Reports are attached as workflow artifacts.');
    });

    it('handles missing input files without throwing and writes fallback summary', () => {
      const summaryPath = generateSecuritySummary(tempDir);
      expect(fs.existsSync(summaryPath)).toBe(true);

      const summaryContent = fs.readFileSync(summaryPath, 'utf8');
      expect(summaryContent).toContain('*No production audit report generated.*');
      expect(summaryContent).toContain('*No full dependency audit report generated.*');
      expect(summaryContent).toContain('No outdated packages detected.');
    });
  });
});
