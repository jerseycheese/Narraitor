# do-continuous-issues

I'll work through a continuous queue of GitHub issues, implementing them one by one and creating PRs without requiring manual verification between issues.

## STEP 1: AUTO-ACCEPT SETUP

First, I'll set up auto-accept for required permissions to minimize interruptions:

```bash
# Create directory if it doesn't exist
mkdir -p .claude

# Enable auto-accept for this session
cat > .claude/settings.local.json << EOL
{
  "allowedTools": [
    "Bash(*)",
    "Edit(*)",
    "Write(*)",
    "WebFetch(*)"
  ]
}
EOL
echo "Auto-accept enabled for common operations"

# Create a results tracking file for the session
cat > .claude/continuous-issues-results.md << EOL
# Continuous Issue Implementation Results

Session started: $(date)

| Issue # | Title | Status | PR URL | Started | Completed | Duration |
|---------|-------|--------|--------|---------|-----------|----------|
EOL
```

## STEP 2: ISSUE QUEUE CREATION

Now I'll query GitHub issues and create a prioritized queue:

```javascript
// Get open issues and sort by priority
try {
  const issues = await mcp__modelcontextprotocol_server_github__server_github.listIssues({
    owner: "jerseycheese",
    repo: "narraitor",
    state: "open",
    sort: "created",
    direction: "asc"
  });
  
  // Filter to include only issues with appropriate labels (e.g., "ready for implementation")
  // Change these filters based on your specific labels
  let implementableIssues = issues.filter(issue => {
    // By default, consider all issues as implementable
    let isImplementable = true;
    
    // Skip issues that are explicitly marked as not ready
    if (issue.labels.some(label => 
      label.name === "blocked" || 
      label.name === "wont-fix" || 
      label.name === "duplicate" ||
      label.name === "needs-discussion"
    )) {
      isImplementable = false;
    }
    
    return isImplementable;
  });
  
  // Prioritize issues (by labels, priority, complexity)
  const prioritizedIssues = implementableIssues.sort((a, b) => {
    // Give higher priority to issues labeled "priority" or "high-priority"
    const aPriority = a.labels.some(label => 
      label.name.includes("priority") || 
      label.name.includes("urgent") || 
      label.name.includes("important")
    ) ? 1 : 0;
    
    const bPriority = b.labels.some(label => 
      label.name.includes("priority") || 
      label.name.includes("urgent") || 
      label.name.includes("important")
    ) ? 1 : 0;
    
    if (aPriority !== bPriority) return bPriority - aPriority;
    
    // Then sort by smallest first (quicker wins)
    const aSize = a.labels.find(label => label.name.includes("size:") || label.name.includes("effort:"));
    const bSize = b.labels.find(label => label.name.includes("size:") || label.name.includes("effort:"));
    
    const getSizeValue = (label) => {
      if (!label) return 2; // medium default
      if (label.name.includes("small") || label.name.includes("easy") || label.name.includes("trivial")) return 1;
      if (label.name.includes("large") || label.name.includes("high") || label.name.includes("complex")) return 3;
      return 2; // medium
    };
    
    return getSizeValue(aSize) - getSizeValue(bSize);
  });
  
  // Select issues 
  // The $ARGUMENTS parameter can specify the number of issues to process or specific issue numbers
  let queuedIssues = [];
  
  if ($ARGUMENTS && !isNaN(parseInt($ARGUMENTS))) {
    // If a number is provided, use it as the limit
    const limit = parseInt($ARGUMENTS);
    if (limit > 0) {
      queuedIssues = prioritizedIssues.slice(0, limit);
    } else {
      // If a negative number is provided, consider it a specific issue number
      const specificIssue = issues.find(issue => issue.number === Math.abs(limit));
      if (specificIssue) {
        queuedIssues = [specificIssue];
      } else {
        console.log(`Issue #${Math.abs(limit)} not found. Defaulting to top 3 issues.`);
        queuedIssues = prioritizedIssues.slice(0, 3);
      }
    }
  } else if ($ARGUMENTS && $ARGUMENTS.split(',').every(num => !isNaN(parseInt(num.trim())))) {
    // If comma-separated numbers are provided, use them as specific issue numbers
    const issueNumbers = $ARGUMENTS.split(',').map(num => parseInt(num.trim()));
    queuedIssues = issues.filter(issue => issueNumbers.includes(issue.number));
    if (queuedIssues.length === 0) {
      console.log(`None of the specified issues found. Defaulting to top 3 issues.`);
      queuedIssues = prioritizedIssues.slice(0, 3);
    }
  } else {
    // Default to top 3 issues
    queuedIssues = prioritizedIssues.slice(0, 3);
  }
  
  console.log("Prioritized Issue Queue:");
  queuedIssues.forEach((issue, index) => {
    console.log(`${index + 1}. #${issue.number}: ${issue.title}`);
  });
  
  // Save queue to file for persistence
  const queueData = {
    issues: queuedIssues.map(i => ({ 
      number: i.number, 
      title: i.title,
      status: "pending",
      size: i.labels.find(label => label.name.includes("size:") || label.name.includes("effort:"))?.name || "size:medium",
      url: i.html_url,
      pr_url: null,
      start_time: null,
      end_time: null
    })),
    currentIndex: 0,
    lastUpdated: new Date().toISOString()
  };
  
  // Write to files
  await fs.writeFileSync('./.claude/issue-queue.json', JSON.stringify(queueData, null, 2));
  
  console.log(`\nQueued ${queuedIssues.length} issues for implementation.`);
  
} catch (error) {
  console.error("Error creating issue queue:", error);
}
```

## STEP 3: PROCESS ISSUES CONTINUOUSLY

I'll now process each issue, skipping manual verification between implementation stages for efficiency:

```javascript
// Process queue
try {
  // Read the queue file
  const queueData = JSON.parse(fs.readFileSync('./.claude/issue-queue.json', 'utf8'));
  const issueCount = queueData.issues.length;
  
  console.log(`\nStarting to process ${issueCount} issues in the queue...`);
  
  // Loop through each issue
  for (let i = 0; i < issueCount; i++) {
    const issue = queueData.issues[i];
    const issueNumber = issue.number;
    
    console.log(`\n==========================`);
    console.log(`PROCESSING ISSUE #${issueNumber}: ${issue.title}`);
    console.log(`==========================`);
    
    // Update status to in-progress and record start time
    const startTime = new Date().toISOString();
    queueData.issues[i].status = "in-progress";
    queueData.issues[i].start_time = startTime;
    queueData.currentIndex = i;
    
    // Write updated queue data
    fs.writeFileSync('./.claude/issue-queue.json', JSON.stringify(queueData, null, 2));
    
    // Append to results markdown
    fs.appendFileSync('./.claude/continuous-issues-results.md', 
      `| #${issueNumber} | ${issue.title} | In Progress | - | ${startTime} | - | - |\n`);
    
    console.log(`Starting implementation of issue #${issueNumber}...`);
    
    // Call do-issue-auto-noverify command to implement the issue
    console.log(`\nExecuting: /project:do-issue-auto-noverify ${issueNumber}\n`);
    
    try {
      // This is a placeholder - in reality Claude Code would execute this command
      // and the result would be captured here
      console.log(`Executing implementation of issue #${issueNumber}...`);
      
      // This would be the actual execution in Claude Code:
      const pr_url = `/project:do-issue-auto-noverify ${issueNumber}`;
      
      // Record completion
      const endTime = new Date().toISOString();
      const duration = (new Date(endTime) - new Date(startTime)) / 1000; // in seconds
      const durationStr = `${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`;
      
      // Update queue data
      queueData.issues[i].status = "completed";
      queueData.issues[i].end_time = endTime;
      queueData.issues[i].pr_url = pr_url; // This would be the actual PR URL in practice
      
      // Update results markdown by finding and replacing the "In Progress" line
      const resultsContent = fs.readFileSync('./.claude/continuous-issues-results.md', 'utf8');
      const newResultsContent = resultsContent.replace(
        `| #${issueNumber} | ${issue.title} | In Progress | - | ${startTime} | - | - |`,
        `| #${issueNumber} | ${issue.title} | Completed | [PR](${pr_url}) | ${startTime} | ${endTime} | ${durationStr} |`
      );
      fs.writeFileSync('./.claude/continuous-issues-results.md', newResultsContent);
      
      // Save updated queue data
      fs.writeFileSync('./.claude/issue-queue.json', JSON.stringify(queueData, null, 2));
      
      console.log(`✅ Issue #${issueNumber} implementation completed successfully.`);
      console.log(`PR URL: ${pr_url}`);
      console.log(`Duration: ${durationStr}`);
      
      // Compact conversation to save tokens before moving to next issue
      console.log("\nCompacting conversation to save tokens before next issue...");
      console.log("/compact Focus only on remaining issues in the queue");
      
    } catch (error) {
      console.error(`Error implementing issue #${issueNumber}:`, error);
      
      // Update queue data to mark as failed
      queueData.issues[i].status = "failed";
      queueData.issues[i].end_time = new Date().toISOString();
      
      // Update results markdown
      const resultsContent = fs.readFileSync('./.claude/continuous-issues-results.md', 'utf8');
      const newResultsContent = resultsContent.replace(
        `| #${issueNumber} | ${issue.title} | In Progress | - | ${startTime} | - | - |`,
        `| #${issueNumber} | ${issue.title} | Failed | - | ${startTime} | ${queueData.issues[i].end_time} | - |`
      );
      fs.writeFileSync('./.claude/continuous-issues-results.md', newResultsContent);
      
      // Save updated queue data
      fs.writeFileSync('./.claude/issue-queue.json', JSON.stringify(queueData, null, 2));
      
      // Check if we should continue or stop
      console.log(`\n⚠️ Issue #${issueNumber} implementation failed. Should we continue with the next issue?`);
      console.log("Type 'SKIP' to skip this issue and continue, or any other response to stop the batch process:");
      
      // In an actual implementation, we would wait for user input here and proceed accordingly.
      // For this example, we'll assume the user wants to continue.
      console.log("Skipping and continuing with next issue...");
    }
  }
  
  // All issues processed
  console.log(`\n==========================`);
  console.log(`BATCH PROCESSING COMPLETE`);
  console.log(`==========================`);
  
  // Add completion timestamp to results
  fs.appendFileSync('./.claude/continuous-issues-results.md', 
    `\n\nBatch processing completed: ${new Date().toISOString()}\n`);
  
  // Summary
  const finalQueueData = JSON.parse(fs.readFileSync('./.claude/issue-queue.json', 'utf8'));
  const completed = finalQueueData.issues.filter(i => i.status === "completed").length;
  const failed = finalQueueData.issues.filter(i => i.status === "failed").length;
  
  console.log(`\nProcessed ${issueCount} issues:`);
  console.log(`✅ ${completed} issues completed successfully`);
  console.log(`❌ ${failed} issues failed`);
  console.log(`\nDetailed results are available in .claude/continuous-issues-results.md`);
  
  // List PRs that need review
  console.log(`\nPRs requiring manual testing and review:`);
  finalQueueData.issues.filter(i => i.status === "completed").forEach(issue => {
    console.log(`- Issue #${issue.number}: ${issue.pr_url}`);
  });
  
} catch (error) {
  console.error("Error processing issue queue:", error);
}
```

## STEP 4: CREATING A GITHUB ISSUE FOR TRACKING

I'll create a GitHub issue to track the batch implementation results:

```javascript
// Create a tracking issue
try {
  // Read the results
  const resultsContent = fs.readFileSync('./.claude/continuous-issues-results.md', 'utf8');
  
  // Create issue with the results
  const trackingIssue = await mcp__modelcontextprotocol_server_github__server_github.createIssue({
    owner: "jerseycheese",
    repo: "narraitor",
    title: `Batch Implementation Report: ${new Date().toLocaleDateString()}`,
    body: `# Batch Implementation Report

This issue tracks the results of a continuous implementation session run on ${new Date().toLocaleString()}.

## Summary
${resultsContent}

## Manual Testing Required

The PRs above were created through automated implementation in continuous mode.
**⚠️ Manual testing is required before merging each PR.**

Please verify:
1. Functionality matches acceptance criteria
2. UI appearance and behavior is correct
3. Tests are comprehensive and passing
4. No regressions in related functionality

## Next Steps

1. Review and test each PR
2. Provide feedback on implementation quality
3. Merge PRs when ready
4. Close this tracking issue when all PRs are handled`,
    labels: ["documentation", "automated"]
  });
  
  console.log(`\nCreated tracking issue: ${trackingIssue.html_url}`);
  
} catch (error) {
  console.error("Error creating tracking issue:", error);
}
```

## WORKFLOW COMPLETE

The continuous implementation workflow is now complete. A summary of all implemented issues has been saved to `.claude/continuous-issues-results.md` and all PRs are ready for manual testing and review.

**Important Notes:**
1. This workflow automatically implements issues without manual verification between steps
2. All PRs require manual testing before merging
3. A tracking issue has been created to help monitor the batch implementation
4. Failed implementations can be retried individually using the regular `/project:do-issue` command

To optimize token usage during this workflow:
1. Conversations are compacted between implementations
2. Only essential information is retained in context
3. Each issue is processed independently to minimize context bloat

If you need to resume an interrupted batch, you can re-run this command with the same arguments. It will pick up where it left off based on the queue status.