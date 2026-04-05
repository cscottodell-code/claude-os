# Scott-Toolkit Architecture Guide (v6.0)

How the toolkit works, how to change it safely, and how everything connects.

---

## What This Toolkit Is

An AI orchestration layer for Claude Code. It automates session management, enforces code quality, captures lessons, and coordinates three external systems (GSD, Superpowers, Impeccable). Everything runs as Claude Code hooks, tools, and skills.

**Runtime:** Bun (TypeScript). All hooks and tools are `.ts` files executed via `bun run`.

**Deployment:** Symlinks from `~/.claude/` point back to the repo at `~/Sites/Global/scott-toolkit/`. One source of truth, one `git pull && ./setup.sh` to update.

---

## Directory Structure

```
scott-toolkit/
├── package.json                    # Bun project (no runtime deps, @types/bun for dev)
├── tsconfig.json                   # Strict TS, ES2022, bundler resolution
├── setup.sh                        # Bash deploy script (must work before Bun is verified)
│
├── src/                            # Shared TypeScript utilities (used by tools + hooks)
│   ├── paths.ts                    #   TOOLKIT_DIR, CLAUDE_DIR, toolkitPath(), claudePath(), sitesPath()
│   ├── json.ts                     #   readJson<T>(), writeJson(), readJsonOr<T>()
│   ├── semver.ts                   #   parseSemver(), compareSemver(), satisfies()
│   └── exec.ts                     #   exec(), execOk() — Bun.spawn wrapper with timeout
│
├── hooks/                          # Claude Code hooks (-> ~/.claude/hooks/)
│   ├── lib/                        #   Shared hook utilities
│   │   ├── stdin.ts                #     readStdin(), getFilePath(), getCommand(), stripQuoted()
│   │   └── platform.ts            #     shortHash(), fileMtime(), now(), dateStr(), daysBetween()
│   │
│   ├── guards/                     #   PreToolUse guard modules (imported by router)
│   │   ├── git-push.ts             #     Fail-closed: blocks git push
│   │   ├── destructive.ts          #     Blocks rm -rf, git reset --hard, etc.
│   │   ├── npm-install.ts          #     Blocks installs + stack-lock drift detection
│   │   ├── phase-completion.ts     #     Blocks phase complete without closeout marker
│   │   ├── claude-md.ts            #     Blocks CLAUDE.md/MEMORY.md edits (standalone, not in router)
│   │   └── surrealdb-inject.ts     #     Advisory: injects SurrealDB skill + health check
│   │
│   ├── pretooluse-router.ts        #   Main Bash PreToolUse dispatcher (reads stdin once, runs guards)
│   ├── session-start.ts            #   SessionStart: sync, log rotation, ACTIVE-PROJECTS, state detection
│   ├── session-end.ts              #   Stop: resume file reminder
│   ├── pre-compact.ts              #   PreCompact: context snapshot before compaction
│   ├── extract-instincts.ts        #   PreCompact+Stop: pattern capture prompt
│   ├── pre-completion-checklist.ts #   Stop: verification checklist
│   ├── auto-format.ts              #   PostToolUse Write|Edit: Prettier runner
│   ├── offload-large-output.ts     #   PostToolUse: large output overflow to file
│   ├── context-reminders.ts        #   PostToolUse: session duration + tool count tracking
│   ├── post-commit-triggers.ts     #   PostToolUse Bash: skill suggestions after commits
│   ├── version-propagate.ts        #   PostToolUse Write|Edit: CHANGELOG version propagation
│   ├── check-file-test-trigger.ts  #   PostToolUse Edit|Write: auto-test check files
│   ├── uiux-reminder.ts            #   PostToolUse Edit|Write: .vue file audit nudge
│   └── toolkit-coherence-check.ts  #   PostToolUse Edit|Write: cross-reference validation
│
├── tools/                          # CLI tools (-> ~/.claude/tools/)
│   ├── stack-detect.ts             #   Detect technologies from package.json
│   ├── stack-check.ts              #   Run static checks from check files
│   ├── stack-preflight.ts          #   System readiness verification
│   ├── stack-metrics.ts            #   Aggregate audit data for learning loop
│   ├── toolkit-lint.ts             #   Comprehensive toolkit integrity checker
│   └── pre-commit-hook.ts          #   Git pre-commit gate (runs toolkit-lint)
│
├── checks/                         # Stack enforcement check files (-> ~/.claude/checks/)
│   ├── surrealdb.json, nuxt.json, tailwind.json, bun.json, hono.json
│   ├── stack-lock.schema.json      #   JSON Schema for project stack-lock.json
│   └── fixtures/                   #   Test fixtures for check validation
│
├── config/                         # Configuration (-> ~/.claude/config/)
│   ├── interfaces.json             #   Abstract operations -> concrete commands + plugin catalog
│   └── version-manifest.json       #   Version tracking + banned patterns
│
├── rules/                          # Behavior rules (-> ~/.claude/rules/)
│   ├── claude-behavior.md          #   3-system delegation, operation resolution, verification
│   └── code-style.md              #   TypeScript/Vue/Tailwind coding standards
│
├── skills/                         # Skill files (-> ~/.claude/skills/)
│   └── [30+ skill directories, each with SKILL.md]
│
├── workflows/                      # Interactive step-by-step processes
│   └── [12 workflow .md files]
│
├── context/                        # Templates for new projects
├── references/                     # Business context (loaded on demand)
├── docs/                           # Design documents and guides
├── errors/                         # Error logs (toolkit mistakes)
├── successes/                      # Success logs (toolkit wins)
└── retros/                         # Retrospective outputs
```

