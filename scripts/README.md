# `scripts/` Directory

This directory contains utility scripts that support ongoing development workflows for the Narraitor project, including GitHub issue management, user story processing, and testing.

## Contents

The scripts are organized into categories based on their primary function.

### GitHub Label Management

Scripts and directories related to managing GitHub labels for the repository.

*   [`scripts/github-label-creator.js`](scripts/github-label-creator.js): A script to create or manage GitHub labels.
*   [`scripts/setup-github-labels.js`](scripts/setup-github-labels.js): A script specifically for setting up standard GitHub labels for the repository.
*   [`scripts/github/`](scripts/github/): Contains additional GitHub-related utility scripts.

### Issue Processing and Utilities

Scripts and directories focused on interacting with and processing GitHub issues.

*   [`scripts/github-issue-utils.js`](scripts/github-issue-utils.js): Provides utility functions for common GitHub issue operations.
*   [`scripts/process-issues.js`](scripts/process-issues.js): A script to process GitHub issues, potentially extracting or updating information.
*   [`scripts/utils/`](scripts/utils/): Contains general utility modules used by various scripts, including those for issue processing.

### User-Story Parsing and Sync

Scripts and directories for processing, validating, and synchronizing user stories, often linked with GitHub issues and CSV files.

*   [`scripts/story-validation-utils.js`](scripts/story-validation-utils.js): Offers utility functions for validating user story formats and content.
*   [`scripts/update-user-stories.js`](scripts/update-user-stories.js): A script to update user stories, likely synchronizing between different sources like CSV and GitHub.
*   [`scripts/validate-user-stories.js`](scripts/validate-user-stories.js): A script to run validation checks on user stories.
*   [`scripts/user-stories/`](scripts/user-stories/): Contains modules and scripts specifically for user story management and processing workflows.

### Testing and Debugging Helpers

Scripts and directories that assist with testing various parts of the project, particularly those involving data processing or script execution.

*   [`scripts/test-update-stories.sh`](scripts/test-update-stories.sh): A shell script to facilitate testing the user story update process.
*   [`scripts/testing/`](scripts/testing/): Contains test files and utilities for testing the scripts in this directory.

### Documentation

*   [`scripts/github-project-setup.md`](scripts/github-project-setup.md): Documentation related to setting up GitHub projects for this repository.
