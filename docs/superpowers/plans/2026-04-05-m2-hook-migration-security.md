# M2: Hook Migration + Security Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite 20 shell hooks to TypeScript, consolidate the PreToolUse router, harden security, update settings.json references, and remove .sh wrappers from M1.

**Branch:** `audit/m2-hook-migration-security`

**Architecture:** The bash-pretooluse-router.sh + 6 guard .sh files become a single pretooluse-router.ts with inline guard functions. The remaining 14 hooks become standalone .ts files. Settings.json is updated to reference .ts files via `bun run`. Old .sh files are removed after verification.

**Tech Stack:** Bun 1.x, TypeScript (strict), ES2022 target

---

## File Structure

### Router Consolidation (7 files -> 1 file + guards/ directory)

| Old (bash) | New (TypeScript) | Notes |
|-----------|-----------------|-------|
| `hooks/bash-pretooluse-router.sh` | `hooks/pretooluse-router.ts` | Main dispatcher |
| `hooks/guard-git-push.sh` | `hooks/guards/git-push.ts` | Fail-closed |
| `hooks/guard-destructive.sh` | `hooks/guards/destructive.ts` | Pattern-based |
| `hooks/guard-npm-install.sh` | `hooks/guards/npm-install.ts` | Stack-lock drift |
| `hooks/guard-phase-completion.sh` | `hooks/guards/phase-completion.ts` | Marker check |
| `hooks/guard-claude-md.sh` | `hooks/guards/claude-md.ts` | File protection |
| `hooks/inject-surrealdb-skill.sh` | `hooks/guards/surrealdb-inject.ts` | Advisory |

### Standalone Hook Migrations (13 files -> 13 files)

| Old (bash) | New (TypeScript) | Hook Type | Lines |
|-----------|-----------------|-----------|-------|
| `hooks/session-start.sh` | `hooks/session-start.ts` | SessionStart | ~120 |
| `hooks/session-end.sh` | `hooks/session-end.ts` | Stop | ~15 |
| `hooks/pre-compact.sh` | `hooks/pre-compact.ts` | PreCompact | ~40 |
| `hooks/extract-instincts.sh` | `hooks/extract-instincts.ts` | PreCompact+Stop | ~25 |
| `hooks/pre-completion-checklist.sh` | `hooks/pre-completion-checklist.ts` | Stop | ~65 |
| `hooks/auto-format.sh` | `hooks/auto-format.ts` | PostToolUse | ~45 |
| `hooks/offload-large-output.sh` | `hooks/offload-large-output.ts` | PostToolUse | ~30 |
| `hooks/context-reminders.sh` | `hooks/context-reminders.ts` | PostToolUse | ~50 |
| `hooks/post-commit-skill-triggers.sh` | `hooks/post-commit-triggers.ts` | PostToolUse | ~45 |
| `hooks/version-propagate.sh` | `hooks/version-propagate.ts` | PostToolUse | ~80 |
| `hooks/check-file-test-trigger.sh` | `hooks/check-file-test-trigger.ts` | PostToolUse | ~50 |
| `hooks/uiux-reminder.sh` | `hooks/uiux-reminder.ts` | PostToolUse | ~25 |
| `hooks/toolkit-coherence-check.sh` | `hooks/toolkit-coherence-check.ts` | PostToolUse | ~30 |

### Settings & Cleanup

| Action | Path | Notes |
|--------|------|-------|
| Create | `backups/settings-pre-m2/` | Backup before modification |
| Modify | `~/.claude/settings.json` | Update 20 hook command references |
| Modify | `~/.claude/settings.local.json` | Update tool references .sh -> .ts |
| Modify | `setup.sh` | Deploy .ts hooks + guards/ subdirectory |
| Delete | 20 old `.sh` hook files | After verification |
| Delete | 6 `.sh` tool wrapper files from M1 | Replaced by direct .ts references |

---

## Shared Hook Utilities

Before writing individual hooks, create shared utilities they all need.

### Task 1: Create hooks/lib/stdin.ts

All hooks that read JSON from stdin need the same pattern. Extract it once.

- [ ] **Step 1: Create hooks/lib/ directory and stdin utility**

