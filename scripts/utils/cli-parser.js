// cli-parser.js
// Command line argument parsing

export function parseCommandLineArgs(args) {
  const options = {
    dryRun: false,
    limit: null,
    force: false,
    validate: false,
    specificIssueNum: null,
    issueType: 'user-story'
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      options.dryRun = true;
    } else if (args[i] === '--force') {
      options.force = true;
    } else if (args[i] === '--validate') {
      options.validate = true;
    } else if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1], 10);
      i++; // Skip next arg
    } else if (args[i] === '--issue' && args[i + 1]) {
      options.specificIssueNum = parseInt(args[i + 1], 10);
      i++; // Skip next arg
    } else if (args[i].startsWith('--issue=')) {
      const valuePart = args[i].substring('--issue='.length);
      if (!isNaN(parseInt(valuePart, 10))) {
        options.specificIssueNum = parseInt(valuePart, 10);
      }
    } else if (args[i] === '--type' && args[i + 1]) {
      options.issueType = args[i + 1];
      i++; // Skip next arg
    } else if (args[i].startsWith('--type=')) {
      const valuePart = args[i].substring('--type='.length);
      if (valuePart) {
        options.issueType = valuePart;
      }
    }
  }

  return options;
}

export function getIssueTemplatePath(issueType) {
  const templateMap = {
    'epic': '.github/ISSUE_TEMPLATE/epic.md',
    'enhancement': '.github/ISSUE_TEMPLATE/enhancement.md',
    'feature': '.github/ISSUE_TEMPLATE/feature_request.md',
    'user-story': '.github/ISSUE_TEMPLATE/user-story.md'
  };

  return templateMap[issueType] || templateMap['user-story'];
}

export function getIssueLabelByType(issueType) {
  const labelMap = {
    'epic': 'epic',
    'enhancement': 'enhancement',
    'feature': 'enhancement',
    'user-story': 'user-story'
  };

  return labelMap[issueType] || 'user-story';
}
