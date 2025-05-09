// scripts/github/remove-user-story-prefix.js
// A one-off script to remove the "[USER STORY] " prefix from open GitHub issue titles.

import { listIssues, updateIssue } from './github-issue-utils.js';

const DRY_RUN = process.argv.includes('--dry-run');
const PREFIX = "[USER STORY] ";

async function removePrefixFromIssueTitles() {
  console.log(`Starting script to remove "${PREFIX}" prefix from open issue titles.`);
  if (DRY_RUN) {
    console.log("DRY RUN MODE enabled. No changes will be made to GitHub.");
  }

  let issuesToProcess = [];
  let page = 1;
  const perPage = 100;

  try {
    // Fetch all open issues with pagination
    console.log("Fetching open issues...");
    while (true) {
      const issues = await listIssues(page, perPage);
      if (issues.length === 0) {
        break;
      }
      issuesToProcess.push(...issues);
      console.log(`Fetched page ${page}, total issues fetched: ${issuesToProcess.length}`);
      page++;
      // Add a small delay to prevent hitting rate limits too quickly
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`Finished fetching. Found ${issuesToProcess.length} open issues.`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const issue of issuesToProcess) {
      try {
        if (issue.title.startsWith(PREFIX)) {
          const oldTitle = issue.title;
          const newTitle = issue.title.substring(PREFIX.length);

          console.log(`Processing issue #${issue.number}: "${oldTitle}"`);

          if (!DRY_RUN) {
            // Update the issue title, keeping the original body and labels
            await updateIssue(issue, issue.body, null, null, newTitle);
            console.log(`✅ Updated issue #${issue.number}: "${oldTitle}" -> "${newTitle}"`);
            updatedCount++;
          } else {
            console.log(`Would update issue #${issue.number} (dry run): "${oldTitle}" -> "${newTitle}"`);
            updatedCount++; // Count in dry run for reporting
          }
          // Add a small delay between updates
          await new Promise(r => setTimeout(r, 1000));

        } else {
          console.log(`⏭️ Skipping issue #${issue.number}: "${issue.title}" (prefix not found)`);
          skippedCount++;
        }
      } catch (issueError) {
        console.error(`❌ Error processing issue #${issue.number}: ${issueError.message}`);
        errorCount++;
      }
    }

    console.log("\nScript execution finished.");
    console.log(`Summary:`);
    console.log(`- Total open issues checked: ${issuesToProcess.length}`);
    console.log(`- Issues updated (or would be in dry run): ${updatedCount}`);
    console.log(`- Issues skipped (prefix not found): ${skippedCount}`);
    console.log(`- Errors encountered: ${errorCount}`);

  } catch (fetchError) {
    console.error(`\n❌ Error fetching issues: ${fetchError.message}`);
    process.exit(1); // Exit with error code
  }
}

removePrefixFromIssueTitles().catch(console.error);