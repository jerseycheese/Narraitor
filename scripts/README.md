# Scripts Directory

This directory contains utility scripts that support ongoing development workflows for the Narraitor project. Basically, these are automation scripts for GitHub issue management, user story processing, and testing workflows that save a lot of manual work.

## What's In Here

The scripts are organized by what they actually do rather than by file type.

### GitHub Label Management

Scripts for managing GitHub labels across the repository. Setting up consistent labels manually is tedious, so these automate it:

- **`github-label-creator.js`** - Creates or manages GitHub labels
- **`setup-github-labels.js`** - Sets up the standard set of labels we use 
- **`github/`** - Additional GitHub-related utility scripts

### Issue Processing and Utilities

Scripts focused on working with GitHub issues programmatically. When you're dealing with dozens of issues, manual processing gets old fast:

- **`github/github-issue-utils.js`** - Common GitHub issue operations (utilities for other scripts)
- **`process-issues.js`** - Processes GitHub issues in bulk, extracting or updating information
- **`utils/`** - General utility modules used by various scripts

### User Story Parsing and Sync

Scripts for processing, validating, and synchronizing user stories. The workflow connects GitHub issues with CSV files, and keeping them in sync manually is error-prone:

- **`story-validation-utils.js`** - Validates user story formats and content
- **`update-user-stories.js`** - Updates user stories, syncing between CSV and GitHub
- **`validate-user-stories.js`** - Runs validation checks on user stories
- **`user-stories/`** - Modules specifically for user story management workflows

### Testing and Debugging Helpers

Scripts that help with testing various parts of the project, especially data processing or script execution. Useful when you're debugging complex workflows:

- **`test-update-stories.sh`** - Shell script to test the user story update process
- **`testing/`** - Test files and utilities for testing the scripts themselves

### Provider Verification

- **`verify-openai-compatible-stream.mjs`** - Plays one streamed narrative turn against a live OpenAI-compatible provider, through the same adapter and stream consumer the narrative route uses. This is the check that has to pass before a preset in `src/lib/ai/presets.ts` can be marked `available: true`, since nothing in CI can call a paid endpoint. Reads the key from `OPENAI_COMPAT_API_KEY` at call time, and redacts it from anything it prints:

  ```bash
  OPENAI_COMPAT_API_KEY=<your key> node scripts/verify-openai-compatible-stream.mjs --preset openrouter
  ```

  `--preset <id>` takes the endpoint and default model from the preset; `--model` overrides the model, and `--endpoint` (with `--model`) points at a service that has no preset. Exits 0 on pass, 1 on fail.

### Documentation

- **`github-project-setup.md`** - Documentation for setting up GitHub projects for this repository

## How to Use These

Most of these scripts are designed to be run from the project root. They typically expect environment variables (like `GITHUB_TOKEN`) to be set up, and many require Node.js since they're using the GitHub API.

The general pattern is that you run them when you need to do bulk operations on issues, labels, or user stories that would be tedious to do manually through the GitHub web interface.