---

## How Hooks Work

Claude Code hooks are shell commands that run at specific lifecycle points. The toolkit registers them in `~/.claude/settings.json` under the `hooks` key.

### Hook Lifecycle

```
Session starts
  -> SessionStart hooks fire (session-start.ts)

User asks Claude to do something
  -> PreToolUse hooks fire BEFORE the tool runs
     -> Bash commands: pretooluse-router.ts dispatches to guards
     -> Edit|Write: guards/claude-md.ts checks for protected files
  -> Tool runs
  -> PostToolUse hooks fire AFTER the tool runs
     -> context-reminders.ts, auto-format.ts, etc.

Context window fills up
  -> PreCompact hooks fire (pre-compact.ts, extract-instincts.ts)

Session ends
  -> Stop hooks fire (pre-completion-checklist.ts, session-end.ts, extract-instincts.ts)
```

### Hook Contracts

All hooks follow these rules:
- **Stdin:** Receive JSON describing the tool invocation (parsed via `hooks/lib/stdin.ts`)
- **Exit 0:** Hook completed, action allowed
- **Exit 2:** Hook is blocking the action (guards only)
- **Stdout:** Messages displayed to Claude (and the user)
- **Non-blocking hooks** (PostToolUse, Stop, etc.) always exit 0
- **Guards** (PreToolUse) exit 2 to block, 0 to allow

### The PreToolUse Router

`pretooluse-router.ts` is the single entry point for Bash commands. It:
1. Reads stdin once (not 6 times like the old subprocess model)
2. Logs the command to `~/.claude/bash-commands.log`
3. Runs guards in order: git push -> destructive -> npm install -> phase completion -> git commit (GSD) -> SurrealDB (advisory)
4. Each guard is a pure function imported from `hooks/guards/`
5. GSD's validate-commit is called via `Bun.spawn()` to preserve GSD ownership

**Security model:** Guards fail closed by default. If stdin can't be parsed, the guard blocks.

---

## How Tools Work

Tools are TypeScript scripts run via `bun run`. They're deployed as symlinks from `~/.claude/tools/` to the repo.

| Tool | Purpose | Usage |
|------|---------|-------|
| `stack-detect.ts` | Detect technologies from package.json | `bun run tools/stack-detect.ts <project-path>` |
| `stack-check.ts` | Run static checks against project | `bun run tools/stack-check.ts <project-path>` |
| `stack-preflight.ts` | Verify system readiness | `bun run tools/stack-preflight.ts <project-path>` |
| `stack-metrics.ts` | Aggregate audit data | `bun run tools/stack-metrics.ts` |
| `toolkit-lint.ts` | Toolkit integrity checker | `bun run tools/toolkit-lint.ts [--section=X] [--fix]` |
| `toolkit-sync.ts` | Auto-sync docs from skill frontmatter | `bun run tools/toolkit-sync.ts [--check]` |
| `toolkit-graph.ts` | Dependency graph (JSON-backed) | `bun run tools/toolkit-graph.ts rebuild\|impact\|check\|stats` |
| `pre-commit-hook.ts` | Git pre-commit: sync -> lint -> graph | Runs automatically on `git commit` |

All tools import from `src/` for shared utilities (JSON parsing, path resolution, exec).

---

## How to Change Things Safely

### Adding a New Hook

