import fs from 'node:fs';
import path from 'node:path';

// Generates a human-readable summary for the CI security scan artifacts.
// The script is invoked from the security workflow and operates on the
// directory provided via argv[2] (defaults to "ci-security").

export const SEVERITIES = ['critical', 'high', 'moderate', 'low'];

export function formatPackageList(vulnerabilities = {}) {
  const entries = Object.entries(vulnerabilities);
  if (!entries.length) return [];

  const lines = ['', 'Packages requiring attention (up to 5):'];
  entries.slice(0, 5).forEach(([pkg, details]) => {
    const severity = details?.severity ?? 'unknown';
    const via = Array.isArray(details?.via)
      ? details.via
          .filter((item) => typeof item === 'object' && item?.title)
          .map((item) => item.title)
      : [];
    const viaLabel = via.length ? ` - ${via.slice(0, 2).join('; ')}` : '';
    lines.push(`- ${pkg} (${severity})${viaLabel}`);
  });
  return lines;
}

export function formatProductionAudit(auditData) {
  const lines = ['## Production Dependencies Audit (Blocking Gate)'];
  if (!auditData?.metadata?.vulnerabilities) {
    lines.push('*No production audit report generated.*');
    return lines;
  }

  const counts = auditData.metadata.vulnerabilities;
  const total = SEVERITIES.reduce((acc, level) => acc + (counts[level] ?? 0), 0);
  const status = total === 0 ? 'Passed (0 vulnerabilities detected)' : `Action required (${total} total vulnerabilities detected)`;

  lines.push(`Status: ${status}`);
  SEVERITIES.forEach((level) => {
    const label = level.charAt(0).toUpperCase() + level.slice(1);
    lines.push(`- ${label}: ${counts[level] ?? 0}`);
  });

  const packageLines = formatPackageList(auditData.vulnerabilities);
  if (packageLines.length) {
    lines.push(...packageLines);
  }

  return lines;
}

export function formatFullAudit(auditData) {
  const lines = ['## Full Dependency Audit (Dev & Tooling - Advisory / Non-blocking)'];
  if (!auditData?.metadata?.vulnerabilities) {
    lines.push('*No full dependency audit report generated.*');
    return lines;
  }

  const counts = auditData.metadata.vulnerabilities;
  const total = SEVERITIES.reduce((acc, level) => acc + (counts[level] ?? 0), 0);

  lines.push(
    total
      ? `Detected ${total} total vulnerabilities across severity levels.`
      : 'No vulnerabilities detected.'
  );

  SEVERITIES.forEach((level) => {
    const label = level.charAt(0).toUpperCase() + level.slice(1);
    lines.push(`- ${label}: ${counts[level] ?? 0}`);
  });

  const packageLines = formatPackageList(auditData.vulnerabilities);
  if (packageLines.length) {
    lines.push(...packageLines);
  }

  return lines;
}

export function formatOutdated(outdatedData) {
  const lines = [];
  if (outdatedData && Object.keys(outdatedData).length) {
    const entries = Object.entries(outdatedData);
    lines.push(`## Outdated dependencies (${entries.length})`);
    lines.push('First 5 entries:');
    entries.slice(0, 5).forEach(([pkg, info]) => {
      const current = info?.current ?? 'unknown';
      const wanted = info?.wanted ?? 'unknown';
      const latest = info?.latest ?? 'unknown';
      const type = info?.type ?? 'prod';
      lines.push(`- ${pkg} (${type}) - current: ${current}, wanted: ${wanted}, latest: ${latest}`);
    });
  } else {
    lines.push('## Outdated dependencies');
    lines.push('No outdated packages detected.');
  }
  return lines;
}

export function buildSummaryMarkdown({ prodAudit, fullAudit, outdatedData, timestamp = new Date().toISOString() }) {
  const lines = [
    '# CI Security Scan Summary',
    `Generated: ${timestamp}`,
    '',
    ...formatProductionAudit(prodAudit),
    '',
    ...formatFullAudit(fullAudit),
    '',
    ...formatOutdated(outdatedData),
    '',
    'Reports are attached as workflow artifacts.',
  ];
  return `${lines.join('\n')}\n`;
}

export function generateSecuritySummary(reportDir = 'ci-security') {
  const readJson = (filename) => {
    try {
      const content = fs.readFileSync(path.join(reportDir, filename), 'utf8').trim();
      return content ? JSON.parse(content) : null;
    } catch {
      return null;
    }
  };

  const prodAudit = readJson('npm-audit.json');
  const fullAudit = readJson('npm-audit-full.json');
  const outdatedData = readJson('npm-outdated.json');

  const summaryContent = buildSummaryMarkdown({ prodAudit, fullAudit, outdatedData });
  fs.mkdirSync(reportDir, { recursive: true });
  const summaryPath = path.join(reportDir, 'summary.md');
  fs.writeFileSync(summaryPath, summaryContent);
  // eslint-disable-next-line no-console
  console.log('Security summary written to', summaryPath);
  return summaryPath;
}

// CLI entry: `node .github/scripts/generate-security-summary.js`
// Avoids import.meta so the module also loads cleanly under ts-jest (CJS).
if (process.argv[1] && process.argv[1].endsWith('generate-security-summary.js')) {
  const reportDir = process.argv[2] ?? 'ci-security';
  generateSecuritySummary(reportDir);
}
