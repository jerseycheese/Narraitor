# Claude Code Permission Setup Guide

This guide addresses common security and permission concerns with Claude Code and provides recommended settings for the Narraitor project.

## Understanding Claude Code Permissions

Claude Code operates with a permission system that controls what actions it can perform on your system. Tools like Bash, Edit, and WebFetch require explicit permissions, which can be configured in the following ways:

1. **Interactive Approval**: Claude Code asks for permission each time
2. **Session Approval**: Approve once for the current session
3. **Permanent Approval**: Configure in settings files

## Permission Hierarchy

Claude Code uses a hierarchical settings approach:

- **User Settings** (~/.claude/settings.json): Applied to all projects
- **Project Settings** (.claude/settings.json): Shared project settings
- **Local Project Settings** (.claude/settings.local.json): Personal project settings
- **Command-line Arguments**: Override settings for a specific session
- **Enterprise Policies**: System-wide settings (admin-only)

## Recommended Permission Settings for Narraitor

Based on your workflow and the nature of the Narraitor project, here are the recommended permission settings:

### Baseline Project Settings (.claude/settings.json)

Create this file in your project root:

```json
{
  "allow_tools": [
    "Read(src/**)",
    "Read(docs/**)",
    "Read(tests/**)",
    "Read(package.json)",
    "Read(tsconfig.json)",
    "Glob(src/**)",
    "Glob(docs/**)",
    "Glob(tests/**)",
    "Grep(src/**)",
    "Grep(docs/**)",
    "Grep(tests/**)",
    "LS(src/**)",
    "LS(docs/**)",
    "LS(tests/**)",
    "Agent",
    "WebFetch(domain:developer.mozilla.org)",
    "WebFetch(domain:github.com)",
    "WebFetch(domain:reactjs.org)",
    "WebFetch(domain:nextjs.org)",
    "WebFetch(domain:tailwindcss.com)"
  ],
  "env": {
    "NODE_ENV": "development",
    "NEXT_PUBLIC_API_URL": "http://localhost:3000/api"
  }
}
```

### Personal Development Settings (.claude/settings.local.json)

Create this file in your project root for your personal development flow:

```json
{
  "allow_tools": [
    "Edit(src/**)",
    "Edit(tests/**)",
    "Edit(.storybook/**)",
    "Bash(npm run test)",
    "Bash(npm run test:*)",
    "Bash(npm run dev)",
    "Bash(npm run build)",
    "Bash(npm run storybook)",
    "Bash(npm run lint)",
    "Bash(git status)",
    "Bash(git diff)",
    "Bash(git add)",
    "Bash(cd *)"
  ],
  "deny_tools": [
    "Edit(/Users/jackhaas/.ssh/**)",
    "Edit(/Users/jackhaas/.aws/**)",
    "Edit(/Users/jackhaas/.config/**)",
    "Bash(rm -rf *)",
    "Bash(sudo *)",
    "Bash(npm publish)"
  ]
}
```

### User-Level Settings (~/.claude/settings.json)

For your global Claude Code settings:

```json
{
  "theme": "auto",
  "verbose_bash": true,
  "indent_with_tabs": false,
  "allow_tools": [
    "Bash(pwd)",
    "Bash(ls)",
    "Bash(cd)",
    "Bash(git status)",
    "Bash(git diff)"
  ],
  "deny_tools": [
    "Bash(sudo *)",
    "Bash(rm -rf /)",
    "Edit(/etc/**)",
    "Edit(/usr/**)",
    "Edit(~/.ssh/**)",
    "Edit(~/.zshrc)",
    "Edit(~/.bashrc)"
  ]
}
```

## Permission Patterns Explained

### Tool Patterns

