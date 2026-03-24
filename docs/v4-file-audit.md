# v4 File Audit: Every File in the Toolkit

**Date:** 2026-03-23
**Purpose:** Holistic analysis of all 160 files before v4 implementation.
**Questions per file:** (1) Purpose in v4? (2) Duplicated? (3) Consolidation? (4) Right place? (5) How should it change?

---

## Summary of Findings

| Category | Files | Keep | Consolidate | Remove | New |
|----------|-------|------|-------------|--------|-----|
| Root-level | 10 | 5 | 3 | 2 | 0 |
| hooks/ | 14 | 14 | 0 | 0 | 2 |
| rules/ | 2 | 2 | 0 | 0 | 0 |
| workflows/ | 11 | 8 | 3 | 0 | 0 |
| skills/ | 24 dirs | 24 | 0 | 0 | 3 |
| context/ | 4 | 4 | 0 | 0 | 0 |
| knowledge/ | 8 | 0 | 4 | 4 | 0 |
| references/ | 9 | 5 | 2 | 2 | 0 |
| errors/ | 11 | 11 | 0 | 0 | 0 |
| successes/ | 8 | 8 | 0 | 0 | 0 |
| retros/ | 5 | 5 | 0 | 0 | 0 |
| docs/ | 1 | 1 | 0 | 0 | 0 |
| **NEW dirs** | - | - | - | - | 3 dirs |
| **TOTAL** | ~160 | ~132 | 12 | 8 | 8 |

**Net change:** -8 removed, +8 new, 12 consolidated into other files = smaller, tighter toolkit.

---

## 1. Root-Level Files

### about-me.md (19 lines) — REMOVE
- **Purpose:** Describes Scott's role with the toolkit.
- **Duplicated?** Yes. `~/.claude/CLAUDE.md` has the same info, plus more.
- **v4 verdict:** Remove. README.md already covers "what this is." CLAUDE.md covers "who Scott is."

### CHANGELOG.md — KEEP, no changes
- **Purpose:** Version history of all toolkit changes.
- **v4 verdict:** Continues as-is. Bump to v3.0 / v4.0 when v4 ships.

