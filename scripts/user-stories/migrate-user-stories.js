#!/usr/bin/env node
// Unified User Story Migration Script
// This script extracts user stories from requirement documents and creates GitHub issues.

import { TOKEN } from './modules/config.js';
import { listDomains, getAllDomains } from './modules/fs-utils.js';
import { verifyLabels } from './modules/github.js';
import { processDomain, processAllDomains } from './modules/processor.js';

// Display help information
function displayHelp() {
  console.log(`
User Stories Migration Script
-----------------------------
Usage: node scripts/user-stories/migrate-user-stories.js [options]

Options:
  --help              Display this help text
  --list-domains      List all available domains and exit
  --domain NAME       Filter issues to a specific domain (e.g., world-configuration)
  --all-domains       Process all domains
  --dry-run           Preview issues without creating them
  --limit N           Limit the number of issues to process in one run
  --skip N            Skip the first N issues
`);
  process.exit(0);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) displayHelp();
  if (args.includes('--list-domains')) listDomains();
  if (!TOKEN) {
    console.error('GitHub token not found. Set GITHUB_TOKEN environment variable.');
    process.exit(1);
  }
  
  const dryRun = args.includes('--dry-run');
  const skipIndex = args.indexOf('--skip');
  const skip = skipIndex !== -1 && args[skipIndex + 1] ? parseInt(args[skipIndex + 1], 10) : 0;
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 && args[limitIndex + 1] ? parseInt(args[limitIndex + 1], 10) : null;
  
  const allDomains = args.includes('--all-domains');
  const domainIndex = args.indexOf('--domain');
  const DOMAIN = domainIndex !== -1 && args[domainIndex + 1] ? args[domainIndex + 1] : null;
  
  if (!allDomains && !DOMAIN) {
    console.error('No domain specified. Use --domain <domain> or --all-domains');
    process.exit(1);
  }
  
  // Verify required labels exist
  await verifyLabels();
  
  let result;
  if (allDomains) {
    const domains = getAllDomains();
    result = await processAllDomains(domains, skip, limit, dryRun);
  } else {
    result = await processDomain(DOMAIN, skip, limit, dryRun);
  }
  
  // Show summary
  console.log('\nSummary:');
  console.log(`- Created: ${result.created}`);
  console.log(`- Errors: ${result.errors}`);
  console.log(`- Skipped: ${result.skipped}`);
  console.log(`- Total processed: ${result.created + result.errors + result.skipped}`);
}

// Start execution
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
