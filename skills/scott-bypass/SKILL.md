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
section: tools
---

# Bypass Guard Hook

When Scott says `/scott:bypass` or tells you to bypass a hook, follow these steps exactly:

## 1. Identify the blocked hook

Look at the most recent hook error in the conversation. It will look like:
```
PreToolUse hook error: guard blocked [guard-name]: ...
```

Extract the hook path. If there's no recent hook error, ask Scott which action to bypass.

Known guards (all routed through `pretooluse-router.ts`):
| Guard | What it blocks | Module |
|-------|---------------|--------|
| git-push | `git push` commands | `hooks/guards/git-push.ts` |
| destructive | `rm -rf`, `git reset --hard`, etc. | `hooks/guards/destructive.ts` |
| claude-md | Edits to CLAUDE.md or MEMORY.md | `hooks/guards/claude-md.ts` |
| npm-install | `npm/pnpm/bun install` commands | `hooks/guards/npm-install.ts` |
| phase-completion | GSD phase complete without closeout | `hooks/guards/phase-completion.ts` |
| workflow-gates | Workflow phase prerequisites | `hooks/guards/workflow-gates.ts` |

## 2. Confirm with Scott

Before bypassing, state: **"Bypassing [hook name] to [action]"**

Only proceed if Scott has clearly approved the action. If ambiguous, ask.

## 3. Execute the bypass

Since guards are TypeScript modules routed through `pretooluse-router.ts`,
bypass by temporarily renaming the guard file:

```bash
# Disable the guard
mv ~/.claude/hooks/guards/[guard-name].ts ~/.claude/hooks/guards/[guard-name].ts.disabled

# Run the blocked command
[the exact command that was blocked]

# Re-enable the guard
mv ~/.claude/hooks/guards/[guard-name].ts.disabled ~/.claude/hooks/guards/[guard-name].ts
```

**CRITICAL:** Always re-enable the guard, even if the command fails.

## 4. Confirm

Tell Scott: **"Done. [hook name] re-enabled."**