### conventions.md (25 lines) — CONSOLIDATE into README.md
- **Purpose:** Folder structure table + toolkit rules.
- **Duplicated?** Mostly overlaps with README.md. The "rules" section (always update changelog, don't modify settings.json) is useful but should live in README.
- **v4 verdict:** Merge its content into README.md. Delete this file.

### README.md (50 lines) — KEEP, update for v4
- **Purpose:** Quick start, architecture overview, command table.
- **v4 verdict:** Absorb conventions.md content. Add v4 sections: checks/, tools/, config/. Update version to v4. Update architecture diagram to show stack enforcement, learning loop, decoupling.

### scott-toolkit-instructions.md (~80 lines) — KEEP, rename
- **Purpose:** User-facing "how to use" guide. Referenced by the PDF.
- **Duplicated?** Partially overlaps README but serves a different audience (user guide vs developer docs).
- **v4 verdict:** Rename to `docs/user-guide.md`. Update for v4 commands (`/scott:stack-review`, `/scott:stack-baseline`, `/scott:rebuild-metrics`). Move from root to docs/.

### scott-toolkit-instructions.pdf — KEEP
- **Purpose:** Generated from the .md. Shared with Brett.
- **v4 verdict:** Regenerate after v4 changes. Continue living in root for easy sharing.

### setup.sh (226 lines) — KEEP, extend for v4
- **Purpose:** Deploys toolkit to ~/.claude/ via symlinks.
- **v4 changes needed:**
  - Deploy `checks/` directory (symlink entire dir)
  - Deploy `tools/` scripts (symlink, ensure executable)
  - Deploy `config/interfaces.json` (symlink)
  - Deploy `checks/test-fixtures/` (symlink)
  - Add verification for new dirs in the health check section
  - Update version banner to v4

### start-n8n.sh — KEEP, no changes
- **Purpose:** Convenience script to start n8n.
- **v4 verdict:** Not toolkit config. Utility script. Fine where it is.

### start-surreal.sh — KEEP, no changes
- **Purpose:** Convenience script to start SurrealDB.
- **v4 verdict:** Same as above.

### .claude-resume.md — EPHEMERAL, ignore
- **Purpose:** Session resume context (written by pre-compact hook).
- **v4 verdict:** Not a permanent file. Gitignore it.

---

## 2. hooks/ (14 files)

All hooks survive v4. Two new hooks are added.

### auto-format.sh — KEEP, no changes
- **Purpose:** Runs Prettier on changed files after edits.
- **v4 relevance:** Orthogonal to stack enforcement. Continues as-is.

### context-reminders.sh — KEEP, no changes
- **Purpose:** Warns at 60min and 100 tool uses about context rot.
- **v4 relevance:** Context protection remains critical.

### extract-instincts.sh — KEEP, no changes
- **Purpose:** Extracts patterns from session for instinct-candidates.md.
- **v4 relevance:** Feeds the learning loop (Section 6). Could be extended later to tag `[stack]` lessons automatically.

### guard-claude-md.sh — KEEP, no changes
- **Purpose:** Blocks unintended CLAUDE.md edits.
- **v4 relevance:** Still needed. CLAUDE.md soft budget (~20 lines for toolkit section) makes this even more important.

### guard-destructive.sh — KEEP, no changes
- **Purpose:** Blocks dangerous commands (rm -rf, git reset --hard, etc.).
- **v4 relevance:** Safety net. Unchanged.

### guard-git-push.sh — KEEP, no changes
- **Purpose:** Confirms before git push.
- **v4 relevance:** Unchanged.

### guard-npm-install.sh — KEEP, EXTEND for v4
- **Purpose:** Confirms before npm/pnpm install.
- **v4 changes:** Extend to compare installed packages against stack-lock.json. If a newly installed package conflicts with the locked stack (e.g., wrong SurrealDB SDK version), warn loudly. This is the drift detection mechanism from Section 5.13.

### guard-phase-completion.sh — KEEP, no changes
- **Purpose:** Blocks phase completion without `.post-execution-complete` marker.
- **v4 relevance:** This is THE enforcement gate. The stack audit runs inside phase-closeout (which writes the marker), so this hook already enforces the audit indirectly. No changes needed.

### offload-large-output.sh — KEEP, no changes
- **Purpose:** Saves large tool outputs to disk to protect context window.
- **v4 relevance:** Context protection. Audit reports could be large, making this more relevant.

### post-commit-skill-triggers.sh — KEEP, no changes
- **Purpose:** Triggers skill-specific actions after commits.
- **v4 relevance:** Could be extended to trigger `stack-check.sh` after commits, but that's handled by the execution-step audit in phase-closeout. No change needed.

### pre-compact.sh — KEEP, no changes
- **Purpose:** Saves context snapshot before compaction.
- **v4 relevance:** Context protection. Unchanged.

### pre-completion-checklist.sh — KEEP, no changes
- **Purpose:** Reminds of completion checklist before marking done.
- **v4 relevance:** Could add "stack audit passed?" to checklist. But guard-phase-completion.sh already enforces this. No change needed.

### session-end.sh — KEEP, no changes
- **Purpose:** Cleanup at session end.
- **v4 relevance:** Unchanged.

### session-start.sh — KEEP, minor update
- **Purpose:** Pulls config, shows project context at session start.
- **v4 changes:** Add a `stack-lock.json` staleness check. If the project has a stack-lock and `last_reviewed` is 30+ days old, show a nudge: "Stack checks last reviewed 45 days ago." (Section 5.13)

### NEW: uiux-reminder.sh — ADD
- **Purpose:** PostToolUse hook that reminds to run /impeccable:audit when .vue files are written during GSD execution phases. Non-blocking. Fires at most once per phase. (Section 5.21)

### NEW: check-file-test-trigger.sh — ADD
- **Purpose:** PostToolUse hook that auto-runs test fixtures when check files are edited. (Section 5.16)

---

## 3. rules/ (2 files)

### claude-behavior.md (116 lines) — KEEP, REWRITE for v4
- **Purpose:** The master behavioral ruleset. Defines development methodology, workflow execution, project management, and context engineering.
- **Duplicated?** Some overlap with `~/.claude/CLAUDE.md` (lessons.md updates, TDD reference).
- **v4 changes needed:**
  1. **Add Stack Validation section:** Reference stack enforcement system. "Before execution, verify stack-lock.json exists. During execution, `stack-check.sh` runs after each step. At closeout, full stack audit runs."
  2. **Decouple command references:** Replace hardcoded `/gsd:plan-phase`, `superpowers:test-driven-development`, etc. with abstract operation names that resolve via `config/interfaces.json`. Example: "Run the **plan_phase** operation" instead of "Run `/gsd:plan-phase`".
  3. **Add Learning Loop reference:** "After phase closeout, Claude suggests `[stack]`/`[pattern]`/`[project]` tags for each lesson."
  4. **Keep CLAUDE.md soft budget note:** "Toolkit section of project CLAUDE.md should stay under ~20 lines."

### code-style.md (41 lines) — KEEP, minor update
- **Purpose:** TypeScript, Vue, Tailwind style rules.
- **Duplicated?** No. This is the canonical style guide.
- **v4 changes:** No structural changes. The stack enforcement system validates version-specific correctness (handled by check files), while code-style.md handles patterns and conventions. These are complementary, not overlapping. Consider adding a note: "Version-specific API compliance is enforced by stack checks, not this file."

---

## 4. workflows/ (11 files)

### phase-closeout.md — KEEP, REWRITE for v4
- **Purpose:** Mandatory post-execution gate. Verification, code review, reflection.
- **v4 changes:** Insert **Phase 1.5: Stack Audit** between Verify (Phase 1) and Code Review (Phase 2):
  1. Run `stack-check.sh` on all changed files
  2. For SurrealDB projects: dispatch live audit agent (schema apply + seed + query)
  3. For other technologies: dispatch doc compliance agents as needed
  4. Write results to `.planning/audits/audit_*.json`
  5. PASS = continue to Phase 2. FAIL = fix before proceeding.
- **Decouple:** Replace `superpowers:requesting-code-review` with abstract operation name.

### new-project.md — KEEP, minor update
- **Purpose:** 8-phase guided project kickoff.
- **v4 changes:** In Phase 5 (Create Repository), add: "Generate `stack-lock.json` using `stack-detect.sh`. Auto-detect from package.json, show Scott for approval." Also decouple command references.

### new-feature.md — KEEP, minor update
- **Purpose:** Lighter project kickoff for features.
- **v4 changes:** Decouple command references. No structural changes.

### resume-project.md — KEEP, minor update
- **Purpose:** 4-phase resume workflow.
- **v4 changes:** In Phase 1, add stack-lock staleness check. Decouple command references.

### handoff-to-gary.md — KEEP, minor update
- **Purpose:** 5-phase handoff preparation.
- **v4 changes:** Add "stack-lock.json is included in handoff artifacts" so Gary knows what's enforced. Decouple command references.

### toolkit-update.md — KEEP, minor update
- **Purpose:** 6-phase toolkit self-update.
- **v4 changes:** Add awareness of new v4 directories (checks/, tools/, config/). When updating check files, mention that test fixtures should also be updated.

### compare-sources.md — KEEP, no changes
- **Purpose:** 6-phase source comparison workflow.
- **v4 relevance:** Orthogonal to stack enforcement. Continues as-is.

### log-error.md — KEEP, but mark as supplementary
- **Purpose:** Mid-session error capture.
- **v4 note:** phase-closeout.md subsumes this for GSD phases. But log-error.md is still useful for mid-session captures outside GSD phases (per claude-behavior.md). Add a note at top: "For GSD phase errors, use /scott:phase-closeout instead. This workflow is for mid-session, non-GSD error capture."

### log-success.md — KEEP, but mark as supplementary
- **Purpose:** Mid-session success capture.
- **v4 note:** Same as log-error.md. Add supplementary note.

### retro.md — KEEP, but mark as supplementary
- **Purpose:** Post-milestone retrospective.
- **v4 note:** phase-closeout captures phase-level retros. This is for milestone-level or project-level retros. These are different scopes. Add clarifying note.

### toolkit-spa-day.md — KEEP, EXTEND for v4
- **Purpose:** Monthly consolidation of rules/skills/instincts.
- **v4 changes:** Add new Phase: "Review Stack Check Health" that runs `/scott:stack-review` dashboard as part of the spa day. Also add "Review interfaces.json for stale mappings."

---

## 5. skills/ (24 directories)

All 24 skills survive v4. Three new skills are added.

### Domain Knowledge Skills (no changes)
| Skill | Files | v4 Status |
|-------|-------|-----------|
| advosy-claimsforce | SKILL.md + 4 refs | KEEP, no changes |
| advosy-context | SKILL.md | KEEP, no changes |
| advosy-crm | SKILL.md + 1 ref | KEEP, no changes |
| scott-bops | SKILL.md + 3 refs | KEEP, no changes |
| scott-human-nature | SKILL.md + 1 ref | KEEP, no changes |
| scott-mastery | SKILL.md + 1 ref | KEEP, no changes |
| scott-power-laws | SKILL.md + 1 ref | KEEP, no changes |
| scott-war-strategies | SKILL.md + 1 ref | KEEP, no changes |
| scott-presentation | SKILL.md + 1 ref | KEEP, no changes |
| scott-uiux | SKILL.md + 5 refs | KEEP, no changes |

### Technical Reference Skills (minor updates)
| Skill | Files | v4 Status |
|-------|-------|-----------|
| scott-surrealdb | SKILL.md | KEEP. In v4, this skill is complemented by `checks/surrealdb.json` (enforcement). The skill provides knowledge, the check file provides rules. No overlap. |
| scott-n8n-reference | SKILL.md + 23 refs | KEEP, no changes. n8n is not in the check file system (no version enforcement needed). |
| scott-automation-guide | SKILL.md | KEEP, no changes |
| scott-save-tweet | SKILL.md | KEEP, no changes |

### Workflow Wrapper Skills (generated by setup.sh)
These are auto-generated thin wrappers that point to workflow .md files. All survive unchanged.
| Skill | Wraps |
|-------|-------|
| scott-new-project | workflows/new-project.md |
| scott-new-feature | workflows/new-feature.md |
| scott-resume | workflows/resume-project.md |
| scott-phase-closeout | workflows/phase-closeout.md |
| scott-handoff | workflows/handoff-to-gary.md |
| scott-update-toolkit | workflows/toolkit-update.md |
| scott-compare-sources | workflows/compare-sources.md |

### Operational Skills (minor updates)
| Skill | v4 Status |
|-------|-----------|
| scott-debug | KEEP. In v4, decouple any hardcoded command references. |
| scott-bypass | KEEP, no changes. Used for audit bypass tier. |
| pause | KEEP, no changes. |
| skill-creator | KEEP, no changes. Large skill (10+ files) but self-contained. |

### NEW Skills for v4
| Skill | Purpose |
|-------|---------|
| scott-stack-review | Dashboard: system health, new check candidates, check health, refinement candidates, overlap detection. (Section 6.4) |
| scott-stack-baseline | First-run audit for existing projects. Creates stack-lock.json, runs full codebase audit, produces baseline report. (Section 5.15) |
| scott-rebuild-metrics | Alias for `stack-metrics.sh --full-rebuild`. Regenerates metrics.json from all audit artifacts. (Section 6.3) |

---

## 6. context/ (4 templates)

### CLAUDE-MD-TEMPLATE.md — KEEP, update for v4
- **Purpose:** Template for new project CLAUDE.md files.
- **v4 changes:** Add `report_mode` field for explained/standard mode. Add note about stack-lock.json. Keep under ~20 line soft budget for toolkit section.

### PRD-TEMPLATE.md — KEEP, no changes
- **Purpose:** Template for product requirements docs.
- **v4 relevance:** Orthogonal.

### DESIGN-INTENT-TEMPLATE.md — KEEP, no changes
- **Purpose:** Template for visual design direction.
- **v4 relevance:** Orthogonal.

### RETRO-TEMPLATE.md — KEEP, minor update
- **Purpose:** Template for retrospectives.
- **v4 changes:** Add `[stack]`/`[pattern]`/`[project]` tag column to the lessons table. Claude suggests tags during reflection.

### Rename context/ to templates/?
**Decision: No.** The directory name "context" describes what these files provide (context for projects). "Templates" is technically accurate but less descriptive. Leave as-is.

---

## 7. knowledge/ (8 files) — ELIMINATE DIRECTORY

This is the biggest consolidation opportunity. The knowledge/ directory was an early attempt to store reference material, but skills and references now serve this purpose better.

### knowledge/active/surrealdb.md (290 lines) — CONSOLIDATE
- **Duplicated?** Yes. `skills/scott-surrealdb/SKILL.md` has the same knowledge, plus more. `references/surrealdb-v3-reference.md` (928 lines) is the comprehensive reference.
- **v4 verdict:** Absorb any unique content into `skills/scott-surrealdb/SKILL.md`. Delete this file.

### knowledge/active/n8n-integration.md (181 lines) — CONSOLIDATE
- **Duplicated?** Yes. `skills/scott-n8n-reference/` (24 files) is far more comprehensive.
- **v4 verdict:** Absorb any unique content into the n8n skill. Delete this file.

### knowledge/active/nuxt-ui-v4.md (640 lines) — CONSOLIDATE
- **Duplicated?** Partially by Context7 (live docs for Nuxt UI v4).
- **v4 verdict:** Move to `references/nuxt-ui-v4-patterns.md` (patterns that Context7 doesn't cover). Or absorb into `skills/scott-uiux/references/`. In v4, Context7 queries with version filtering handle doc lookups. This file should only keep patterns/gotchas not in official docs.

### knowledge/active/context-protection.md (85 lines) — CONSOLIDATE
- **Duplicated?** Yes. `rules/claude-behavior.md` covers context protection rules. The pre-compact and context-reminders hooks implement them.
- **v4 verdict:** Absorb any unique content into claude-behavior.md. Delete this file.

### knowledge/archive/error-handling.md (304 lines) — REMOVE
- **Why:** Archived. Not loaded by any skill or rule. General error handling patterns that don't need toolkit storage.

### knowledge/archive/frontend-design.md (370 lines) — REMOVE
- **Why:** Archived. Superseded by `skills/scott-uiux/` and the Impeccable skills.

### knowledge/archive/rust-tauri-commands.md (414 lines) — REMOVE
- **Why:** Archived. Tauri-specific. Context7 has current Tauri docs. If needed, can be re-derived from Context7.

### knowledge/archive/tauri-nuxt.md (590 lines) — REMOVE
- **Why:** Archived. Same as above. Eleanor-specific patterns that belong in Eleanor's project docs, not the toolkit.

**After consolidation: Delete the entire `knowledge/` directory.**

---

## 8. references/ (9 files)

### ADR-001-schema-bridge.md (185 lines) — MOVE to project
- **Purpose:** Architecture decision record for Eleanor's schema bridge pattern.
- **Wrong place?** Yes. This is Eleanor-specific, not toolkit-wide. Should live in Eleanor's repo.
- **v4 verdict:** Move to Eleanor repo's `docs/` directory. Remove from toolkit.

### ADR-002-migrations.md (238 lines) — MOVE to project
- **Purpose:** ADR for SurrealDB migration strategy.
- **Same issue:** Eleanor-specific. Move to Eleanor repo.

### ADR-003-infrastructure.md (287 lines) — KEEP
- **Purpose:** ADR for Hetzner+Coolify infrastructure decisions.
- **Toolkit-wide?** Yes. Infrastructure decisions apply to all projects.
- **v4 verdict:** Keep. Complements `references/hetzner-surrealdb-setup.md`.

### advosy-context.md (150 lines) — CONSOLIDATE
- **Duplicated?** Yes. `skills/advosy-context/SKILL.md` exists.
- **v4 verdict:** Absorb any unique content into the skill's references/. Delete from references/.

### bresco-context.md (66 lines) — KEEP
- **Purpose:** Bresco company/product context.
- **v4 verdict:** No matching skill. Keep until a bresco-context skill is created (if ever needed).

### gsd-upstream-proposals.md (26 lines) — REMOVE
- **Purpose:** Proposals for GSD upstream features.
- **Stale?** Yes. Only 26 lines. If proposals were accepted, they're in GSD. If not, they're outdated.
- **v4 verdict:** Remove. Decoupling (interfaces.json) makes upstream tracking less critical.

### hetzner-surrealdb-setup.md (231 lines) — KEEP
- **Purpose:** Step-by-step Hetzner + SurrealDB deployment guide.
- **v4 verdict:** Still relevant. Infrastructure reference.

### project-catalog.md (46 lines) — KEEP
- **Purpose:** Lists all projects with status and location.
- **v4 verdict:** Keep. Referenced from `~/.claude/CLAUDE.md`.

### surrealdb-v3-reference.md (928 lines) — KEEP, but evaluate overlap
- **Purpose:** Comprehensive SurrealDB v3 reference.
- **Overlap?** With `skills/scott-surrealdb/SKILL.md`. But this is the deep reference while the skill is the quick-access entry point. They serve different purposes.
- **v4 verdict:** Keep. In v4, check files (`checks/surrealdb.json`) handle enforcement patterns. This reference handles the "why" and "how" that check files can't express. Consider making it a reference file under the surrealdb skill: `skills/scott-surrealdb/references/v3-reference.md`.

---

## 9. errors/ (11 files) — KEEP, standardize naming

### Current state
- Inconsistent naming: `error-001.md` through `error-007.md` vs `008-eod-timezone-regression.md`
- `_metadata.json` tracks next ID and schema version

### v4 verdict
- **KEEP all files.** Error logs are the raw data for the learning loop.
- **Standardize naming:** Future errors should use the descriptive format: `NNN-short-description.md` (e.g., `011-missing-assert-required.md`). The v4 learning loop can parse these for `[stack]`-tagged content.
- **No retroactive rename** of existing files (not worth the churn).

---

## 10. successes/ (8 files) — KEEP, same treatment as errors/

- Inconsistent naming (same pattern as errors).
- `_metadata.json` for indexing.
- **v4 verdict:** Keep all. Same naming standardization going forward.

---

## 11. retros/ (5 files) — KEEP, no changes

- `_retro-index.md` + 4 project retros.
- **v4 verdict:** These are milestone-level records. The learning loop scans `tasks/lessons.md` per project, not retros/. These are for human reference. Keep as-is.

---

## 12. docs/ (1 file) — KEEP, expand

### toolkit-rewrite-design.md (1073 lines) — KEEP
- **Purpose:** The v4 design document.
- **v4 verdict:** Keep as design record. After implementation, it becomes the architectural reference for the v4 system.

### NEW: docs/user-guide.md (moved from root)
- Renamed from `scott-toolkit-instructions.md`. Updated for v4 commands.

---

## 13. NEW Directories for v4

### checks/ — NEW
```
checks/
  surrealdb.json          -- SurrealDB v3 check file
  nuxt.json               -- Nuxt 4 check file
  tailwind.json           -- Tailwind CSS v4 check file
  bun.json                -- Bun runtime check file
  hono.json               -- Hono API check file
  metrics.json            -- GITIGNORED. Computed by stack-metrics.sh.
  test-fixtures/
    surrealdb/good/       -- Should all PASS
    surrealdb/bad/        -- Should all FAIL
    nuxt/good/
    nuxt/bad/
    degradation/          -- Chaos test scenarios
```

### tools/ — NEW
```
tools/
  stack-detect.sh         -- Detects technologies from package.json/configs
  stack-check.sh          -- Runs static checks (grep patterns from check files)
  stack-preflight.sh      -- Verifies CLIs, MCP, DB, SDK versions
  stack-metrics.sh        -- Aggregates audit artifacts into metrics.json
  toolkit-resolve         -- Shell function: resolves abstract operation names
```

### config/ — NEW
```
config/
  interfaces.json         -- Maps abstract operations to concrete commands
```

---

## 14. Rationalized File Tree (v4)

```
scott-toolkit/
├── CHANGELOG.md                          # Version history
├── README.md                             # Quick start + architecture (absorbs conventions.md)
├── setup.sh                              # Deploys to ~/.claude/ (extended for v4)
├── start-n8n.sh                          # Utility: start n8n
├── start-surreal.sh                      # Utility: start SurrealDB
├── scott-toolkit-instructions.pdf        # Generated user guide for Brett
│
├── checks/                               # NEW: Stack enforcement check files
│   ├── surrealdb.json
│   ├── nuxt.json
│   ├── tailwind.json
│   ├── bun.json
│   ├── hono.json
│   └── test-fixtures/
│       ├── surrealdb/good/
│       ├── surrealdb/bad/
│       ├── nuxt/good/
│       ├── nuxt/bad/
│       └── degradation/
│
├── config/                               # NEW: Decoupling config
│   └── interfaces.json
│
├── context/                              # Project templates
│   ├── CLAUDE-MD-TEMPLATE.md             # (updated: report_mode, stack-lock note)
│   ├── DESIGN-INTENT-TEMPLATE.md
│   ├── PRD-TEMPLATE.md
│   └── RETRO-TEMPLATE.md                 # (updated: lesson tags)
│
├── docs/                                 # Design docs + user guide
│   ├── toolkit-rewrite-design.md         # v4 design document
│   └── user-guide.md                     # (moved from root: scott-toolkit-instructions.md)
│
├── errors/                               # Error logs (learning loop data)
│   ├── _metadata.json
│   └── *.md                              # (naming: NNN-description.md going forward)
│
├── hooks/                                # Shell hooks (14 existing + 2 new)
│   ├── auto-format.sh
│   ├── check-file-test-trigger.sh        # NEW: auto-runs test fixtures on check edits
│   ├── context-reminders.sh
│   ├── extract-instincts.sh
│   ├── guard-claude-md.sh
│   ├── guard-destructive.sh
│   ├── guard-git-push.sh
│   ├── guard-npm-install.sh              # (extended: stack-lock drift detection)
│   ├── guard-phase-completion.sh
│   ├── offload-large-output.sh
│   ├── post-commit-skill-triggers.sh
│   ├── pre-compact.sh
│   ├── pre-completion-checklist.sh
│   ├── session-end.sh
│   ├── session-start.sh                  # (updated: stack-lock staleness check)
│   └── uiux-reminder.sh                  # NEW: /impeccable:audit nudge for .vue
│
├── references/                           # Cross-project reference docs
│   ├── ADR-003-infrastructure.md
│   ├── bresco-context.md
│   ├── hetzner-surrealdb-setup.md
│   └── project-catalog.md
│
├── retros/                               # Milestone retrospectives
│   ├── _retro-index.md
│   └── *.md
│
├── rules/                                # Persistent behavioral rules
│   ├── claude-behavior.md                # (rewritten: stack validation, decoupled refs)
│   └── code-style.md                     # (minor: version compliance note)
│
├── skills/                               # All skills (24 existing + 3 new)
│   ├── advosy-claimsforce/
│   ├── advosy-context/                   # (absorbs references/advosy-context.md)
│   ├── advosy-crm/
│   ├── pause/
│   ├── scott-automation-guide/
│   ├── scott-bops/
│   ├── scott-bypass/
│   ├── scott-compare-sources/
│   ├── scott-debug/
│   ├── scott-handoff/
│   ├── scott-human-nature/
│   ├── scott-mastery/
│   ├── scott-n8n-reference/
│   ├── scott-new-feature/
│   ├── scott-new-project/
│   ├── scott-phase-closeout/
│   ├── scott-power-laws/
│   ├── scott-presentation/
│   ├── scott-rebuild-metrics/            # NEW: regenerate metrics.json
│   ├── scott-resume/
│   ├── scott-save-tweet/
│   ├── scott-stack-baseline/             # NEW: first-run audit for existing projects
│   ├── scott-stack-review/               # NEW: check health dashboard
│   ├── scott-surrealdb/                  # (absorbs references/surrealdb-v3-reference.md)
│   ├── scott-uiux/
│   ├── scott-update-toolkit/
│   ├── scott-war-strategies/
│   └── skill-creator/
│
├── successes/                            # Success logs (learning loop data)
│   ├── _metadata.json
│   └── *.md
│
├── tools/                                # NEW: CLI tools for stack enforcement
│   ├── stack-check.sh
│   ├── stack-detect.sh
│   ├── stack-metrics.sh
│   └── stack-preflight.sh
│
└── workflows/                            # Multi-phase orchestrations
    ├── compare-sources.md
    ├── handoff-to-gary.md                # (minor: stack-lock in handoff artifacts)
    ├── log-error.md                      # (note: supplementary to phase-closeout)
    ├── log-success.md                    # (note: supplementary to phase-closeout)
    ├── new-feature.md                    # (minor: decouple command refs)
    ├── new-project.md                    # (updated: stack-lock generation in Phase 5)
    ├── phase-closeout.md                 # (rewritten: Phase 1.5 stack audit)
    ├── resume-project.md                 # (updated: stack-lock staleness check)
    ├── retro.md                          # (note: milestone-level, not phase-level)
    ├── toolkit-spa-day.md                # (extended: stack-review + interfaces.json audit)
    └── toolkit-update.md                 # (updated: awareness of v4 dirs)
```

## 15. Files REMOVED (8 total)

| File | Reason | Content destination |
|------|--------|-------------------|
| `about-me.md` | Duplicated by README + CLAUDE.md | None needed |
| `conventions.md` | Absorbed into README.md | README.md |
| `knowledge/active/surrealdb.md` | Duplicated by skill | skills/scott-surrealdb/ |
| `knowledge/active/n8n-integration.md` | Duplicated by skill | skills/scott-n8n-reference/ |
| `knowledge/active/nuxt-ui-v4.md` | Partially duplicated | skills/scott-uiux/references/ |
| `knowledge/active/context-protection.md` | Duplicated by rule | rules/claude-behavior.md |
| `knowledge/archive/*` (4 files) | Stale, superseded | None needed |
| `references/advosy-context.md` | Duplicated by skill | skills/advosy-context/ |
| `references/gsd-upstream-proposals.md` | Stale | None needed |
| `references/ADR-001-schema-bridge.md` | Project-specific | Move to Eleanor repo |
| `references/ADR-002-migrations.md` | Project-specific | Move to Eleanor repo |

## 16. Files ADDED (8 total)

| File | Purpose | Design doc section |
|------|---------|-------------------|
| `checks/*.json` (5 files) | Per-technology check files | 5.2 |
| `checks/test-fixtures/` | Audit self-testing | 5.16 |
| `config/interfaces.json` | Decoupling config | 7.1 |
| `tools/stack-detect.sh` | Detect project technologies | 5.1 |
| `tools/stack-check.sh` | Run static checks | 5.1 |
| `tools/stack-preflight.sh` | Pre-flight system checks | 5.1 |
| `tools/stack-metrics.sh` | Aggregate audit metrics | 5.1, 6.3 |
| `hooks/uiux-reminder.sh` | Vue file UI/UX nudge | 5.21 |
| `hooks/check-file-test-trigger.sh` | Auto-test on check edits | 5.16 |
| `skills/scott-stack-review/` | Check health dashboard | 6.4 |
| `skills/scott-stack-baseline/` | First-run baseline audit | 5.15 |
| `skills/scott-rebuild-metrics/` | Regenerate metrics.json | 6.3 |
| `docs/user-guide.md` | Moved from root | - |

## 17. Cross-Cutting Concerns

### Decoupling Impact
Files that currently hardcode GSD/Superpowers commands and need updating:
1. `rules/claude-behavior.md` — 13 hardcoded commands
2. `workflows/phase-closeout.md` — references `superpowers:requesting-code-review`
3. `workflows/new-project.md` — references GSD commands
4. `workflows/new-feature.md` — references GSD commands
5. `workflows/resume-project.md` — references GSD commands
6. `workflows/handoff-to-gary.md` — references GSD commands
7. `skills/scott-debug/SKILL.md` — may reference GSD/Superpowers

**Migration approach:** Per Section 7.4, update one file at a time. No big-bang migration. Files with hardcoded refs still work until updated.

### Learning Loop Data Flow
```
Project lessons.md → [stack] tag → stack-metrics.sh → metrics.json → /scott:stack-review → Scott approves → checks/*.json
```
Files involved: phase-closeout.md (tagging), tools/stack-metrics.sh (aggregation), skills/scott-stack-review/ (dashboard), checks/*.json (destination).

### Context Window Budget
Files loaded every session: claude-behavior.md (116 lines) + code-style.md (41 lines) = ~157 lines of rules.
v4 adds: interfaces.json resolution rule (~5 lines in CLAUDE.md) + stack validation section in claude-behavior.md (~15 lines).
**Total: ~177 lines. Well within budget.**