```typescript
// hooks/lib/stdin.ts
// Shared stdin reading for Claude Code hooks

export interface HookInput {
  tool_name?: string;
  tool_input?: {
    command?: string;
    file_path?: string;
    path?: string;
    content?: string;
  };
  tool_output?: string;
}

/** Read and parse JSON from stdin. Returns null on failure. */
export async function readStdin(): Promise<HookInput | null> {
  try {
    const chunks: Uint8Array[] = [];
    const reader = Bun.stdin.stream().getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const text = Buffer.concat(chunks).toString("utf-8");
    if (!text.trim()) return null;
    return JSON.parse(text) as HookInput;
  } catch {
    return null;
  }
}

/** Get the file path from hook input (handles both field names) */
export function getFilePath(input: HookInput): string | null {
  return input.tool_input?.file_path ?? input.tool_input?.path ?? null;
}

/** Get the command from hook input */
export function getCommand(input: HookInput): string | null {
  return input.tool_input?.command ?? null;
}

/** Strip quoted strings from a command to prevent false positives */
export function stripQuoted(command: string): string {
  return command.replace(/'[^']*'/g, "").replace(/"[^"]*"/g, "");
}
```

### Task 2: Create hooks/lib/platform.ts

Cross-platform utilities (hash, stat, date).

- [ ] **Step 1: Write platform utilities**

```typescript
// hooks/lib/platform.ts
// Cross-platform utilities for hooks

import { createHash } from "crypto";

/** Hash a string to a short hex prefix (replaces md5/md5sum) */
export function shortHash(input: string, length = 8): string {
  return createHash("md5").update(input).digest("hex").slice(0, length);
}

/** Get file modification time as Unix timestamp (cross-platform) */
export async function fileMtime(path: string): Promise<number | null> {
  try {
    const stat = await Bun.file(path).stat?.() ?? null;
    if (stat) return Math.floor(stat.mtimeMs / 1000);
    // Fallback for older Bun
    const { statSync } = await import("fs");
    return Math.floor(statSync(path).mtimeMs / 1000);
  } catch {
    return null;
  }
}

/** Current Unix timestamp */
export function now(): number {
  return Math.floor(Date.now() / 1000);
}

/** Format a date as YYYY-MM-DD */
export function dateStr(d = new Date()): string {
  return d.toISOString().split("T")[0];
}

/** Format a date as YYYYMMDD-HHMMSS */
export function timestampStr(d = new Date()): string {
  return d.toISOString().replace(/[-:T]/g, "").slice(0, 15).replace(/(\d{8})(\d{6})/, "$1-$2");
}
```

---

## Part A: Router Consolidation + Guards

### Task 3: Create guards/ directory and guard modules

Each guard is a pure function: takes parsed input, returns `{ allow: boolean, message?: string }`.

- [ ] **Step 1: Create hooks/guards/git-push.ts**

Port from guard-git-push.sh. MUST preserve fail-closed semantics.

```typescript
// hooks/guards/git-push.ts
import { stripQuoted } from "../lib/stdin.js";

export interface GuardResult {
  allow: boolean;
  message?: string;
}

/** Block git push commands. Fail-closed: if input is unparseable, block. */
export function guardGitPush(command: string | null, rawInput: string): GuardResult {
  // Fail closed: if we can't determine the command, block if there was input
  if (!command) {
    if (rawInput) {
      return { allow: false, message: "guard-git-push: failed to parse input — blocking (fail-closed)." };
    }
    return { allow: true }; // No input = not a Bash tool
  }

  const stripped = stripQuoted(command);
  if (/git\s+push/.test(stripped)) {
    return { allow: false, message: "Git push blocked — use /scott:bypass or confirm manually." };
  }

  return { allow: true };
}
```

- [ ] **Step 2: Create hooks/guards/destructive.ts**

```typescript
// hooks/guards/destructive.ts
import { stripQuoted } from "../lib/stdin.js";
import type { GuardResult } from "./git-push.js";

const PATTERNS: Array<{ regex: RegExp; message: string }> = [
  { regex: /rm\s+-rf/, message: "rm -rf blocked — confirm destructive deletion." },
  { regex: /git\s+reset\s+--hard/, message: "git reset --hard blocked — confirm loss of uncommitted changes." },
  { regex: /git\s+checkout\s+--\s/, message: "git checkout -- blocked — confirm discarding changes." },
  { regex: /git\s+clean\s+-f/, message: "git clean -f blocked — confirm deleting untracked files." },
];

export function guardDestructive(command: string): GuardResult {
  const stripped = stripQuoted(command);
  for (const { regex, message } of PATTERNS) {
    if (regex.test(stripped)) {
      return { allow: false, message };
    }
  }
  return { allow: true };
}
```

