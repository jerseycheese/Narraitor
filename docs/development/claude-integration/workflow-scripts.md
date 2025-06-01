# Claude Workflow Scripts Organization

## Overview
This document describes the organization of Claude workflow scripts for the Narraitor project. These scripts facilitate the automated workflow between Claude App and Claude Code sessions.

## Scripts Location
All Claude workflow scripts have been moved to the `/scripts` directory for better organization and maintainability.

## Scripts
1. **claude-workflow.sh**
   - Purpose: Automates the full development workflow with Claude App and Claude Code
   - Path: `/scripts/claude-workflow.sh`
   - Data directory: `/.claude-workflow`
   - Main workflow phases: analysis, test-definition, implementation, manual-testing, finalization

2. **claude-handoff.sh**
   - Purpose: Helps with handoffs between different Claude App sessions
   - Path: `/scripts/claude-handoff.sh`
   - Data directory: `/.claude-handoffs`
   - Templates: general, analysis-impl, impl-test, test-build, build-cleanup

3. **claude-transition.sh**
   - Purpose: Manages transitions between Claude App and Claude Code
   - Path: `/scripts/claude-transition.sh`
   - Data directory: `/.claude-transition`
   - Gates: test_definition, implementation_review, manual_testing, final_review

## Configuration
- All scripts use hidden directories (prefixed with '.') to store their data
- The project memory file (CLAUDE.md) remains in the root directory
- All scripts automatically copy their output to the clipboard when generating prompts

## Usage
To use these scripts, run them from the project root directory:
```bash
# Start workflow with GitHub issue analysis
./scripts/claude-workflow.sh analyze 123

# Create a handoff between Claude App sessions
./scripts/claude-handoff.sh request analysis-impl

# Transition from Claude App to Claude Code
./scripts/claude-transition.sh to-code TASK-123 specs.md
```

## Migration
The following steps were taken to organize the scripts:
1. Moved all scripts to the `/scripts` directory
2. Standardized on hidden directories for data storage
3. Created necessary directories
4. Moved existing data to the new locations
5. Documented the organization in this file

## Project Memory File
The CLAUDE.md file remains in the root directory as it contains the main project memory information for Claude Code, and it's intended to be easily accessible at the project root level.
