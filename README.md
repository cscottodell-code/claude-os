# Scott's Toolkit v7

Claude Code config for Scott's machines. Hooks (safety), a small set of high-leverage skills, and light rules pointing at the LLM Wiki at `~/Scott/growth-os/`.

**Runtime:** Bun (TypeScript). All hooks and tools are `.ts` files.

Lives at `~/Scott/claude-os/` on all of Scott's machines. Deployed to `~/.claude/` via `setup.sh`.

## Two-system model

| System | Owns |
|---|---|
| **`scott-toolkit/`** | Claude Code config: hooks (safety), small set of skills, light rules pointing at the vault |
| **`scott-context/`** | The personal OS: identity, knowledge, daily notes, log, capture pipeline |

Plugins (Superpowers, Impeccable) are opportunistic — used skill-by-skill, not orchestrated. GSD was abandoned 2026-04-28 (v7 demolition).

## Quick Start

```bash
# Install Bun (required for v6+)
curl -fsSL https://bun.sh/install | bash

# Clone the repo
git clone git@github.com:cscottodell-code/scott-toolkit.git ~/Scott/scott-toolkit

# Install dev dependencies and deploy to ~/.claude/
cd ~/Scott/scott-toolkit && bun install && ./setup.sh
```

The setup script creates symlinks from `~/.claude/` to the repo. Update the repo once, every machine benefits after `git pull && ./setup.sh`.

## Commands

<!-- AUTO:commands -->
| Command | What it does |
|---------|-------------|
| `/advosy:context` | Get Advosy company context (leadership, subsidiaries, contacts) |
| `/advosy:claimsforce` | Get Claimsforce automation context (workflows, placeholders, webhooks) |
| `/advosy:crm` | CRM design system, mockup patterns, and page prototyping context |
| `/scott:debug` | Debug a problem with structured diagnosis |
| `/scott:learn` | Learning operations manager for Scott's Knowledge Engine |
| `/scott:new-feature` | Add a feature to the current project with guided workflow |
| `/scott:new-project` | Start a new project with the guided 8-phase workflow |
| `/scott:pause` | Generate a resume prompt for picking up later |
| `/scott:resume` | Pick up where you left off on a project |
| `/scott:surrealdb` | SurrealDB query patterns, schema design, AI agent architecture, and connection setup |
<!-- /AUTO:commands -->

## Decoupling

Abstract operation names (`tdd`, `code_review`, `git_worktree`, `resume`) map to concrete commands via `config/interfaces.json`. Toolkit files reference operations, not tool-specific commands. Renaming a command requires editing one line. Plugin IDs and MCP server registrations are cataloged in the same file.

## Repo Structure

```
scott-toolkit/
├── README.md
├── CHANGELOG.md
├── package.json                      # Bun project config (zero runtime deps)
├── setup.sh                          # One-command deploy to ~/.claude/
│
├── src/                              # Shared TypeScript utilities
│   ├── paths.ts                      # Path resolution (TOOLKIT_DIR, CLAUDE_DIR)
│   ├── json.ts                       # Safe JSON read/write
│   ├── semver.ts                     # Version parsing
│   └── exec.ts                       # Shell execution with timeout
│
├── hooks/                            # Claude Code hooks (-> ~/.claude/hooks/)
│   ├── lib/                          # Shared hook utilities
│   ├── guards/                       # PreToolUse guards
│   │   ├── claude-md.ts              # Block edits to CLAUDE.md/MEMORY.md
│   │   ├── destructive.ts            # Block rm -rf, reset --hard, etc
│   │   ├── npm-install.ts            # Gate dependency installs
│   │   ├── surrealdb-inject.ts       # Auto-load SurrealDB skill
│   │   ├── surrealdb-validate-write.ts
│   │   └── surrealdb-integration-tests.ts
│   ├── pretooluse-router.ts          # Main Bash command dispatcher
│   ├── session-start.ts, session-end.ts, pre-compact.ts
│   ├── pre-completion-checklist.ts, context-reminders.ts
│   └── auto-format.ts, check-file-test-trigger.ts, etc
│
├── tools/                            # CLI tools (-> ~/.claude/tools/)
│   ├── toolkit-sync.ts               # Auto-sync README from skill frontmatter
│   ├── toolkit-lint.ts               # Toolkit integrity checker
│   └── pre-commit-hook.ts            # Git pre-commit: sync -> lint
│
├── config/                           # Toolkit configuration
│   └── interfaces.json               # Abstract operations -> concrete commands
│
├── rules/                            # Behavior rules (-> ~/.claude/rules/)
│   ├── claude-behavior.md            # Slim Claude-Code-specific config
│   └── code-style.md                 # Code style guide
│
├── skills/                           # Skill files (-> ~/.claude/skills/, 12 skills)
│   ├── advosy-context, advosy-claimsforce, advosy-crm
│   ├── scott-debug, scott-learn, scott-pause, scott-resume
│   ├── scott-new-project, scott-new-feature
│   ├── scott-surrealdb (thin pointer at scott-context wiki)
│   └── scott-uiux
│
└── backups/                          # Settings snapshots (gitignored)
```

The vault that scott-context maintains (`~/Scott/growth-os/`) holds the durable layer: `wiki/identity.md`, knowledge, daily notes, logs.

## Multi-Machine Sync

```bash
git pull                              # Latest from GitHub
bun install                           # Dependency updates if package.json changed
./setup.sh                            # Re-deploy symlinks
```

## Contributing Rules

- Always update `CHANGELOG.md` when modifying hooks or skills
- Do not modify `~/.claude/settings.json` directly during a session (rule lives in `wiki/identity.md`)
- All new hooks and tools must be TypeScript
- Hooks import shared utilities from `hooks/lib/`, tools from `src/`
- Each skill lives in its own subfolder: `skills/<name>/SKILL.md`
- Run `bun run tools/toolkit-lint.ts` before committing (pre-commit hook enforces this)
- Identity and behavioral rules live in `~/Scott/growth-os/wiki/identity.md` (LLM-agnostic) — keep this README focused on Claude Code mechanics
