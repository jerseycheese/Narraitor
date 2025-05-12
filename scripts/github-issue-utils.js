// github-issue-utils.js
// Utility functions for managing GitHub issues

// Update an issue
export async function updateIssue(issue, body, complexityLabel, priorityLabel, titleToUpdate, domainLabel) {
  const { OWNER, REPO } = await import('./user-stories/modules/config.js');
  const { updateIssue: githubUpdateIssue } = await import('./user-stories/modules/github-api.js');
  
  // Get current labels and filter out old complexity/priority/domain labels
  const currentLabels = issue.labels.map(l => typeof l === 'object' ? l.name : l);
  const filteredLabels = currentLabels.filter(label => 
    !label.toLowerCase().startsWith('complexity:') && 
    !label.toLowerCase().startsWith('priority:') &&
    !label.toLowerCase().startsWith('domain:')
  );
  
  // Add new labels
  const newLabels = [...filteredLabels, complexityLabel, priorityLabel];
  
  // Add domain label if provided
  if (domainLabel) {
    newLabels.push(domainLabel);
  }
  
  // Prepare update payload
  const updatePayload = {
    body: body,
    labels: newLabels
  };
  
  // Add title if it needs updating
  if (titleToUpdate) {
    updatePayload.title = titleToUpdate;
  }
  
  // Get token from environment
  const TOKEN = process.env.GITHUB_TOKEN;
  
  await githubUpdateIssue(OWNER, REPO, issue.number, updatePayload, TOKEN);
}