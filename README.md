# Scott's Toolkit v6.1

A context engineering toolkit for building apps with Claude Code. Owns session management, templates, domain knowledge, stack enforcement, plugin awareness, and learning capture. Delegates project management to GSD and development methodology to Superpowers.

**Runtime:** Bun (TypeScript). All hooks and tools are `.ts` files.

Lives at `~/Sites/Global/scott-toolkit/` on all of Scott's machines. Deployed to `~/.claude/` via `setup.sh`.

## Who It's For

- **Scott O'Dell** — AI orchestrator building prototypes with Claude Code (MacBook Air + Mac Studio)

## Quick Start

```bash
# Install Bun (required for v6.0+)
curl -fsSL https://bun.sh/install | bash

# Clone the repo
git clone git@github.com:cscottodell-code/scott-toolkit.git ~/Sites/Global/scott-toolkit

# Install dev dependencies and deploy to ~/.claude/
cd ~/Sites/Global/scott-toolkit && bun install && ./setup.sh
```

The setup script creates symlinks from `~/.claude/` to the repo. Update the repo once, every machine benefits after `git pull && ./setup.sh`.

## How to Use It

All workflows are invoked via slash commands:

| Command | What it does |
|---------|-------------|
| `/scott:new-project` | Start a new project (8-phase guided workflow) |
| `/scott:new-feature` | Add a feature to an existing project |
| `/scott:resume` | Pick up where you left off on a project |
| `/scott:phase-closeout` | Mandatory post-execution: verify, review, reflect, gate (hook-enforced) |
| `/scott:update-toolkit` | Update the toolkit itself |
| `/scott:compare-sources` | Compare context engineering sources against your toolkit |
| `/scott:stack-review` | Stack health dashboard (learning loop) |
| `/scott:stack-baseline` | First-run audit for existing projects |

## Four-System Architecture

| System | Owns | Use for |
|--------|------|---------|
| **Scott-toolkit** | Context engineering | Session management, templates, domain knowledge, stack enforcement, learning capture |
| **GSD** | Project management | Phases, milestones, execution, task tracking, verification |
| **Superpowers** | Development methodology | TDD, git worktrees, code review, plan writing, debugging |
| **Impeccable** | UI/UX quality | Design critique, polish, accessibility audits |

Toolkit workflows are **orchestrators** -- they call GSD and Superpowers at the right moments. Command names are decoupled via `config/interfaces.json` so renaming a GSD command requires updating one line, not ten files.

## Key Systems (v5+)

Three systems built on top of the base toolkit, plus plugin awareness:

### Stack Enforcement
Technology-specific checks that catch version gotchas at build time. Check files per technology (`checks/*.json`), CLI tools (`tools/stack-detect.ts`, `tools/stack-check.ts`, `tools/stack-preflight.ts`), and integration into phase closeout as a stack audit step.

### Learning Loop
Lessons from each project feed back into the toolkit. `[stack]`-tagged lessons become check candidates. `tools/stack-metrics.ts` aggregates audit data across all projects. `/scott:stack-review` presents a dashboard for human-approved promotion of lessons to checks.

### Decoupling
Abstract operation names (`plan_phase`, `tdd`, `code_review`) mapped to concrete commands via `config/interfaces.json`. Toolkit files reference operations, not tool-specific commands. Claude resolves them by reading `config/interfaces.json` directly (see `rules/claude-behavior.md` Operation Resolution section). To find where an operation is used: `grep -r "operation_name" workflows/ skills/ rules/`.

### Plugin Awareness (v5.1)
Bidirectional plugin-project alignment detection. The `plugins` section in `config/interfaces.json` catalogs known plugins (Vercel, Superpowers, Impeccable) with `required` flags. The session-start hook checks whether active plugins match the project's technology stack and warns about misalignment (e.g., Vercel plugin active on a non-Vercel project wastes ~52K tokens). New projects generate `.claude/settings.json` to disable irrelevant plugins.

## Repo Structure