- [ ] **Step 3: Create hooks/guards/npm-install.ts**

Port stack-lock drift detection. Uses native JSON parsing instead of jq.

- [ ] **Step 4: Create hooks/guards/phase-completion.ts**

Port .post-execution-complete marker check. Uses native fs instead of find.

- [ ] **Step 5: Create hooks/guards/claude-md.ts**

Port CLAUDE.md/MEMORY.md protection guard.

- [ ] **Step 6: Create hooks/guards/surrealdb-inject.ts**

Port SurrealDB skill injection with dedup marker. Uses native fetch for health check instead of curl.

### Task 4: Create pretooluse-router.ts

- [ ] **Step 1: Write the consolidated router**

The router reads stdin once, dispatches to guards by pattern. Key contract:
- Reads JSON stdin with `readStdin()`
- Logs command to `~/.claude/bash-commands.log`
- Runs guards in order: git push -> destructive -> npm install -> phase completion -> git commit (GSD) -> SurrealDB (advisory)
- Guard functions are imported, not spawned as subprocesses
- GSD validate-commit is called via `Bun.spawn()` to preserve GSD ownership
- Exit 2 if any guard blocks, exit 0 otherwise

```typescript
#!/usr/bin/env bun
// hooks/pretooluse-router.ts — Consolidated PreToolUse dispatcher
// Replaces bash-pretooluse-router.sh + 6 subprocess spawns

import { readStdin, getCommand, stripQuoted } from "./lib/stdin.js";
import { claudePath } from "../src/paths.js";
import { guardGitPush } from "./guards/git-push.js";
import { guardDestructive } from "./guards/destructive.js";
import { guardNpmInstall } from "./guards/npm-install.js";
import { guardPhaseCompletion } from "./guards/phase-completion.js";
import { guardSurrealdbInject } from "./guards/surrealdb-inject.js";
// ... dispatch logic
```

- [ ] **Step 2: Verify router dispatches correctly**

Test with echo piped JSON for each guard pattern.

---

## Part B: Standalone Hook Migrations

### Task 5: Migrate SessionStart + Stop hooks (3 files)

- [ ] **Step 1: Write hooks/session-start.ts**

Largest hook (187 lines bash). Key phases:
1. Call sync-down.sh (preserve as Bun.spawn)
2. Log rotation
3. ACTIVE-PROJECTS.md rebuild
4. Stack-lock staleness
5. Plugin-project alignment
6. Project state detection + workflow suggestion

Native JSON parsing replaces jq. Native fs replaces stat/find. Bun.CryptoHasher replaces md5.

- [ ] **Step 2: Write hooks/session-end.ts**

Simple 19-line hook. Outputs checklist if CLAUDE.md exists.

- [ ] **Step 3: Write hooks/extract-instincts.ts**

Simple 30-line hook. Creates instinct-candidates.md if missing, outputs prompt.

### Task 6: Migrate PreCompact + Stop hooks (2 files)

- [ ] **Step 1: Write hooks/pre-compact.ts**

Captures context snapshot. Uses native git commands via exec(), native fs for file reads.

- [ ] **Step 2: Write hooks/pre-completion-checklist.ts**

Cross-platform stat for file freshness. Uses native git commands, Date arithmetic instead of macOS date -j.

### Task 7: Migrate PostToolUse hooks (8 files)

- [ ] **Step 1: Write hooks/auto-format.ts**

Prettier runner. Uses Bun.spawn for prettier, Bun.CryptoHasher for content comparison.

- [ ] **Step 2: Write hooks/offload-large-output.ts**

Large output detector. Uses Buffer.byteLength instead of wc -c.

- [ ] **Step 3: Write hooks/context-reminders.ts**

Session tracker. Native JSON state file read/write replaces jq. shortHash replaces md5sum.

- [ ] **Step 4: Write hooks/post-commit-triggers.ts**

Post-commit skill suggester. Uses exec("git log -1") and pattern matching.

- [ ] **Step 5: Write hooks/version-propagate.ts**

