# n8n Workflow Sync Rules

This file documents how to keep local files and n8n workflows in sync.

## Tools Needing Setup Sync

**Local file:** `~/.claude/tools-needing-setup.md`
**n8n workflow:** "AI Tools Setup Reminder" (ID: `qfK4jAbtbzWNRKg4`)

### When to sync:
- Adding a new tool that needs setup → Update BOTH local file AND n8n workflow
- Tool is fully working → Remove from BOTH places
- Changing tool details → Update BOTH places

### How to update n8n workflow:
Use `n8n_update_partial_workflow` with the workflow ID to update the reminder content.

### Workflow behavior:
- Sends email every Monday at 8AM Arizona time
- Recipient: cscottodell@gmail.com
- Lists all tools that still need setup

## Best Practices

1. **Always update both** - Never update just the local file or just the workflow
2. **Verify sync** - After updating, confirm both sources match
3. **Include dates** - Note when tools were added to track how long they've been pending
4. **Add context** - Include what setup step is needed, not just the tool name

## Example Update Flow

```
1. User installs new MCP tool (e.g., "Notion MCP")
2. Tool needs API key configuration
3. Add to ~/.claude/tools-needing-setup.md:
   - **Notion MCP** - Needs API key from Notion integrations page (added 2025-01-04)
4. Update n8n workflow with same info via n8n_update_partial_workflow
5. When setup complete: remove from both places, add to "Working Plugins" in CLAUDE.md
```
