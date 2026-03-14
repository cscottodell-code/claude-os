---
name: scott:bypass
description: |
  Temporarily disable a guard hook, execute the blocked action, then re-enable.
  Use when a hook blocks an action that Scott has explicitly approved. Trigger
  when you see a "PreToolUse hook error" or "hook blocked" message, when Scott
  says "bypass the hook", "just do it", "override the guard", or when a git push,
  npm install, destructive command, or CLAUDE.md edit is blocked by a guard hook
  and Scott has given explicit permission to proceed.
user_invocable: true
invocation_hint: /scott:bypass - Temporarily bypass a guard hook to run a blocked action
---

# Bypass Guard Hook

When Scott says `/scott:bypass` or tells you to bypass a hook, follow these steps exactly:

## 1. Identify the blocked hook

Look at the most recent hook error in the conversation. It will look like:
```
PreToolUse:Bash hook error: [~/.claude/hooks/guard-XXXX.sh]: ...
```

Extract the hook path. If there's no recent hook error, ask Scott which action to bypass.

Known guard hooks:
| Hook | What it blocks |
|------|---------------|
| `guard-git-push.sh` | `git push` commands |
| `guard-destructive.sh` | `rm -rf`, `git reset --hard`, etc. |
| `guard-claude-md.sh` | Edits to CLAUDE.md or MEMORY.md |
| `guard-npm-install.sh` | `npm install` commands |

## 2. Confirm with Scott

Before bypassing, state: **"Bypassing [hook name] to [action]"**

Only proceed if Scott has clearly approved the action. If ambiguous, ask.

## 3. Execute the bypass

Run these three commands in sequence:
```bash
# Disable the hook
chmod -x [hook-path]

# Run the blocked command
[the exact command that was blocked]

# Re-enable the hook
chmod +x [hook-path]
```

**CRITICAL:** Always re-enable the hook, even if the command fails. If the command fails, still run `chmod +x` before reporting the error.

## 4. Confirm

Tell Scott: **"Done. [hook name] re-enabled."**