1. Create `hooks/my-hook.ts` using the standard pattern:
   ```typescript
   #!/usr/bin/env bun
   import { readStdin, getFilePath } from "./lib/stdin.js";
   // ... your logic
   process.exit(0);
   ```
2. Register it in `~/.claude/settings.json` under the appropriate lifecycle event
3. Run `./setup.sh` to deploy the symlink
4. Run `bun run tools/toolkit-lint.ts` to verify registration
5. Commit both the hook file and the updated settings backup

### Adding a New Guard

1. Create `hooks/guards/my-guard.ts` exporting a function:
   ```typescript
   import type { GuardResult } from "./git-push.js";
   export function guardMyThing(command: string): GuardResult {
     // return { allow: false, message: "..." } to block
     return { allow: true };
   }
   ```
2. Import and call it from `hooks/pretooluse-router.ts` in the correct position
3. No settings.json change needed (the router is already registered)

### Adding a New Tool

1. Create `tools/my-tool.ts` importing from `../src/` as needed
2. Run `./setup.sh` to deploy the symlink
3. Add a script entry to `package.json` for convenience

### Adding a New Check File

1. Create `checks/my-tech.json` following the schema in existing files (see `nuxt.json` for reference)
2. Create test fixtures in `checks/fixtures/my-tech/{good,bad}/`
3. The check is automatically picked up by `stack-check.ts` for projects with that technology in their `stack-lock.json`

### Modifying settings.json

- **Never edit `~/.claude/settings.json` directly** during a session (Claude Code reads it live)
- Use the `update-config` skill, or edit between sessions
- Always backup first: `cp ~/.claude/settings.json backups/`
- After editing, run `toolkit-lint.ts` to verify consistency

### Modifying a Skill

1. Edit `skills/<name>/SKILL.md`
2. Keep SKILL.md under 200 lines (move heavy content to `skills/<name>/references/`)
3. Commit the change (the pre-commit hook runs toolkit-lint)

### Modifying a Workflow

1. Edit `workflows/<name>.md`
2. Phases tagged `[STOP]` pause for user input, `[AUTO]` proceed immediately
3. If the workflow generates a skill stub, check that `setup.sh` handles it correctly

---

## How Deployment Works

`setup.sh` creates symlinks from `~/.claude/` back to the repo:

```
~/.claude/hooks/pretooluse-router.ts  ->  ~/Sites/Global/scott-toolkit/hooks/pretooluse-router.ts
~/.claude/hooks/guards/git-push.ts    ->  ~/Sites/Global/scott-toolkit/hooks/guards/git-push.ts
~/.claude/hooks/lib/stdin.ts          ->  ~/Sites/Global/scott-toolkit/hooks/lib/stdin.ts
~/.claude/tools/toolkit-lint.ts       ->  ~/Sites/Global/scott-toolkit/tools/toolkit-lint.ts
~/.claude/rules/claude-behavior.md    ->  ~/Sites/Global/scott-toolkit/rules/claude-behavior.md
~/.claude/skills/scott-surrealdb/     ->  ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/
```

This means:
- Edit files in the repo, they take effect immediately (symlinks resolve live)
- `git pull && ./setup.sh` updates everything
- `setup.sh` stays bash because it must run before Bun is available
- `setup.sh --verify-only` checks all symlinks without modifying anything

---

## Dependency Graph (JSON)

The toolkit tracks all file relationships in `config/toolkit-graph.json`. This answers the question: "If I change file X, what else needs updating?"

**No external dependencies.** The graph is a JSON file rebuilt automatically by the pre-commit hook.

### Three data arrays:
- **`files`** — every toolkit file with path, type, content hash
- **`references`** — directed edges: "file A references file B" (imports, doc mentions, settings commands)
- **`settingsEntries`** — hook registrations from settings.json

### Usage:

```bash
# Rebuild the full graph (after major changes or first-time setup)
bun run tools/toolkit-graph.ts rebuild

# Before changing a file: see what would be affected
bun run tools/toolkit-graph.ts impact hooks/pretooluse-router.ts

# After changes: verify graph matches disk
bun run tools/toolkit-graph.ts check

# Dashboard
bun run tools/toolkit-graph.ts stats
```

### Impact analysis output:

```
Impact analysis for: hooks/pretooluse-router.ts

Files that REFERENCE this file (6):
  [settings_command] docs/architecture.md:228
  [doc_mention] README.md:45
  ...

Files this file DEPENDS ON (6):
  [import] hooks/guards/git-push.ts
  [import] hooks/lib/stdin.ts
  ...

Settings.json registration:
  PreToolUse (Bash): bun run $HOME/.claude/hooks/pretooluse-router.ts
```

