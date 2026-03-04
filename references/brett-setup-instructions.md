# Brett's Claude Code Setup Instructions

Give this to Brett's Claude Code to match Scott's configuration.

---

## Step 1: Install Plugins

Run these commands to install the official plugin marketplace and enable plugins:

```bash
# The marketplace should auto-install, but if not:
claude plugin install claude-plugins-official

# Enable the same plugins as Scott
claude plugin enable firebase@claude-plugins-official
claude plugin enable playwright@claude-plugins-official
claude plugin enable vercel@claude-plugins-official
claude plugin enable code-review@claude-plugins-official
claude plugin enable frontend-design@claude-plugins-official
claude plugin enable figma@claude-plugins-official
```

**Note:** Don't enable `slack@claude-plugins-official` - it's in limited preview and not publicly available yet.

---

## Step 2: Add MCP Servers

Add these to `~/.claude.json` under `mcpServers`:

### n8n-mcp (connects to Brett's n8n instance)
```bash
claude mcp add n8n-mcp -s user -- npx n8n-mcp
```
Then add environment variables to the server config in `~/.claude.json`:
```json
"env": {
  "MCP_MODE": "stdio",
  "LOG_LEVEL": "error",
  "DISABLE_CONSOLE_OUTPUT": "true",
  "N8N_API_URL": "https://banc-r.app.n8n.cloud/api/v1",
  "N8N_API_KEY": "[see credentials.md → Shared / Brett Setup]"
}
```

### Notion MCP
```bash
claude mcp add notion -s user -- npx -y @suekou/mcp-notion-server
```
Brett needs to:
1. Go to https://www.notion.so/my-integrations
2. Create a new integration called "Claude Code"
3. Copy the API token
4. Add to `~/.claude.json` under the notion server's `env`:
```json
"env": {
  "NOTION_API_TOKEN": "your-token-here"
}
```
5. Share the "B/A Common" page with the integration in Notion

### Context7
```bash
claude mcp add context7 -s user -- npx -y @upstash/context7-mcp
```

---

## Step 3: Copy Custom Skills

Copy these skill directories from Scott's machine to Brett's `~/.claude/skills/`:

- automation-best-practices
- mcp-integration
- n8n-code-javascript
- n8n-code-python
- n8n-expression-syntax
- n8n-mcp-tools-expert
- n8n-node-configuration
- n8n-patterns
- n8n-validation-expert
- n8n-workflow-patterns
- surrealdb-patterns

---

## Step 4: Copy Custom Agents

Copy these agent files from Scott's machine to Brett's `~/.claude/agents/`:

- api-connector.md
- automation-tester.md
- business-consultant.md
- code-explainer.md
- error-translator.md
- n8n-workflow-builder.md
- surrealdb-architect.md

---

## Step 5: Copy Rules

Copy from Scott's `~/.claude/rules/`:

- n8n-sync.md

---

## Step 6: Copy Commands

Copy from Scott's `~/.claude/commands/`:

- sync-config.md
- remind.md

---

## Step 7: Set Up Telegram Notifications

We use Telegram instead of Slack for Bresco notifications (keeps personal/Bresco separate from Advosy).

**Bot:** @BrescoAlertsBot

1. Install Telegram on your phone (or desktop)
2. Search for `@BrescoAlertsBot` and tap **Start**
3. Send any message (like "hello")
4. Get your chat ID by opening this URL in a browser:
   ```
   https://api.telegram.org/bot[see credentials.md → Shared / Brett Setup]/getUpdates
   ```
5. Look for `"chat":{"id":` - that number is your chat ID
6. Tell Scott your chat ID so he can update the n8n sync workflow

---

## Step 8: Create CLAUDE.md

Create `~/.claude/CLAUDE.md` with your preferences. Here's a starter template:

```markdown
# About Brett

## Background
- [Your role and background]
- Working with Scott on Bresco and Advosy projects

## Tech Stack
- **Database**: SurrealDB, SurrealQL
- **Frontend**: Nuxt UI v4
- **Automation**: n8n
- **AI Assistant**: Claude Code
- **Editor**: VS Code

## Preferences
- [Your preferences here]

## n8n Instances

| Instance | Owner | Purpose | URL |
|----------|-------|---------|-----|
| **Gary's (Advosy)** | Gary | Production Advosy workflows | https://events.advosy.app/ |
| **Brett's (Bresco)** | Brett | Bresco + Advosy prototypes | https://banc-r.app.n8n.cloud/ |

## Claude Code Sync (with Scott)
We keep our Claude Code configs in sync via a shared Notion database.

**Notion database:** "Claude Code Sync" in B/A Common (ID: `2e24b348-1256-81b1-8df5-e50612bf318d`)
**n8n workflow:** "Claude Code Sync Check" (ID: `edbmtcD9DljV9mPq`)
- Runs weekly on Sunday at 8PM Arizona time

**How to sync:** Run `/sync-config` to push your current config to Notion

## Telegram Notifications
**Bot:** @BrescoAlertsBot
**My chat ID:** [YOUR_CHAT_ID]

Use `/remind` to send reminders to Scott or yourself.
```

---

## Step 9: Sync to Notion

Run `/sync-config` to push Brett's config to the shared Notion database.

---

## Verification Checklist

- [ ] Plugins installed and enabled
- [ ] MCP servers added (n8n-mcp, notion, context7)
- [ ] Notion integration created and connected to B/A Common
- [ ] Skills copied (11 total)
- [ ] Agents copied (7 total)
- [ ] Rules copied (1 total)
- [ ] Commands copied (sync-config, remind)
- [ ] Telegram set up (@BrescoAlertsBot messaged)
- [ ] CLAUDE.md created
- [ ] `/sync-config` run successfully
- [ ] Notion shows Brett's config as "Current"

---

## Quick Copy Commands

If both machines are accessible, use these scp commands from Brett's machine:

```bash
# Copy skills
scp -r scott@scotts-machine:~/.claude/skills/* ~/.claude/skills/

# Copy agents
scp -r scott@scotts-machine:~/.claude/agents/* ~/.claude/agents/

# Copy rules
scp -r scott@scotts-machine:~/.claude/rules/* ~/.claude/rules/

# Copy commands
scp -r scott@scotts-machine:~/.claude/commands/* ~/.claude/commands/
```

Or use a shared folder, USB drive, or cloud storage to transfer the files.
