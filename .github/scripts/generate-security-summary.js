import fs from 'node:fs';
import path from 'node:path';

// Generates a human-readable summary for the CI security scan artifacts.
// The script is invoked from the security workflow and operates on the
// directory provided via argv[2] (defaults to "ci-security").

const reportDir = process.argv[2] ?? 'ci-security';

const summaryLines = [
  '# CI Security Scan Summary',
  `Generated: ${new Date().toISOString()}`,
  ''
];

const readJson = (filename) => {
  try {
    const content = fs.readFileSync(path.join(reportDir, filename), 'utf8').trim();
    return content ? JSON.parse(content) : null;
  } catch (error) {
    return null;
  }
};

const auditData = readJson('npm-audit.json');
if (auditData?.metadata?.vulnerabilities) {
  const counts = auditData.metadata.vulnerabilities;
  const severities = ['critical', 'high', 'moderate', 'low'];
  const total = severities.reduce((acc, level) => acc + (counts[level] ?? 0), 0);

  summaryLines.push('## npm audit results');
  summaryLines.push(
    total
      ? `Detected ${total} total vulnerabilities across severity levels.`
      : 'No vulnerabilities detected at the configured threshold.'
  );

  severities.forEach((level) => {
    if (counts[level] !== undefined) {
      const label = level.charAt(0).toUpperCase() + level.slice(1);
      summaryLines.push(`- ${label}: ${counts[level]}`);
    }
  });

  const vulnerablePackages = Object.entries(auditData.vulnerabilities ?? {});
  if (vulnerablePackages.length) {
    summaryLines.push('', 'Packages requiring attention (up to 5):');
    vulnerablePackages.slice(0, 5).forEach(([pkg, details]) => {
      const severity = details?.severity ?? 'unknown';
      const via = Array.isArray(details?.via)
        ? details.via
            .filter((item) => typeof item === 'object' && item.title)
            .map((item) => item.title)
        : [];
      const viaLabel = via.length ? ` – ${via.slice(0, 2).join('; ')}` : '';
      summaryLines.push(`- ${pkg} (${severity})${viaLabel}`);
    });
  }
} else {
  summaryLines.push('## npm audit results');
  summaryLines.push('*No npm audit report generated.*');
}

const outdatedData = readJson('npm-outdated.json');
if (outdatedData && Object.keys(outdatedData).length) {
  const entries = Object.entries(outdatedData);
  summaryLines.push('', `## Outdated dependencies (${entries.length})`);
  summaryLines.push('First 5 entries:');
  entries.slice(0, 5).forEach(([pkg, info]) => {
    const current = info?.current ?? 'unknown';
    const wanted = info?.wanted ?? 'unknown';
    const latest = info?.latest ?? 'unknown';
    const type = info?.type ?? 'prod';
    summaryLines.push(`- ${pkg} (${type}) – current: ${current}, wanted: ${wanted}, latest: ${latest}`);
  });
} else {
  summaryLines.push('', '## Outdated dependencies');
  summaryLines.push('No outdated packages detected.');
}

summaryLines.push('', 'Reports are attached as workflow artifacts.');

fs.writeFileSync(path.join(reportDir, 'summary.md'), `${summaryLines.join('\n')}\n`);
console.log('Security summary written to', path.join(reportDir, 'summary.md'));