```
scott-toolkit/
├── README.md
├── CHANGELOG.md
├── package.json                      # Bun project config (no runtime deps)
├── tsconfig.json                     # Strict TS, ES2022 target
├── setup.sh                          # One-command deploy to ~/.claude/ (stays bash)
│
├── src/                              # Shared TypeScript utilities
│   ├── paths.ts                      #   Path resolution (TOOLKIT_DIR, CLAUDE_DIR)
│   ├── json.ts                       #   Safe JSON read/write with generics
│   ├── semver.ts                     #   Version parsing and comparison
│   └── exec.ts                       #   Shell execution with timeout (Bun.spawn)
│
├── hooks/                            # Claude Code hooks (TypeScript, -> ~/.claude/hooks/)
│   ├── lib/                          #   Shared hook utilities
│   │   ├── stdin.ts                  #     JSON stdin reading, field extraction
│   │   └── platform.ts              #     Cross-platform hash, stat, date
│   ├── guards/                       #   PreToolUse guard modules
│   │   ├── git-push.ts, destructive.ts, npm-install.ts
│   │   ├── phase-completion.ts, claude-md.ts, surrealdb-inject.ts
│   │   └── workflow-gates.ts
│   ├── pretooluse-router.ts          #   Main Bash command dispatcher
│   ├── session-start.ts              #   SessionStart: sync, state detection
│   ├── session-end.ts, pre-compact.ts, extract-instincts.ts
│   ├── pre-completion-checklist.ts   #   Stop: verification checklist
│   ├── auto-format.ts, context-reminders.ts, offload-large-output.ts
│   ├── post-commit-triggers.ts, version-propagate.ts
│   ├── check-file-test-trigger.ts, uiux-reminder.ts
│   └── toolkit-coherence-check.ts
│
├── tools/                            # CLI tools (TypeScript, -> ~/.claude/tools/)
│   ├── stack-detect.ts               #   Auto-detect project technologies
│   ├── stack-check.ts                #   Run static checks from check files
│   ├── stack-preflight.ts            #   System readiness + provider health
│   ├── stack-metrics.ts              #   Aggregate audit data for learning loop
│   ├── toolkit-lint.ts               #   Toolkit integrity checker
│   ├── validate-stack-lock.ts        #   Stack-lock schema + staleness validator
│   └── pre-commit-hook.ts            #   Git pre-commit gate
│
├── checks/                           # Stack enforcement check files
│   ├── surrealdb.json, nuxt.json, tailwind.json, bun.json, hono.json
│   ├── typescript.json, zod.json, pinia.json
│   ├── vercel-ai.json, trigger-dev.json, pnpm.json
│   ├── stack-lock.schema.json
│   └── fixtures/                     #   Good/bad samples for check validation
│
├── config/                           # Toolkit configuration
│   ├── interfaces.json               #   Abstract operations -> concrete commands
│   └── version-manifest.json         #   Version tracking + banned patterns
│
├── workflows/                        # Interactive step-by-step processes (12 files)
├── context/                          # Templates for new projects
├── rules/                            # Behavior rules (-> ~/.claude/rules/)
├── skills/                           # Skill files (-> ~/.claude/skills/, 30+)
├── references/                       # Business context (loaded on demand)
├── docs/                             # Design documents and guides
│   ├── architecture.md               #   HOW THE TOOLKIT WORKS (start here)
│   └── user-guide.md
├── retros/, errors/, successes/      # Learning capture outputs
└── backups/                          # Settings snapshots (gitignored)
```

> **For the full architecture guide:** see `docs/architecture.md`. It covers how hooks work, how to add/modify components safely, deployment mechanics, and troubleshooting.

## Multi-Machine Sync

```bash
git pull                              # Get latest from GitHub
bun install                           # Update dependencies (if package.json changed)
./setup.sh                            # Re-deploy symlinks
```

## Contributing Rules

- Always update CHANGELOG.md when modifying hooks or skills
- Do not modify `~/.claude/settings.json` directly during a session (use the `update-config` skill)
- All new hooks and tools must be TypeScript (no new .sh files)
- Hooks import shared utilities from `hooks/lib/`, tools from `src/`
- Guards go in `hooks/guards/` and are imported by the router
- Each skill lives in its own subfolder: `skills/<name>/SKILL.md` (max 200 lines)
- Check files go in `checks/<technology>.json` following the schema in `checks/stack-lock.schema.json`
- Abstract operation names go in `config/interfaces.json`, not hardcoded in workflows
- Run `bun run tools/toolkit-lint.ts` before committing (pre-commit hook enforces this)
- See `docs/architecture.md` for the full "how to change things safely" guide

## How It Improves Over Time

```
Start project (use toolkit)
  -> Build with Claude Code + GSD + Superpowers
  -> Phase completes
  -> Run /scott:phase-closeout (verify, stack audit, review, reflect)
  -> Error logs + success logs + RETRO.md + lessons.md (tagged)
  -> [stack]-tagged lessons become check candidates
  -> /scott:stack-review to review and promote
  -> Checks apply to ALL future projects
  -> /scott:update-toolkit to apply other improvements
  -> Push to GitHub
  -> Next project starts smarter
```