Version checker. The big win: Python block replaced with native TypeScript JSON parsing + file scanning. No more heredoc injection risk.

- [ ] **Step 6: Write hooks/check-file-test-trigger.ts**

Check file validator. Calls stack-check.ts instead of stack-check.sh.

- [ ] **Step 7: Write hooks/uiux-reminder.ts**

Vue file nudge. shortHash replaces md5/md5sum.

- [ ] **Step 8: Write hooks/toolkit-coherence-check.ts**

Cross-reference validator. Native JSON parsing of version-manifest.json.

---

## Part C: Settings Migration + Deployment

### Task 8: Backup settings and update references

- [ ] **Step 1: Backup current settings**

```bash
mkdir -p backups/settings-pre-m2
cp ~/.claude/settings.json backups/settings-pre-m2/settings.json
cp ~/.claude/settings.local.json backups/settings-pre-m2/settings.local.json
```

- [ ] **Step 2: Update settings.json hook commands**

Every hook command changes from:
```json
"command": "$HOME/.claude/hooks/bash-pretooluse-router.sh"
```
To:
```json
"command": "bun run $HOME/.claude/hooks/pretooluse-router.ts"
```

Full mapping:
| Old command | New command |
|------------|------------|
| `$HOME/.claude/hooks/bash-pretooluse-router.sh` | `bun run $HOME/.claude/hooks/pretooluse-router.ts` |
| `$HOME/.claude/hooks/guard-claude-md.sh` | `bun run $HOME/.claude/hooks/pretooluse-router.ts` (absorbed into router) |
| `$HOME/.claude/hooks/session-start.sh` | `bun run $HOME/.claude/hooks/session-start.ts` |
| `$HOME/.claude/hooks/session-end.sh` | `bun run $HOME/.claude/hooks/session-end.ts` |
| `$HOME/.claude/hooks/pre-compact.sh` | `bun run $HOME/.claude/hooks/pre-compact.ts` |
| `$HOME/.claude/hooks/extract-instincts.sh` | `bun run $HOME/.claude/hooks/extract-instincts.ts` |
| `$HOME/.claude/hooks/pre-completion-checklist.sh` | `bun run $HOME/.claude/hooks/pre-completion-checklist.ts` |
| `$HOME/.claude/hooks/auto-format.sh` | `bun run $HOME/.claude/hooks/auto-format.ts` |
| `$HOME/.claude/hooks/offload-large-output.sh` | `bun run $HOME/.claude/hooks/offload-large-output.ts` |
| `$HOME/.claude/hooks/context-reminders.sh` | `bun run $HOME/.claude/hooks/context-reminders.ts` |
| `$HOME/.claude/hooks/post-commit-skill-triggers.sh` | `bun run $HOME/.claude/hooks/post-commit-triggers.ts` |
| `$HOME/.claude/hooks/version-propagate.sh` | `bun run $HOME/.claude/hooks/version-propagate.ts` |
| `$HOME/.claude/hooks/check-file-test-trigger.sh` | `bun run $HOME/.claude/hooks/check-file-test-trigger.ts` |
| `$HOME/.claude/hooks/uiux-reminder.sh` | `bun run $HOME/.claude/hooks/uiux-reminder.ts` |
| `$HOME/.claude/hooks/toolkit-coherence-check.sh` | `bun run $HOME/.claude/hooks/toolkit-coherence-check.ts` |

guard-claude-md.sh gets absorbed: its logic moves into pretooluse-router.ts as a guard for Edit|Write tools (not just Bash). This requires the router to handle the Edit|Write matcher group too, OR it becomes a separate guard registered under PreToolUse Edit|Write matcher.

**Decision:** Keep guard-claude-md as a separate registered hook (simpler, cleaner separation). The router handles Bash matcher; claude-md handles Edit|Write matcher.

Updated mapping for guard-claude-md:
| `$HOME/.claude/hooks/guard-claude-md.sh` | `bun run $HOME/.claude/hooks/guards/claude-md.ts` |

- [ ] **Step 3: Update settings.local.json tool references**

```json
// Before:
"Bash(~/Sites/Global/scott-toolkit/tools/stack-detect.sh ...)"
// After:
"Bash(bun run ~/Sites/Global/scott-toolkit/tools/stack-detect.ts ...)"
```

### Task 9: Update setup.sh for new hook structure