- **Read/Edit**: Path patterns follow [gitignore](https://git-scm.com/docs/gitignore) specification
- **Bash**: Command patterns support exact matches (`npm run test`) or prefix matches (`npm run test:*`)
- **WebFetch**: Domain-based restrictions (`domain:example.com`)

### Path Modifiers

- `/` for the project root
- `//` for absolute paths
- `~/` for home directory
- `**` for recursive matches

## Security Best Practices

### Key Guidelines

1. **Start Restrictive**: Begin with minimal permissions and add as needed
2. **Review Carefully**: Examine any command before approving
3. **Protect Credentials**: Never allow access to credential files
4. **Use Session Approval**: For sensitive operations, use session-level approval rather than permanent
5. **Audit Regularly**: Review your permission files periodically

### Important Protections

- **Never Allow**:
  - Access to SSH keys, credential files, or API tokens
  - System-wide commands with `sudo`
  - Dangerous file operations like `rm -rf *`
  - Write access to system directories
  - Publishing or deployment commands without review

## Workflow-Specific Settings

For the Narraitor project, you should set up phase-specific permission profiles:

### Planning Phase Permissions
```json
{
  "allow_tools": [
    "Read(**)",
    "Glob(**)",
    "LS(**)",
    "Grep(**)"
  ]
}
```

### Implementation Phase Permissions
```json
{
  "allow_tools": [
    "Read(**)",
    "Edit(src/**)",
    "Edit(tests/**)",
    "Bash(npm run test)",
    "Bash(npm run dev)",
    "Bash(git status)"
  ]
}
```

### Testing Phase Permissions
```json
{
  "allow_tools": [
    "Read(**)",
    "Edit(src/**)",
    "Edit(tests/**)",
    "Bash(npm run test)",
    "Bash(npm run test:*)",
    "Bash(npm run storybook)"
  ]
}
```

### Git Operations Permissions
```json
{
  "allow_tools": [
    "Bash(git status)",
    "Bash(git diff)",
    "Bash(git add)",
    "Bash(git commit -m *)",
    "Bash(git push)"
  ]
}
```

## Setting Up Claude Code Permissions

1. **Create Project Settings Directory**:
   ```bash
   mkdir -p .claude
   ```

2. **Create Base Project Settings**:
   ```bash
   touch .claude/settings.json
   ```

3. **Create Personal Settings**:
   ```bash
   touch .claude/settings.local.json
   ```

4. **Add to .gitignore**:
   ```bash
   echo ".claude/settings.local.json" >> .gitignore
   ```

5. **Configure Git to Ignore Local Settings**:
   ```bash
   git config --local core.excludesFile .gitignore
   ```

## Real-time Permission Management

During Claude Code sessions, you can:

1. **View Current Permissions**:
   ```
   /allowed-tools
   ```

2. **Check Tool Permission Status**:
   ```
   /allowed-tools Bash
   ```

3. **Modify Permissions**:
   ```
   /config set allow_tools.append Bash(npm run build)
   ```

## Typical Permission Workflow

1. **Start Cautious**: Begin with read-only permissions
2. **Expand as Needed**: During the session, approve additional commands as required
3. **Save to settings.local.json**: For frequently used commands
4. **Review Before Approving**: Always check what Claude Code is trying to do
5. **Error on the Side of Safety**: When in doubt, deny and run manually

## Monitoring Claude Code Activity

To keep track of Claude Code's actions:

1. **Enable Verbose Mode**:
   ```bash
   claude config set verbose true
   ```

2. **Review Command History**:
   ```bash
   history | grep "claude"
   ```

3. **Check Git Diff Before Commits**:
   Always review changes before allowing Claude Code to commit:
   ```bash
   git diff --staged
   ```

## Conclusion

With these permission settings, Claude Code will:
- Have read access to your entire project
- Only have write access to source, test, and Storybook files
- Be able to run development commands like tests and the dev server
- Be able to view git status and perform basic git operations
- Be blocked from accessing sensitive areas or running destructive commands

These settings strike a balance between enabling Claude Code to be helpful while maintaining appropriate security boundaries. You can always adjust these settings as your comfort level and needs change.
