# Toolkit Audit Remediation — Design Spec

**Date:** 2026-04-05
**Status:** Approved
**Version:** v5.3 -> v6.0
**Trigger:** Independent architectural audit of scott-toolkit identified 22 verified issues across shell scripts, workflows, config, and skills.

---

## Context

An independent audit of scott-toolkit v5.3 graded the toolkit C+ overall. After verification against actual source code, 22 issues were confirmed real (11 false positives and 10 overstated findings were eliminated). The verified issues cluster into:

- **8 shell script bugs** (fail-open guards, macOS crashes, injection risks, fragile JSON parsing)
- **5 workflow structural issues** (missing enforcement gates, god-phases, duplicated context-gathering)
- **4 config/schema issues** (unenforced schema validation, missing check files, stale references)
- **5 skill sizing violations** (skills exceeding 200-line threshold)

The audit also recommended migrating JSON-heavy shell scripts to Bun/TypeScript. This spec covers the full remediation across 5 milestones.

---

## Approach: Hybrid (Approach C)

Fix critical bugs immediately, then rewrite tools and hooks to TypeScript in two focused milestones, followed by workflow/enforcement hardening and skill cleanup. Each milestone leaves the toolkit in a working state.

---

## M0: Safety Net

**Goal:** Create a rollback path before any changes.

### Deliverables

1. **Git tag `v5.3-pre-audit`** — snapshot of last known working state, pushed to origin
2. **`restore-v5.3.sh`** — one-command recovery script that:
   - Checks out `v5.3-pre-audit` tag into temp directory
   - Restores hooks/, tools/, config/ to original state
   - Re-runs `setup.sh` from restored state
   - Restores backed-up `settings.json` and `settings.local.json`
3. **Settings backup** — copy `~/.claude/settings.json` and `settings.local.json` to `backups/settings-v5.3/`
4. **`verify-toolkit.sh`** — verification script that:
   - Runs `setup.sh --verify-only`
   - Runs `toolkit-lint.sh` (or `.ts` after M1)
   - Checks every hook in settings.json resolves to a real file
   - Checks every symlink in `~/.claude/` points to a real target
5. **Branch strategy** — each milestone gets branch `audit/m0`, `audit/m1`, etc. Merge to main after verification.

### Success Criteria
- `git tag v5.3-pre-audit` exists on origin
- `restore-v5.3.sh` can be run and produces a working toolkit state
- `verify-toolkit.sh` passes on current v5.3 state

---

## M1: Critical Fixes + Bun Foundation

**Goal:** Fix the 4 most dangerous bugs, initialize Bun runtime, rewrite 6 tools to TypeScript.

### Part A: Critical Bash Hotfixes

Applied in-place before the rewrite begins:

