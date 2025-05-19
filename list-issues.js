// List all open GitHub issues for Narraitor repository

async function listGitHubIssues() {
  try {
    const issues = await mcp__modelcontextprotocol_server_github__server_github.listIssues({
      owner: "jerseycheese",
      repo: "Narraitor",
      state: "open"
    });

    console.log(`Found ${issues.length} open issues:\n`);
    
    issues.forEach((issue, index) => {
      const labels = issue.labels.map(l => l.name).join(', ');
      console.log(`${index + 1}. #${issue.number}: ${issue.title}`);
      if (labels) {
        console.log(`   Labels: ${labels}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error("Error fetching issues with MCP GitHub tool:", error);
    console.log("Falling back to gh CLI:");
    console.log("gh issue list --json number,title,state,labels --limit 30");
  }
}

// Execute the function
listGitHubIssues();