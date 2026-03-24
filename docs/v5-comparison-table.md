# Toolkit Comparison: Existing vs v4 vs v5

**Date:** 2026-03-23
**Purpose:** Side-by-side comparison of every toolkit dimension across all three states.

**Column definitions:**
- **Existing (v2.14):** What the toolkit does today, as shipped.
- **v4 Design:** What the v4 design doc proposed adding. Treated the existing toolkit as a fixed base.
- **v5 Unified:** What v5 does. Merges rationalization + v4 additions into one implementation.
- **Explanation:** Why this dimension matters and what problem it solves.
- **Recommendation:** The final call on what to do.
- **v5 Synthesis:** How v5 completes or resolves this dimension. What's different from just doing v4.

---

## 1. Directory Structure

| Dimension | Existing (v2.14) | v4 Design | v5 Unified | Explanation | Recommendation | v5 Synthesis |
|-----------|-----------------|-----------|------------|-------------|----------------|--------------|
| **checks/** | Does not exist | ADD: 5 check files + test-fixtures/ | ADD: same as v4 | Per-technology enforcement rules (static patterns, live checks, tool refs). The core of stack enforcement. | Add in Step 1 | v5 inherits v4's design unchanged. No rationalization needed for new directories. |
| **config/** | Does not exist | ADD: interfaces.json | ADD: same as v4 | Decoupling layer. Maps abstract operation names to concrete GSD/Superpowers commands. | Add in Step 6 | v5 inherits v4's design unchanged. |
| **context/** | 4 templates (CLAUDE-MD, PRD, Design Intent, Retro) | Minor updates to 2 templates | Same updates + considered rename to templates/ | Project creation templates. Used by /scott:new-project. | Keep as context/. Update CLAUDE-MD-TEMPLATE (report_mode) and RETRO-TEMPLATE (lesson tags). Rename rejected: "context" describes what they provide, not what they are. | v5 confirms the v4 updates and explicitly rejects the rename after evaluation. No additional changes. |
| **docs/** | 1 file (toolkit-rewrite-design.md) | No changes proposed | Expand: move user-guide here, keep design history, add v5 doc | Design documents and user-facing guide. Currently undersized because the user guide lives in root. | Move scott-toolkit-instructions.md here as user-guide.md. Keep design docs as history. | v5 fixes a placement problem v4 ignored. The user guide was sitting in root with no clear reason. docs/ becomes the home for both design docs and the user guide. |
| **errors/** | 11 files (10 error logs + _metadata.json) | No changes | No changes. Forward-only naming standardization. | Error logs from all projects. Learning loop input data. Inconsistent naming (error-001.md vs 008-eod-timezone-regression.md). | Keep all. New errors use NNN-description.md format. No retroactive rename. | v5 adds a naming convention v4 didn't address. Small but prevents future inconsistency. |
| **hooks/** | 14 hooks | Extend 2, add 2 new | Same as v4 | Shell scripts triggered by Claude Code events. Can't be skipped. The enforcement backbone. | Keep all 14. Extend guard-npm-install.sh (drift) and session-start.sh (staleness). Add uiux-reminder.sh and check-file-test-trigger.sh. | v5 inherits v4's hook changes unchanged. |
| **knowledge/** | 8 files (4 active, 4 archived) | No changes proposed | ELIMINATE entire directory | Reference material that predates the skill system. Every active file duplicates a skill. Every archived file is stale. 2,874 lines of duplication/dead weight. | Delete after absorbing unique content into matching skills. | **This is the single biggest v5 contribution.** v4 would have left 2,874 lines of duplication sitting next to the new check files. v5 eliminates it, establishing the two-tier knowledge rule (skills + references, nothing else). |
| **references/** | 9 files | No changes proposed | Shrink from 9 to 4 files | Cross-project reference docs. Contains project-specific ADRs that don't belong here, plus duplicated content. | Remove 2 (duplicated, stale). Move 2 to Eleanor repo. Move 1 under its matching skill. Keep 4 toolkit-wide files. | **v4 left 5 problematic files untouched.** v5 fixes placement (ADRs to Eleanor), eliminates duplication (advosy-context.md absorbed into skill), and moves the SurrealDB reference under its skill. references/ becomes a clean 4-file directory of truly cross-project docs. |
| **retros/** | 5 files | No changes | No changes | Milestone retrospectives. Human-readable records. | Keep as-is. | Both v4 and v5 leave retros/ unchanged. Correct. |
| **rules/** | 2 files (claude-behavior.md, code-style.md) | Rewrite claude-behavior.md | Same rewrite + minor code-style.md update | Loaded every session. The master behavioral ruleset. | Rewrite claude-behavior.md (stack validation, decoupled refs, learning loop). Add version compliance note to code-style.md. | v5 adds the code-style.md note that v4 missed. Clarifies that version-specific compliance is handled by check files, not style rules. Prevents future scope confusion. |
| **skills/** | 24 skill directories | Add 3 new skills | Same 3 new skills + absorb content into 3 existing skills | Reusable prompt-driven workflows and domain knowledge. The primary knowledge delivery mechanism. | Keep all 24. Add scott-stack-review, scott-stack-baseline, scott-rebuild-metrics. Absorb knowledge/references content into scott-surrealdb, scott-uiux, advosy-context. | v5 makes existing skills richer by absorbing orphaned content. v4 just added new skills alongside duplicated knowledge files. |
| **successes/** | 8 files | No changes | No changes. Forward-only naming. | Success logs. Same situation as errors/. | Keep. Same naming standardization. | Same as errors/. v5 adds naming convention. |
| **tools/** | Does not exist | ADD: 4 CLI scripts + toolkit-resolve | ADD: same as v4 | Deterministic, zero-token stack analysis tools. | Add in Step 2 | v5 inherits v4's design unchanged. |
| **workflows/** | 11 files | Rewrite 1, update 6 | Same rewrites + scope notes on 3 supplementary workflows | Multi-step orchestrations. Skills wrap these for invocation. | Rewrite phase-closeout.md. Update 6 others. Add scope notes to log-error, log-success, retro. | v5 adds scope notes v4 didn't address. Without them, the relationship between phase-closeout and the three supplementary workflows stays ambiguous. |

---

## 2. Root-Level Files

| File | Existing (v2.14) | v4 Design | v5 Unified | Explanation | Recommendation | v5 Synthesis |
|------|-----------------|-----------|------------|-------------|----------------|--------------|
| **about-me.md** | 19 lines. "I'm Scott. This is my toolkit." | No changes proposed | REMOVE | Duplicated by README.md ("what this is") and ~/.claude/CLAUDE.md ("who Scott is"). | Remove. | v4 ignored this. v5 removes 19 lines of pure duplication that every session could potentially load. |
| **CHANGELOG.md** | ~200 lines. Version history. | No changes | Bump to v5 | Tracks all toolkit modifications. Essential. | Keep. Bump version. | Both agree. |
| **conventions.md** | 25 lines. Folder structure + toolkit rules. | No changes proposed | ABSORB into README.md, then remove | 80% overlap with README. The 20% that's unique (always update changelog, don't modify settings.json) belongs in README. | Merge into README. Delete. | v4 ignored this. v5 eliminates a file that serves no purpose README doesn't already serve. |
| **README.md** | 50 lines. Quick start + architecture. | Update for v4 | Update for v5 + absorb conventions.md | Developer-facing docs. The entry point for understanding the toolkit. | Update architecture, absorb conventions, add v5 directories. | v5 makes README the single project overview by absorbing conventions.md. v4 would have updated README while leaving conventions.md as a redundant shadow. |
| **scott-toolkit-instructions.md** | ~80 lines. User guide for Scott/Brett. | No changes proposed | MOVE to docs/user-guide.md | User-facing "how to use" guide. Source for the PDF. Currently sitting in root alongside 9 other files. | Move to docs/. Update for v5 commands. | v4 left this in root. v5 puts it where user guides belong (docs/). Root stays lean: 6 files, not 7+. |
| **scott-toolkit-instructions.pdf** | Generated from .md. Shared with Brett. | No changes | Regenerate after v5 | Brett's reference copy. Must stay in root for easy sharing via GitHub. | Keep in root. Regenerate. | Both agree. |
| **setup.sh** | 226 lines. Deploys to ~/.claude/ via symlinks. | Extend for checks/, tools/, config/ | Same v4 extensions | The deployment pipeline. Everything flows through this script. | Extend to deploy 3 new directories. Update version banner. Update verification section. | v5 inherits v4's design unchanged. |
| **start-n8n.sh** | Convenience script. | No changes | No changes | Not toolkit config. Utility script. | Keep. | Both agree. |
| **start-surreal.sh** | Convenience script. | No changes | No changes | Same as above. | Keep. | Both agree. |
| **.claude-resume.md** | Ephemeral. Written by pre-compact hook. | Not addressed | Gitignore | Session state. Not a permanent file. Shows up in `git status` as noise. | Add to .gitignore. | v4 didn't address this. v5 cleans up the git noise. |

---

## 3. Stack Enforcement System

| Dimension | Existing (v2.14) | v4 Design | v5 Unified | Explanation | Recommendation | v5 Synthesis |
|-----------|-----------------|-----------|------------|-------------|----------------|--------------|
| **Check files** | Don't exist. Knowledge lives in skills (opt-in). | 5 JSON files, one per technology | Same as v4 | The atomic unit of enforcement. Each file defines static patterns, live checks, tool references, Context7 IDs. | Create surrealdb.json, nuxt.json, tailwind.json, bun.json, hono.json. | v5 inherits v4 unchanged. Check files are new, no rationalization needed. |
| **stack-lock.json** | Doesn't exist. No per-project stack record. | Per-project config. Auto-generated from stack-detect.sh. | Same as v4 | Records which technologies a project uses, at what versions, with what exceptions. The bridge between toolkit checks and project code. | Auto-generate during /scott:new-project. Two tiers (full projects vs experiments). | v5 inherits v4 unchanged. |
| **Static checks** | None. Claude remembers (or doesn't). | stack-check.sh runs grep patterns from check files. Zero tokens. | Same as v4 | Catches pattern-level violations (type::thing(), <future>, etc.) instantly via CLI. No AI needed. | Build in Step 2. Run every execution step. | v5 inherits v4 unchanged. |
| **Live checks** | None. Only code-reading reviews. | Audit agents run schemas against live DB, test query patterns. | Same as v4 | Catches runtime bugs that static analysis can't find. The Bresco evidence (3 bugs missed by review, caught by live audit). | Build in Step 3. Batch every 3-5 DB-touching steps during execution. Full run at closeout. | v5 inherits v4 unchanged. |
| **Three touchpoints** | No audit touchpoints. Reviews are the only gate. | Planning, Executing, Closeout | Same as v4 | Progressive enforcement: light at planning, medium during execution, thorough at closeout. | Implement in Steps 3+5. | v5 inherits v4 unchanged. |
| **Degradation tiers** | No degradation concept. Full or nothing. | Full, Reduced, Minimal, Bypass. Dynamic degradation on agent timeout. | Same as v4 | Prevents the "everything works or nothing runs" cliff. Graceful fallback when Context7 is down or MCP times out. | 4 tiers. Auto-detection via stack-preflight.sh. | v5 inherits v4 unchanged. |
| **Test fixtures** | Don't exist. | Good/bad samples per technology + degradation chaos tests. | Same as v4, but also adds check-file-test-trigger.sh hook | Self-testing for the audit system. Known-good code must PASS, known-bad must FAIL. Chaos tests verify degradation tiers work. | Build in Step 3. Auto-trigger via new hook on check file edits. | v5 inherits v4 unchanged. |
| **Audit artifacts** | Don't exist. | Structured JSON per audit run. fix_attempts field for fix quality measurement. | Same as v4 | Machine-readable records that feed the learning loop. Without structured artifacts, the loop has no input data. | JSON schema defined in Section 7.17. Written to .planning/audits/. | v5 inherits v4 unchanged. |
| **Scoped loading** | N/A | Hard rule: agents only load check files for technologies in the dispatch table. | Same as v4 | Loading all check files into every agent wastes tokens and reduces effectiveness. Correctness requirement, not optimization. | Enforce via dispatch table. | v5 inherits v4 unchanged. |
| **UI/UX reminder** | No nudge for design quality. | PostToolUse hook: "Consider running /impeccable:audit" when .vue files written. Non-blocking, once per phase. | Same as v4 | AI is bad at UI/UX. Skills exist (/impeccable:audit, /scott:uiux) but are opt-in and forgettable. This bridges "exists" and "remembered." | Add uiux-reminder.sh in Step 4. | v5 inherits v4 unchanged. |

---

## 4. Learning Loop

| Dimension | Existing (v2.14) | v4 Design | v5 Unified | Explanation | Recommendation | v5 Synthesis |
|-----------|-----------------|-----------|------------|-------------|----------------|--------------|
| **Lesson collection** | tasks/lessons.md per project. Free text. No tags. | Claude suggests [stack]/[pattern]/[project] tags during phase-closeout reflection. | Same as v4 | Without tags, stack-relevant lessons are buried in project-specific files. Claude suggests tags (recognition > recall) so Scott doesn't forget. | Integrate into phase-closeout reflection (Step 7e). | v5 inherits v4 unchanged. |
| **Cross-project aggregation** | None. Lessons stay siloed in each project. | stack-metrics.sh scans ~/Sites/ for projects with stack-lock.json + .planning/audits/. Aggregates into metrics.json. | Same as v4 | The mechanism that turns per-project lessons into toolkit-wide improvements. Without aggregation, knowledge stays siloed forever. | Build stack-metrics.sh in Step 7a. | v5 inherits v4 unchanged. |
| **Review dashboard** | Doesn't exist. | /scott:stack-review: 5-section dashboard (system health, new candidates, check health, refinement, overlap). | Same as v4 | The human decision point. System recommends, Scott decides. No automatic promotion. | Create skill in Step 7b. Recommended cadence: monthly (aligned with spa day). | v5 additionally integrates stack-review into toolkit-spa-day.md (Step 8e). v4 designed the dashboard but didn't update spa day to include it. |
| **Check promotion** | No concept. Lessons are captured but don't flow back. | Scott approves a lesson, system generates a check entry, applies to all projects. | Same as v4 | The closed loop. Lesson captured in Bresco today prevents the same bug in Eleanor tomorrow. | Human gate on all promotions. | v5 inherits v4 unchanged. |
| **Pruning** | No concept. | Threshold-based: live checks flagged at 60 days of zero catches, static at 90 days. | Same as v4 | Prevents check bloat. Cost-based split: free checks (static grep) get longer runway than token-burning checks (live agents). | Implement with metrics.json. Surface in stack-review. | v5 inherits v4 unchanged. |
| **metrics.json lifecycle** | N/A | Gitignored. Computed cache. Regenerated from audit artifacts via /scott:rebuild-metrics. | Same as v4 | metrics.json is derived data, not source data. Losing it is painless: regenerate from audit artifacts. | Gitignore. Add rebuild skill. | v5 inherits v4 unchanged. |
| **Error/success logs as input** | Logs exist (errors/, successes/) but aren't consumed by any system. | Not explicitly addressed. | Forward-only naming standardization. Logs remain as learning loop input alongside audit artifacts. | Error and success logs are the raw evidence that feeds retros and stack-review. Consistent naming helps stack-metrics.sh scan them. | Keep logs. Standardize naming going forward. | v5 connects error/success logs to the learning loop more explicitly than v4 by standardizing their format for machine readability. |

---

## 5. Decoupling

| Dimension | Existing (v2.14) | v4 Design | v5 Unified | Explanation | Recommendation | v5 Synthesis |
|-----------|-----------------|-----------|------------|-------------|----------------|--------------|
| **External command references** | ~13 hardcoded across ~10 files (per v4 count) | interfaces.json maps 12 abstract operations to concrete commands | interfaces.json maps 17 abstract operations to concrete commands | If GSD renames /gsd:plan-phase to /gsd:plan, the toolkit currently breaks in 10+ places. interfaces.json makes it a one-line fix. | Create interfaces.json in Step 6a. | **v5 found 4 more hardcoded references** the v4 audit missed (quick_task, debug_gsd, add_tests, debug_systematic). The full v5 audit identified 17 operations across all files, not the 12 v4 counted. |
| **Resolution mechanism** | N/A | toolkit-resolve shell function + claude-behavior.md resolution rule | Same as v4 | Hooks use toolkit-resolve (shell). Workflows/skills use abstract names that Claude resolves by reading interfaces.json. | Build toolkit-resolve in Step 6b. Add resolution rule to claude-behavior.md in Step 6c. | v5 inherits v4 unchanged. |
| **Provider health check** | N/A | stack-preflight.sh verifies all interfaces.json commands are resolvable | Same as v4 | Catches broken mappings before they cause runtime failures. type field tells preflight how to verify (command registration vs skill file exists). | Extend stack-preflight.sh in Step 6e. | v5 inherits v4 unchanged. |
| **Migration path** | N/A | One file at a time. No big-bang. Hardcoded refs still work until updated. | Same as v4 | Gradual migration prevents breakage. Each file update is independently testable. | Follow migration order in Step 6d. | v5 inherits v4 unchanged. |
| **CLAUDE.md size discipline** | No budget. Toolkit section can grow unbounded. | Soft budget: ~20 lines. Review during stack-review. | Same as v4 | Knowledge belongs in check files, Context7, and skills, not in CLAUDE.md. Unbounded CLAUDE.md wastes context tokens every session. | Enforce soft budget. | v5 inherits v4 unchanged. |

---

## 6. Knowledge Management

| Dimension | Existing (v2.14) | v4 Design | v5 Unified | Explanation | Recommendation | v5 Synthesis |
|-----------|-----------------|-----------|------------|-------------|----------------|--------------|
| **Knowledge stores** | Three overlapping: knowledge/ (8 files), skills/ (24 dirs), references/ (9 files) | No changes to knowledge/ or references/ | Collapse to two tiers: skills/ (quick-access) and references/ (deep, standalone or under skills). Delete knowledge/. | The same SurrealDB info lives in 3 places. The same n8n info lives in 2 places. The same Advosy context lives in 2 places. Every duplicate is a context window tax and a consistency risk. | Eliminate knowledge/. Absorb unique content. Enforce one-place rule. | **This is the core rationalization v4 didn't do.** v4 would have added checks/ and tools/ on top of 2,874 lines of duplicated/stale knowledge. v5 removes the rot first. |
| **knowledge/active/** | 4 files, 1,196 lines. SurrealDB, n8n, Nuxt UI v4, context protection. | Untouched | Absorb into matching skills, then delete | Every file duplicates a skill: surrealdb.md vs scott-surrealdb/SKILL.md, n8n-integration.md vs scott-n8n-reference/, nuxt-ui-v4.md vs Context7 + scott-uiux/, context-protection.md vs claude-behavior.md. | Absorb unique content. Delete files. Delete directory. | v5 ensures no knowledge is lost: unique content moves to the canonical location before deletion. |
| **knowledge/archive/** | 4 files, 1,678 lines. Error handling, frontend design, Rust/Tauri, Tauri/Nuxt. | Untouched | DELETE all 4 files | All superseded. Error handling by general patterns. Frontend design by scott-uiux + Impeccable. Rust/Tauri by Context7. Tauri/Nuxt is Eleanor-specific. | Delete. No absorption needed. | v5 removes 1,678 lines of dead weight v4 would have carried forward. |
| **references/ cleanup** | 9 files. 3 are project-specific, 1 is stale, 1 duplicates a skill. | Untouched | Shrink from 9 to 4 files | ADR-001 and ADR-002 are Eleanor decisions, not toolkit-wide. gsd-upstream-proposals is 26 stale lines. advosy-context.md duplicates a skill. surrealdb-v3-reference.md should live under its skill. | Move 2 ADRs to Eleanor, delete 2, move 1 under skill. Keep 4 (ADR-003, bresco-context, hetzner-setup, project-catalog). | v5 applies the one-place rule to references/ too. v4 ignored all 9 files. |
| **One-place rule** | No rule. Content accumulates wherever someone puts it. | No rule proposed | "Every reference lives in exactly one place. If a matching skill exists, it lives under the skill. If not, it lives in references/. Never both." | Without this rule, the three-store problem will re-emerge. The rule is enforced during toolkit-spa-day and toolkit-update. | Codify in README.md and toolkit-spa-day.md. | **v5's most important architectural contribution.** The rationalization is a one-time cleanup; the rule prevents re-accumulation. v4 had no mechanism to prevent future duplication. |

---

## 7. Hooks (detailed)

| Hook | Existing (v2.14) | v4 Design | v5 Unified | Explanation | Recommendation | v5 Synthesis |
|------|-----------------|-----------|------------|-------------|----------------|--------------|
| **auto-format.sh** | Runs Prettier on changed files | No changes | No changes | Code formatting. Orthogonal to stack enforcement. | Keep. | Both agree. |
| **context-reminders.sh** | Warns at 60min / 100 tool uses | No changes | No changes | Context rot detection. Critical for long sessions. | Keep. | Both agree. |
| **extract-instincts.sh** | Extracts patterns for instinct-candidates.md | No changes | No changes | Feeds the learning loop indirectly. | Keep. | Both agree. |
| **guard-claude-md.sh** | Blocks unintended CLAUDE.md edits | No changes | No changes | Prevents accidental CLAUDE.md modifications. More important with ~20 line soft budget. | Keep. | Both agree. |
| **guard-destructive.sh** | Blocks rm -rf, git reset --hard, etc. | No changes | No changes | Safety net against destructive commands. | Keep. | Both agree. |
| **guard-git-push.sh** | Confirms before git push | No changes | No changes | Push safety. | Keep. | Both agree. |
| **guard-npm-install.sh** | Confirms before npm/pnpm install | Extend: compare against stack-lock.json for drift | Same as v4 | Without drift detection, someone can `pnpm add surrealdb@1.0` and the stack-lock becomes a lie. | Extend in Step 4a. | v5 inherits v4 unchanged. |
| **guard-phase-completion.sh** | Blocks phase completion without .post-execution-complete | No changes | No changes | THE enforcement gate. Stack audit runs inside phase-closeout (which writes the marker), so this hook indirectly enforces the audit. | Keep. No changes needed because enforcement is layered correctly. | Both agree. No changes needed because the stack audit is inside phase-closeout, which already must complete before this hook allows progression. |
| **offload-large-output.sh** | Saves large tool outputs to disk | No changes | No changes | Context window protection. Audit reports could be large. | Keep. | Both agree. |
| **post-commit-skill-triggers.sh** | Triggers skill-specific actions after commits | No changes | No changes | Could theoretically trigger stack-check.sh, but the execution-step audit already handles this. | Keep. No extension needed. | Both agree. |
| **pre-compact.sh** | Saves context snapshot before compaction | No changes | No changes | Context recovery after compaction. | Keep. | Both agree. |
| **pre-completion-checklist.sh** | Reminds of completion checklist | No changes | No changes | Could add "stack audit passed?" but guard-phase-completion.sh already enforces this. | Keep. No extension needed. | Both agree. |
| **session-end.sh** | Cleanup at session end | No changes | No changes | Session cleanup. | Keep. | Both agree. |
| **session-start.sh** | Pulls config, shows project context | Minor update: stack-lock staleness check | Same as v4 | Proactive nudge when stack-lock hasn't been reviewed in 30+ days. Cheap awareness that prevents stale checks from going unnoticed. | Update in Step 4b. | v5 inherits v4 unchanged. |
| **uiux-reminder.sh** | Doesn't exist | ADD: PostToolUse hook for .vue files | Same as v4 | Non-blocking nudge toward /impeccable:audit. Once per phase. | Add in Step 4c. | v5 inherits v4 unchanged. |
| **check-file-test-trigger.sh** | Doesn't exist | ADD: PostToolUse hook for check file edits | Same as v4 | Auto-runs test fixtures when check files change. Prevents broken checks from shipping. | Add in Step 3d. | v5 inherits v4 unchanged. |

---

## 8. Workflows (detailed)

| Workflow | Existing (v2.14) | v4 Design | v5 Unified | Explanation | Recommendation | v5 Synthesis |
|----------|-----------------|-----------|------------|-------------|----------------|--------------|
| **phase-closeout.md** | 4 phases: Verify, Code Review, Reflect, Gate | REWRITE: Insert Phase 1.5 Stack Audit. Update Reflect with lesson tagging. | Same as v4 + decouple command refs | The most important workflow. Hook-enforced gate. Adding the stack audit here means it can't be skipped. Lesson tagging feeds the learning loop. | Rewrite in Step 3a. | v5 inherits v4's structural changes and also decouples the hardcoded `superpowers:requesting-code-review` reference. v4 designed the Phase 1.5 but didn't address the hardcoded command in Phase 2. |
| **new-project.md** | 8-phase guided kickoff (v1.7) | Update: add stack-lock generation to Phase 5 | Same as v4 + decouple all command refs | During project creation is the natural moment to generate stack-lock.json. Auto-detect from package.json, Scott approves. | Update in Step 5a. | v5 inherits v4's stack-lock generation and additionally decouples all GSD/Superpowers refs in the build phases. |
| **new-feature.md** | 5-phase feature addition (v2.2) | Decouple command refs | Same as v4 | No structural changes. Just replace hardcoded commands with abstract operation names. | Update in Step 6d. | v5 inherits v4 unchanged. |
| **resume-project.md** | 4-phase resume (v2.1) | Update: stack-lock staleness check in Phase 1 | Same as v4 + decouple refs | When resuming a project, check if the stack-lock was last reviewed 30+ days ago. Catches stale projects. | Update in Step 5b. | v5 inherits v4's staleness check and also decouples command refs. |
| **handoff-to-gary.md** | 5-phase handoff (v1.3) | No changes proposed | Update: include stack-lock.json in handoff artifacts + decouple refs | Gary should know what stack versions are enforced. Without this, he might upgrade a dependency that breaks enforcement. | Update in Step 8g. | **v4 missed this entirely.** v5 ensures the handoff includes stack-lock.json so Gary inherits the enforcement context, not just the code. |
| **toolkit-update.md** | 6-phase self-update (v1.2) | No changes proposed | Update: awareness of v5 directories (checks/, tools/, config/) | When updating the toolkit, the developer needs to know about the new directories. Without this, someone might update a check file without updating test fixtures. | Update in Step 8f. | **v4 missed this.** v5 ensures the self-update workflow knows about all v5 directories. |
| **compare-sources.md** | 6-phase source comparison (v1.3) | No changes | No changes | Orthogonal to stack enforcement. Compares context engineering sources against toolkit config. | Keep as-is. | Both agree. |
| **log-error.md** | Error capture workflow (v1.1) | No changes proposed | Add scope note: "For GSD phase errors, use /scott:phase-closeout" | Without the scope note, it's unclear when to use this vs phase-closeout. phase-closeout subsumes it for GSD phases, but this is still needed for mid-session captures. | Add note in Step 0j. | **v4 left the ambiguity.** v5 clarifies the relationship explicitly. |
| **log-success.md** | Success capture workflow (v1.1) | No changes proposed | Add scope note (same pattern as log-error) | Same ambiguity as log-error. | Add note in Step 0j. | Same as above. |
| **retro.md** | Post-milestone retro (v1.1) | No changes proposed | Add scope note: "phase-closeout captures phase-level retros. This is for milestone/project-level retros." | phase-closeout Reflect phase produces per-phase retros. This workflow is for bigger-picture reviews. The scope difference isn't documented. | Add note in Step 0j. | **v4 left the ambiguity.** v5 clarifies that phase-closeout and retro.md operate at different scopes. |
| **toolkit-spa-day.md** | Monthly consolidation (v1.0) | No changes proposed | EXTEND: add "Review Stack Check Health" phase + "Review interfaces.json" phase | Spa day is the natural cadence for running /scott:stack-review and checking for stale interface mappings. Without this, the learning loop and decoupling layer have no regular maintenance trigger. | Extend in Step 8e. | **v4 designed the stack-review dashboard but didn't integrate it into any existing cadence.** v5 wires it into spa day so it actually gets run. |

---

## 9. Skills (detailed)

| Skill | Existing (v2.14) | v4 Design | v5 Unified | Explanation | Recommendation | v5 Synthesis |
|-------|-----------------|-----------|------------|-------------|----------------|--------------|
| **Domain skills** (10 total: advosy-claimsforce, advosy-context, advosy-crm, scott-bops, scott-human-nature, scott-mastery, scott-power-laws, scott-war-strategies, scott-presentation, scott-uiux) | All exist | No changes | No changes (3 absorb content from knowledge/references) | Personal/business domain knowledge. Not affected by stack enforcement. | Keep all. advosy-context absorbs references/advosy-context.md. scott-surrealdb absorbs surrealdb-v3-reference.md. scott-uiux absorbs nuxt-ui-v4 patterns. | v5 makes 3 skills richer by absorbing orphaned content. v4 left the content duplicated. |
| **Technical skills** (4 total: scott-surrealdb, scott-n8n-reference, scott-automation-guide, scott-save-tweet) | All exist | No changes | scott-surrealdb absorbs v3-reference.md | Technical reference skills. scott-surrealdb is complemented by checks/surrealdb.json (skill = knowledge, check = enforcement). | Keep all. | v5 completes the knowledge consolidation for scott-surrealdb. |
| **Workflow wrappers** (7 total: generated by setup.sh) | All exist. Thin wrappers pointing to workflow .md files. | No changes | No changes | Auto-generated by setup.sh. Point to the real workflow files. | Keep. Generated, not hand-maintained. | Both agree. |
| **Operational skills** (3 total: scott-debug, scott-bypass, pause) | All exist | No changes proposed | scott-debug: decouple command refs | Tools for debugging, bypassing hooks, and pausing sessions. scott-debug may reference GSD/Superpowers commands. | Keep. Decouple scott-debug refs in Step 6d. | v5 catches a decoupling target v4 missed (scott-debug likely references /gsd:debug or superpowers:systematic-debugging). |
| **skill-creator** | Exists. Large (10+ files). | No changes | No changes | Self-contained skill for creating/testing/benchmarking skills. | Keep. | Both agree. |
| **scott-stack-review** | Doesn't exist | ADD: 5-section dashboard skill | Same as v4 | The human review interface for the learning loop. System health, candidates, check health, refinement, overlap. | Create in Step 7b. | v5 inherits v4 unchanged. |
| **scott-stack-baseline** | Doesn't exist | ADD: first-run audit for existing projects | Same as v4 | Creates stack-lock.json + runs full codebase audit + produces baseline report for projects that predate v5. | Create in Step 7c. | v5 inherits v4 unchanged. |
| **scott-rebuild-metrics** | Doesn't exist | ADD: metrics.json regeneration | Same as v4 | Alias for stack-metrics.sh --full-rebuild. Recovery mechanism when metrics.json is lost or corrupted. | Create in Step 7d. | v5 inherits v4 unchanged. |

---

## 10. Rules (detailed)

| Dimension | Existing (v2.14) | v4 Design | v5 Unified | Explanation | Recommendation | v5 Synthesis |
|-----------|-----------------|-----------|------------|-------------|----------------|--------------|
| **claude-behavior.md structure** | 5 sections: Dev Methodology, Workflow Execution, Project Management, Context Engineering, Planning/Subagents/Verification/Bug Fixing/Progress | Add Stack Validation section. Decouple 12 command refs. Add learning loop ref. | Add Stack Validation section. Decouple 17 command refs. Add learning loop ref. Add CLAUDE.md soft budget. Add interfaces.json resolution rule. | The master ruleset loaded every session. Every behavioral instruction for Claude Code in Scott's projects. | Rewrite in Step 6c. | **v5 decouples 5 more commands than v4 counted** (17 vs 12). The full file audit found references v4's grep missed. v5 also adds the interfaces.json resolution rule and CLAUDE.md soft budget, which v4 designed but didn't specify where they'd be codified. |
| **code-style.md** | 41 lines. TS, Vue, Tailwind patterns. | No changes proposed | Add note: "Version-specific API compliance is enforced by stack checks, not this file." | Without this note, someone might add version-specific rules (like "don't use type::thing()") to code-style.md, duplicating check files. The note prevents scope confusion. | Update in Step 8h. | **v4 didn't address this.** v5 draws a clear boundary between conventions (code-style.md) and enforcement (check files). |

---

## 11. Implementation Approach

| Dimension | Existing (v2.14) | v4 Design | v5 Unified | Explanation | Recommendation | v5 Synthesis |
|-----------|-----------------|-----------|------------|-------------|----------------|--------------|
| **Prerequisite work** | None assumed | None. v4 builds on existing toolkit as-is. | Step 0: Rationalization (11 tasks). Clean foundation before new features. | Building new systems on top of duplicated, misplaced, stale files makes the toolkit worse, not better. Step 0 takes ~1 session and removes 12 files / ~3,094 lines. | Do Step 0 first. | **The fundamental difference between v4 and v5.** v4 says "add on top." v5 says "clean first, then add." The extra effort is ~1 session. The payoff is a toolkit that's ~3,000 lines lighter before any new code is written. |
| **Implementation steps** | N/A | 7 steps (1-7) | 9 steps (0-8) | v4 had 7 steps: check files, CLIs, closeout, hooks, planning/execution, learning loop, decoupling. v5 adds Step 0 (rationalization) and Step 8 (documentation). | Follow v5's 9-step order. | v5 bookends v4's implementation with cleanup (Step 0) and documentation (Step 8). v4 had no documentation step, meaning README, user guide, templates, and spa day would have stayed outdated after shipping new features. |
| **Step ordering** | N/A | Steps 6 and 7 are independent. Ship 7 (decoupling) before 6 (learning loop). | Same recommendation. Steps 6 and 7 are independent. | Decoupling protects against GSD/Superpowers renames that can happen at any time. The learning loop needs months of data to show value. Ship defense first. | Ship decoupling (Step 6) before learning loop (Step 7). | v5 inherits v4's ordering recommendation unchanged. |
| **Design considerations** | N/A | 57 considerations (#1-57) | 65 considerations (#1-65) | v5 adds 8 from the file audit: knowledge store overlap, project-specific files, archived knowledge, root proliferation, supplementary workflow ambiguity, reference placement, knowledge hierarchy rule, foundation-first principle. | All 65 are resolved. 6 deferred to future. | v5 formalizes audit observations as design constraints. Without formalization, "delete about-me.md" is a cleanup task. With formalization (#61: "root-level file proliferation"), it's a rule that prevents the problem from recurring. |

---

## 12. Summary: What v5 Adds Beyond v4

| # | What v5 does that v4 doesn't | Impact |
|---|------------------------------|--------|
| 1 | **Eliminates knowledge/ directory** (8 files, 2,874 lines) | Removes the largest source of duplication. Context windows load less redundant content. |
| 2 | **Establishes the one-place rule** for knowledge | Prevents re-accumulation. Without this rule, the three-store problem returns within months. |
| 3 | **Cleans references/** from 9 files to 4 | Removes project-specific files (ADRs) and duplicates. references/ becomes a clean cross-project directory. |
| 4 | **Removes 3 root-level files** (about-me, conventions, instructions.md moved) | Root stays lean. 6 files, not 10. |
| 5 | **Adds scope notes** to 3 supplementary workflows | Clarifies phase-closeout vs log-error vs log-success vs retro. Eliminates "which one do I use?" confusion. |
| 6 | **Decouples 17 operations** (v4 found 12) | Complete decoupling. The full audit found 5 references v4's grep missed. |
| 7 | **Updates handoff-to-gary.md** with stack-lock | Gary inherits enforcement context, not just code. v4 missed this. |
| 8 | **Updates toolkit-update.md** with v5 awareness | Self-update workflow knows about checks/, tools/, config/. v4 missed this. |
| 9 | **Integrates stack-review into spa day** | The learning loop dashboard has a regular maintenance trigger. v4 designed it but didn't wire it in. |
| 10 | **Adds boundary note to code-style.md** | Prevents version-specific rules from leaking into style rules. Keeps enforcement in check files. |
| 11 | **Adds Step 0 (rationalization)** to implementation | Clean foundation before new features. ~1 session, ~3,000 lines removed. |
| 12 | **Adds Step 8 (documentation)** to implementation | README, user guide, templates, spa day, changelog all get updated. v4 had no documentation step. |
| 13 | **Standardizes error/success naming** (forward-only) | Consistent NNN-description.md format for machine readability. |
| 14 | **Gitignores .claude-resume.md** | Removes git status noise from ephemeral file. |
| 15 | **Adds 8 design considerations** (#58-65) | Formalizes audit findings as constraints that prevent recurrence. |

**One-sentence summary:** v4 designed three new systems. v5 does all of that AND cleans the house first, prevents the mess from returning, and updates everything that references the toolkit so nothing is stale after shipping.
