# Claude Max Usage Tracking Guide

## Understanding Your Claude Max Subscription

Claude Max provides enhanced usage limits that are shared between Claude App and Claude Code. Your subscription includes:

- **Max Plan (5x Pro/$100)**: Approximately 225 messages every 5 hours
- **Max Plan (20x Pro/$200)**: Approximately 900 messages every 5 hours

These limits are shared across both Claude App and Claude Code, with usage varying based on message complexity, conversation length, and file attachments.

## Monitoring Usage

### In Claude App
- Watch for warning messages about remaining capacity
- Check usage in Settings > Usage
- Observe when responses become slower or shorter (indicates approaching limits)

### In Claude Code
- Use the `/cost` command to view token usage statistics
- Check usage summary at the end of sessions
- Monitor for warning messages about rate limits

## Usage Optimization Strategies

### General Strategies
- **Plan Before Implementation**: Sketch out your approach before engaging Claude
- **Batch Similar Tasks**: Group related tasks to minimize context switching costs
- **Be Specific with Requests**: More targeted prompts use fewer tokens
- **Close Inactive Sessions**: End sessions when complete to free up resources
- **Strategic Tool Selection**: Use the right tool for the right job (App vs Code)

### Claude App Optimization
- **Start Fresh**: Create new chats for distinctly different tasks
- **Use Artifacts**: Consolidate information in artifacts to reduce message count
- **Compact Conversations**: Use `/compact` command or create summaries before lengthy implementations
- **Limit Long Conversations**: Watch for the "Long chats cause you to reach your usage limits faster" warning
- **Use Clear Handoffs**: When approaching limits, create a summary artifact and start a new chat

### Claude Code Optimization
- **Leverage Memory**: Use CLAUDE.md for persistent context (reduces repetition)
- **Specify File Paths**: Direct Claude to specific files rather than letting it search
- **Targeted Questions**: Ask about specific code elements rather than general concepts
- **Use Non-Interactive Mode**: Run with `-p` flag for simple one-shot operations
- **Set Max Turns**: Use `--max-turns` parameter to limit conversation length

## Task Distribution Guidelines

Optimize your Max subscription by distributing tasks appropriately:

### High Token Efficiency (Claude App)
- Project planning
- Architecture decisions
- Technical specifications
- Documentation creation
- Research synthesis

### Medium Token Efficiency (Hybrid Approach)
- Test definition
- Component design
- UX planning
- Workflow development
- Code reviews

### Lower Token Efficiency (Claude Code)
- Implementation tasks
- Build error resolution
- Test fixes
- Interactive debugging
- Git operations

## What To Do When Approaching Limits

1. **Prioritize Critical Tasks**: Focus on what needs immediate attention
2. **Compact Conversations**: In Claude App, compact conversations to reduce context
3. **Create Handoff Summaries**: Summarize work to continue later
4. **Switch to Resource-Appropriate Tool**: Switch between App and Code based on efficiency
5. **Wait for Reset**: If limits are reached, wait for the 5-hour reset
6. **Consider Tier Upgrade**: If consistently hitting limits, consider upgrading to the 20x Pro tier

## Usage Monitoring System

### Daily Usage Log Template
Create a simple log file to track usage across both tools:

```markdown
# Claude Max Usage Log - [Date]

## Claude App
- Session 1: [Task] - [Duration] - [Approximate messages]
- Session 2: [Task] - [Duration] - [Approximate messages]

## Claude Code
- Session 1: [Task] - [Duration] - [/cost output]
- Session 2: [Task] - [Duration] - [/cost output]

## Total Estimated Usage
- Estimated messages: [X]/225 (X%)
- Next reset: [Time]

## Notes
- [Any observations about rate limiting]
- [Plans for optimizing usage]
```

### Weekly Usage Analysis
Review your log weekly to identify optimization opportunities:
- Which tasks consumed the most resources?
- Which tool was more efficient for which types of tasks?
- Did you approach or hit limits? When and why?
- How can workflows be adjusted to optimize usage?

## Long-Term Optimization

### Develop Usage Patterns
After tracking usage for several weeks, analyze patterns to better distribute your work:
- Identify high-token-cost activities
- Schedule resource-intensive tasks around reset times
- Group similar tasks to maintain context efficiency
- Determine optimal task distribution between Claude App and Claude Code

### Build a Task Classification System
Categorize tasks by their token efficiency:
- **Low Cost**: Quick answers, clarifications, small edits
- **Medium Cost**: Partial implementations, targeted debugging, component design
- **High Cost**: Full feature implementations, complex debugging, system design

### Automated Tracking Script (Optional)
Consider creating a simple script to track Claude usage, possibly using Claude Code's non-interactive mode:

```bash
#!/bin/bash
# Simple Claude usage tracking script

echo "=== Claude Usage Report: $(date) ===" >> claude_usage_log.txt
echo "--- Claude Code Stats ---" >> claude_usage_log.txt
claude -p "/cost" --output-format json | jq '.conversation_stats' >> claude_usage_log.txt
echo "--------------------------" >> claude_usage_log.txt
echo "" >> claude_usage_log.txt
```