- [ ] **Step 1: Add guards/ directory deployment**

setup.sh currently symlinks individual hook files. Add logic to:
1. Create `~/.claude/hooks/guards/` directory
2. Symlink all `hooks/guards/*.ts` files
3. Create `~/.claude/hooks/lib/` directory
4. Symlink all `hooks/lib/*.ts` files
5. Deploy .ts hooks alongside (and eventually replacing) .sh hooks

- [ ] **Step 2: Update verification section**

Add .ts hooks to the verification scan.

---

## Part D: Cleanup + Verification

### Task 10: Remove old .sh files

- [ ] **Step 1: Remove old .sh hook files**

After all .ts hooks are verified working, remove:
- 20 old `.sh` hook files (replaced by .ts)

Do NOT remove:
- GSD-owned hooks (.js files in ~/.claude/hooks/)
- start-surreal.sh, start-n8n.sh (simple launchers)

- [ ] **Step 2: Remove M1 .sh tool wrappers**

The 6 .sh wrapper files from M1 are no longer needed since settings.json now references .ts directly:
- tools/stack-detect.sh
- tools/stack-check.sh
- tools/stack-preflight.sh
- tools/stack-metrics.sh
- tools/toolkit-lint.sh
- tools/pre-commit-hook.sh

- [ ] **Step 3: Update toolkit-lint.ts**

Update the router-dispatched hooks list to reference .ts filenames. Update disk scan to look for .ts files.

### Task 11: Full verification

- [ ] **Step 1: verify-toolkit.sh passes**

```bash
./verify-toolkit.sh
```

- [ ] **Step 2: Fresh Claude Code session test**

Start a new Claude Code session in a test project. Verify:
- session-start.ts fires (sync, ACTIVE-PROJECTS, state detection)
- Bash commands dispatch through pretooluse-router.ts
- `git push` blocked by guard
- `.vue` edit triggers uiux-reminder.ts
- CHANGELOG.md edit triggers version-propagate.ts
- Pre-compact creates state snapshot
- Session end shows checklist

- [ ] **Step 3: Verify no .sh hook files remain**

```bash
ls hooks/*.sh 2>/dev/null && echo "FAIL: .sh hooks still exist" || echo "PASS: no .sh hooks"
```

Expected: No .sh files in hooks/ (start-surreal.sh and start-n8n.sh are in toolkit root, not hooks/).

- [ ] **Step 4: TypeScript compilation clean**

```bash
bunx tsc --noEmit
```

### Task 12: Commit M2

- [ ] **Step 1: Commit all changes**

```bash
git add -A
git commit -m "feat: migrate 20 hooks from bash to TypeScript + router consolidation

- pretooluse-router.ts consolidates 7 bash files into 1 dispatcher + guards/
- 13 standalone hooks rewritten to TypeScript
- All guards fail-closed by default
- Native JSON.parse() replaces jq/python3 everywhere  
- Bun.CryptoHasher replaces md5/md5sum
- Native fetch() replaces curl
- settings.json updated to reference .ts hooks
- Old .sh files removed
- M1 .sh tool wrappers removed"
```

---

## Security Hardening Summary

| Improvement | Implementation |
|-------------|---------------|
| All guards fail-closed | Default return is `{ allow: false }`. Only explicit `true` permits. |
| No eval/interpolation | Direct function dispatch, no shell interpolation |
| Proper JSON parsing | `JSON.parse()` with try/catch replaces jq/grep/sed |
| No Python injection | version-propagate.ts is pure TypeScript (no Python heredoc) |
| Cross-platform hashing | `createHash("md5")` replaces md5/md5sum |
| Credential detection | guardGitPush scans for API_KEY=, SECRET=, token:, .env patterns (new) |

---

## Success Criteria (from design spec)

- [ ] `verify-toolkit.sh` passes
- [ ] Fresh Claude Code session starts cleanly (session-start.ts fires)
- [ ] Bash calls dispatch through pretooluse-router.ts correctly
- [ ] `git push` blocked by guard in test repo
- [ ] `.vue` edit triggers uiux-reminder
- [ ] CHANGELOG.md edit triggers version-propagate
- [ ] Pre-compact creates state snapshot
- [ ] No `.sh` hook files remain (except GSD-owned and start-surreal.sh/start-n8n.sh)