### When to rebuild:
- After adding/removing/renaming files
- After merging branches with structural changes
- If `toolkit-graph.ts check` reports inconsistencies
- The graph auto-rebuilds on every commit (pre-commit hook runs sync -> lint -> graph)

---

## How Quality Is Enforced

### Pre-Commit Gate

Every `git commit` in the toolkit repo runs `toolkit-lint.ts` via the pre-commit hook. It checks:
1. **Stale patterns:** Banned strings from `version-manifest.json` (e.g., old file references)
2. **Skill integrity:** Every skill directory has SKILL.md, no orphaned symlinks
3. **Hook integrity:** Every hook on disk is registered in settings.json, no dangling symlinks

### Stack Enforcement (in projects)

Projects with `stack-lock.json` get technology-specific static checks during phase closeout:
- `stack-check.ts` reads check files from `checks/` and greps project files for anti-patterns
- `stack-preflight.ts` verifies CLI tools, database connectivity, SDK versions
- `stack-metrics.ts` aggregates results across all projects for the learning loop

### Phase Closeout Gate

The `guard-phase-completion.ts` guard blocks GSD `phase complete` commands unless `/scott:phase-closeout` has been run (checks for `.post-execution-complete` marker file).

---

## Key Design Principles

1. **Toolkit is the source of truth.** `~/.claude/` contains only symlinks back to the repo. Never edit deployed files directly.

2. **Guards fail closed.** If a guard can't determine whether an action is safe, it blocks. False positives are annoying but safe; false negatives are dangerous.

3. **Hooks are stateless between sessions.** Temporary state uses `/tmp/` files. Persistent state lives in the repo (`config/`, `checks/metrics.json`).

4. **Operations are decoupled.** Workflows reference abstract operation names (`plan_phase`, `tdd`). These resolve via `config/interfaces.json` to concrete commands. Renaming a command updates one file.

5. **The learning loop is human-gated.** Lessons tag themselves with `[stack:tech]`. Promotion to check files requires Scott's review via `/scott:stack-review`.

6. **GSD-owned hooks are not touched.** Files starting with `gsd-` (`.js` files) are owned by the GSD plugin. The toolkit router calls `gsd-validate-commit.sh` via `Bun.spawn()` to preserve this boundary.

---

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Bun** | 1.x+ | Runtime for all .ts hooks and tools |
| **Git** | Any | Version control, pre-commit hooks |
| **Python 3** | Any | Used only by `setup.sh` for symlink resolution |
| **Claude Code** | Latest | The host environment |

Install Bun: `curl -fsSL https://bun.sh/install | bash`

---

## Troubleshooting

### "Hook error" on tool use
The hook is crashing. Check:
1. Does the hook file exist? `ls -la ~/.claude/hooks/<name>.ts`
2. Is it a valid symlink? `readlink ~/.claude/hooks/<name>.ts`
3. Does `bun run` work? `bun run ~/.claude/hooks/<name>.ts`
4. Check `bun` is installed: `bun --version`

### "Commit blocked: toolkit-lint found issues"
The pre-commit hook found problems. Run `bun run tools/toolkit-lint.ts` to see details. Common causes:
- A hook on disk isn't registered in settings.json
- A dangling symlink in `~/.claude/hooks/`
- A banned pattern from `version-manifest.json` found in a .md file

### Toolkit seems broken after update
1. Run `./verify-toolkit.sh` for a full health check
2. If bad: `./restore-v5.3.sh` to roll back to the pre-audit snapshot
3. If partial: `./setup.sh` to re-deploy all symlinks

### Hook doesn't fire
1. Check it's registered in `~/.claude/settings.json` (correct lifecycle event and matcher)
2. Check the symlink exists: `ls -la ~/.claude/hooks/<name>.ts`
3. Check it runs: `echo '{}' | bun run hooks/<name>.ts`

---

## Version History

| Version | Date | Highlights |
|---------|------|-----------|
| v5.3 | Pre-2026-04-05 | Last all-bash version |
| v5.3.1 | 2026-04-05 | 4 critical bash hotfixes (fail-closed guard, macOS hash, injection, sed) |
| v6.0 | 2026-04-05 | Full Bun/TypeScript rewrite: 6 tools, 20 hooks, router consolidation |