| Bug | File | Fix |
|-----|------|-----|
| Fail-open guard | `hooks/guard-git-push.sh` | If jq fails, `exit 2` (block) instead of `exit 0` (allow) |
| macOS crash | `hooks/uiux-reminder.sh` | Platform detection: `md5 -qs` on Darwin, `md5sum` on Linux |
| Python injection | `hooks/version-propagate.sh` | Change to `python3 << 'PYEOF'` with env vars via `export` |
| Unescaped sed | `setup.sh:303` | Escape `&` and `\` in path variables before sed substitution |

Committed and tagged before Part B starts.

### Part B: Bun Foundation

**New files in toolkit root:**
- `package.json` — `"type": "module"`, Bun runtime, no external deps initially
- `tsconfig.json` — strict mode, ES2022 target, NodeNext module resolution

**Shared utilities (`src/`):**
- `src/json.ts` — read/write JSON files with error handling
- `src/semver.ts` — semantic version comparison (replaces broken string comparison in guard-npm-install)
- `src/paths.ts` — toolkit path resolution, `SCOTT_TOOLKIT_DIR` env var
- `src/exec.ts` — run shell commands with timeout and error capture

**Prerequisites:**
- Bun added to README.md documented prerequisites
- `setup.sh` gets prerequisite check: `command -v bun >/dev/null || exit 1`

### Part C: Tools Rewrite

| Old (bash) | New (TypeScript) | Lines | Key Improvement |
|-----------|-----------------|-------|-----------------|
| `tools/stack-detect.sh` (153) | `tools/stack-detect.ts` | ~100 | Native JSON parsing of package.json |
| `tools/stack-check.sh` (231) | `tools/stack-check.ts` | ~150 | Native JSON, proper regex, structured output |
| `tools/stack-preflight.sh` (226) | `tools/stack-preflight.ts` | ~140 | Native fetch() with timeouts, no curl dependency |
| `tools/stack-metrics.sh` (324) | `tools/stack-metrics.ts` | ~180 | Native JSON generation, proper file I/O |
| `tools/toolkit-lint.sh` (283) | `tools/toolkit-lint.ts` | ~170 | Native JSON parsing of version-manifest, proper globs |
| `tools/pre-commit-hook.sh` (19) | `tools/pre-commit-hook.ts` | ~15 | Thin wrapper calling toolkit-lint.ts |

**Backward compatibility:** Old `.sh` files become thin wrappers (`exec bun run "$(dirname "$0")/stack-check.ts" "$@"`). Removed in M2 after settings references are updated.

### Success Criteria
- 4 bash hotfixes committed and tagged
- `bun run tools/stack-detect.ts ~/Sites/Personal/code/eleanor` produces valid output
- `bun run tools/toolkit-lint.ts` catches same patterns as old `.sh`
- `bun run tools/stack-check.ts` processes check files correctly
- `verify-toolkit.sh` passes
- Pre-commit hook works via new `.ts` file

---

## M2: Hook Migration + Security Hardening

**Goal:** Rewrite 18 shell hooks to TypeScript, consolidate router, harden security.

### Hook Architecture

**Router consolidation:** `bash-pretooluse-router.sh` (1 file dispatching to 6 subprocesses) becomes `pretooluse-router.ts` (1 file with function imports):

```
hooks/
├── pretooluse-router.ts        # Consolidated: reads stdin once, dispatches by pattern
│   └── guards/
│       ├── git-push.ts         # Fail-closed guard
│       ├── destructive.ts      # rm -rf, git reset --hard, etc.
│       ├── npm-install.ts      # Stack-lock version validation (proper semver)
│       ├── phase-completion.ts # .post-execution-complete marker check
│       └── surrealdb-inject.ts # Advisory SurrealDB skill injection
├── guard-claude-md.ts          # Standalone PreToolUse (Edit|Write matcher)
├── inject-surrealdb.ts         # Standalone PreToolUse (Read|Edit|Write matcher)
├── session-start.ts            # SessionStart
├── session-end.ts              # Stop
├── pre-compact.ts              # PreCompact
├── extract-instincts.ts        # PreCompact + Stop
├── pre-completion-checklist.ts # Stop
├── auto-format.ts              # PostToolUse Write|Edit
├── offload-large-output.ts     # PostToolUse (all) — streaming, not slurping
├── context-reminders.ts        # PostToolUse (all)
├── post-commit-triggers.ts     # PostToolUse Bash
├── version-propagate.ts        # PostToolUse Write|Edit — no Python, pure TS
├── check-file-test-trigger.ts  # PostToolUse Edit|Write
├── uiux-reminder.ts            # PostToolUse Edit|Write — Bun.CryptoHasher
└── toolkit-coherence-check.ts  # PostToolUse Edit|Write
```

**GSD-owned hooks (untouched):** `gsd-prompt-guard.js`, `gsd-read-guard.js`, `gsd-context-monitor.js`, `gsd-check-update.js`, `gsd-session-state.sh`, `gsd-phase-boundary.sh`, `gsd-statusline.js`. The router calls `gsd-validate-commit` via `Bun.spawn()` to preserve GSD ownership.

### Security Hardening

| Improvement | Implementation |
|-------------|---------------|
| All guards fail-closed | Default return is `{ allow: false }`. Only explicit `true` permits action. |
| No eval | Direct function dispatch everywhere |
| Proper JSON parsing | `JSON.parse()` with try/catch replaces all grep/sed/jq |
| Credential detection | `guardGitPush` scans staged files for `API_KEY=`, `SECRET=`, `token:`, `.env` patterns |
| Cross-platform hashing | `Bun.CryptoHasher` replaces `md5sum`/`md5` |

### Settings Migration

**`~/.claude/settings.json`** — 18 hook entries updated:
```jsonc
// Before:
{ "command": "$HOME/.claude/hooks/bash-pretooluse-router.sh" }
// After:
{ "command": "bun run $HOME/.claude/hooks/pretooluse-router.ts" }
```

**`~/.claude/settings.local.json`** — 5 external references updated:
```jsonc
// Before:
"Bash(~/Sites/Global/scott-toolkit/tools/stack-detect.sh ...)"
// After:
"Bash(bun run ~/Sites/Global/scott-toolkit/tools/stack-detect.ts ...)"
```

Backed up to `backups/settings-pre-m2.json` before modification.

### Cleanup

- Remove old `.sh` wrapper files from M1
- Remove old guard `.sh` files absorbed into router
- Update `setup.sh` to deploy `.ts` files and the `hooks/guards/` subdirectory (setup.sh currently symlinks individual files; M2 adds directory-aware deployment for the guards/ subfolder)

### Success Criteria
- `verify-toolkit.sh` passes
- Fresh Claude Code session starts cleanly (session-start.ts fires)
- Bash calls dispatch through pretooluse-router.ts correctly
- `git push` blocked by guard in test repo
- `.vue` edit triggers uiux-reminder
- CHANGELOG.md edit triggers version-propagate
- Pre-compact creates state snapshot
- No `.sh` hook files remain (except GSD-owned and start-surreal.sh/start-n8n.sh)

---

## M3: Workflow & Enforcement Hardening

**Goal:** Add gates to critical workflows, split god-phases, deduplicate, expand stack checks.

### Part A: File-System Gates

New gates using the phase-closeout pattern (marker file + guard check):

| Workflow | Phase | Gate Marker | Prevents |
|----------|-------|------------|----------|
| `new-project.md` | Phase 5 (Create Repo) | `.project-scaffolded` | Build before repo confirmed |
| `new-project.md` | Phase 6 (Design Proof) | `.design-approved` | Build before design validated |
| `handoff-to-gary.md` | Phase 4 (Setup Instructions) | `.handoff-ready` | Handoff before setup verified |
| `toolkit-update.md` | Phase 3 (Draft Changes) | `.changes-drafted` | Commit before changes reviewed |
| `retro.md` | Phase 2 (Guided Reflection) | `.reflection-complete` | Toolkit updates before reflection done |

Implementation: new guard functions in `pretooluse-router.ts` that check for markers based on context (which workflow is active, which phase is current).

### Part B: Split God-Phases

**phase-closeout.md Phase 2 -> 2a, 2b, 2c:**
- Phase 2a: Stack Audit [AUTO] — stack-preflight, stack-check, live audit agent
- Phase 2b: Specialist Lens Review [AUTO] — schema/security lens subagents (with context_files existence validation)
- Phase 2c: General Code Review [STOP] — code_review operation, fix cycle

**new-project.md Phase 3 -> 3a, 3b, 3c:**
- Phase 3a: Draft PRD [AUTO] — write the document
- Phase 3b: Approve PRD [STOP] — Scott reviews
- Phase 3c: Resolve Conflicts [AUTO] — merge if existing PRD

### Part C: Deduplicate Context-Gathering

New file: `context/_gather-project-context.md`

Shared template referenced by `retro.md`, `phase-closeout.md`, and `resume-project.md` Phase 1. Includes:
1. Project CLAUDE.md
2. PRD.md or README.md
3. tasks/todo.md
4. tasks/lessons.md
5. `git log --oneline -20` (NOT full log — fixes retro.md bug)
6. .planning/STATE.md (if GSD)
7. .claude-resume.md (if exists)

### Part D: Stack Enforcement Expansion

**6 new check files:**

| File | Technology | Key Checks |
|------|-----------|------------|
| `checks/typescript.json` | TypeScript | strict mode, target version, path alias patterns |
| `checks/zod.json` | Zod | schema patterns, version-specific API (z.input vs z.infer) |
| `checks/pinia.json` | Pinia | composition API usage, store scoping, stale state patterns |
| `checks/vercel-ai.json` | Vercel AI SDK | streaming patterns, model config, provider setup |
| `checks/trigger-dev.json` | Trigger.dev | task patterns, retry config, idempotency |
| `checks/pnpm.json` | pnpm | workspace config, lockfile format, phantom dependency detection |

**New tool: `tools/validate-stack-lock.ts`**
- Validates project `stack-lock.json` against `checks/stack-lock.schema.json`
- Called by `session-start.ts` on every session with a stack-lock
- Called by `stack-detect.ts` after generating a new stack-lock

**Lens context_files validation:**
- Before dispatching lens subagent in phase-closeout Phase 2b, verify every file in `context_files` array exists
- Missing file: log warning, skip lens (don't crash review)

### Part E: Definitions File

New file: `context/_definitions.md`

Defines ambiguous terms referenced by workflows:
- **Design Proof:** working visual prototype viewable in browser (not a sketch)
- **Stack Lock Staleness:** `last_reviewed` > 30 days. Action: warn, don't block.
- **Verify Execution:** compare codebase against PLAN.md acceptance criteria

### Success Criteria
- `verify-toolkit.sh` passes
- Gate test: start new-project, skip to Phase 7 without Phase 5 marker — blocked
- `validate-stack-lock.ts` succeeds against Eleanor's stack-lock.json
- New check files parse correctly via `stack-check.ts`
- Split phases have clear entry/exit criteria in workflow files
- Shared context template used by 3 workflows

---

## M4: Skill Cleanup + Polish

**Goal:** Split oversized skills, fix stale references, update documentation, final coherence audit.

### Part A: Skill Splits

| Skill | Current Lines | Refactored Structure |
|-------|-------------|---------------------|
| `skill-creator` | 479 | 50-line SKILL.md + `references/workflow.md` + `references/eval-guide.md` |
| `scott-research` | 442 | 60-line SKILL.md + `references/orchestration.md` |
| `scott-eos` | 331 | 40-line SKILL.md + absorb inline content into existing `references/eos-complete-reference.md` |
| `scott-council` | 312 | 50-line SKILL.md + `references/council-protocol.md` |
| `scott-notebooklm` | 266 | 40-line SKILL.md + `references/creation-workflow.md` |

Pattern: SKILL.md keeps description, triggers, Quick Commands, and a reference pointer. Heavy logic moves to references/.

### Part B: Fix Stale References

- `scott-surrealdb/SKILL.md` line 16: update path to `~/Sites/Global/scott-toolkit/references/surrealdb-v3-master-reference.md` (file exists at this location, confirmed in manifest)
- Run `toolkit-lint.ts` to catch any other stale references from M1-M3 work
- Fix whatever it finds

### Part C: Documentation Updates

| File | Changes |
|------|---------|
| `README.md` | Repo structure (.ts files), Bun prerequisite, updated contributing rules |
| `CHANGELOG.md` | Full v6.0 entry documenting all 4 milestones |
| `docs/user-guide.md` | Hook/tool references .sh -> .ts, new gates, new check files |
| `config/interfaces.json` | Bump schema_version to 1.3 if operations changed |
| `config/version-manifest.json` | Add banned patterns for old `.sh` references |
| `context/CLAUDE-MD-TEMPLATE.md` | Bun prerequisite, reference new gates |
| `rules/claude-behavior.md` | Update hook filename references if any |
| External: `Personal/learning/.../04-stack-enforcement.md` | Update script references |
| External: `Global/context-engineering/.../_comparison-manifest.md` | Update script references |

### Part D: Final Coherence Audit

1. `verify-toolkit.sh` passes
2. `toolkit-lint.ts` reports zero issues
3. `setup.sh --verify-only` passes
4. Fresh Claude Code session in Eleanor — hooks fire correctly
5. `stack-check.ts` against Eleanor — full pipeline works
6. `version-manifest.json` banned patterns catch old `.sh` references
7. All SKILL.md files under 200 lines: `wc -l skills/*/SKILL.md | sort -n`

### Part E: Version Bump

- Tag as `v6.0` — major bump because runtime changed (bash to Bun) and hook architecture changed
- Push tag to origin
- Update `version-manifest.json` to track v6.0

### Success Criteria
- All Part D checks pass
- Every SKILL.md under 200 lines
- CHANGELOG tells coherent story v5.3 -> v6.0
- Fresh session starts with zero warnings
- Brett can `git pull && ./setup.sh` (after installing Bun) and get working toolkit

---

## Dependency Graph

```
M0 (safety net)
 └── M1 (critical fixes + Bun tools)
      └── M2 (hook migration)
           └── M3 (workflow hardening)
                └── M4 (cleanup + v6.0)
```

Each milestone merges to main before the next starts. Each is independently verifiable.

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Bun rewrite breaks hooks mid-session | M1 uses .sh wrappers for backward compat; M2 only removes them after verification |
| settings.json migration corrupts config | Backed up in M0 and M2; restore script available |
| New gates are too aggressive | Only 5 high-risk workflows gated; low-risk workflows left ungated |
| Stack check files have false positives | Check files are additive; existing projects unaffected until stack-lock updated |
| v6.0 breaks Brett's machine | README documents Bun prerequisite; setup.sh checks for Bun and fails with clear message |

---

## Out of Scope

- Rewriting GSD-owned hooks (`.js` files owned by GSD plugin)
- Check files for thin-integration services (Twilio, Vapi, DocuSeal, Stripe, Upstash, Coolify)
- Migrating `start-surreal.sh` and `start-n8n.sh` (simple launchers, not worth the churn)
- Migrating `setup.sh` itself to TypeScript (it needs to run before Bun is verified available)
- Multi-user architecture improvements (toolkit remains Scott-specific, bus factor = 1)
