# Claude Code Behavior Rules

Last updated: 2026-03-24
Loaded automatically for all projects via the rules system.

Three systems handle different concerns. Use the right one for the job.

### Operation Resolution

When a workflow, rule, or skill references an **abstract operation name** (like `plan_phase`, `tdd`, `phase_closeout`), resolve it by reading `config/interfaces.json` in the toolkit directory (`~/Sites/Global/scott-toolkit/config/interfaces.json`) and using the `command` value for that operation. This decouples the toolkit from specific tool versions.

### Development Methodology (-> Superpowers)
- TDD: **tdd** operation for all features and bug fixes
  - Exception: throwaway experiments (explicitly stated by Scott)
  - Exception: low-criticality UI changes (styling, layout tweaks) can skip TDD with Scott's explicit approval
- Code review: **code_review** operation after features, before merges
  - Fix Critical issues immediately, Important issues before proceeding
- Git workflow: **git_worktree** operation for feature development
- Branch merging: **finish_branch** operation when complete
- Debugging methodology: follow **debug** operation for Scott's projects (adds lesson capture), **debug_systematic** operation for non-Scott projects
- Plan writing: **write_plan** operation for breaking work into tasks

### Workflow Execution
- Phases tagged [STOP]: pause and wait for Scott's input before continuing
- Phases tagged [AUTO]: show a one-line summary, then immediately proceed
- Phases tagged [DELEGATE]: hand off to GSD/Superpowers, then proceed
- No tag = [STOP] (safe default)
- Never skip a phase — AUTO means "don't wait for permission," not "skip"
- If an AUTO phase hits an issue requiring Scott's judgment, pause and ask

### Project Management (-> GSD + Superpowers)
- **GSD** for all project management: **plan_phase**, **execute_phase**, **quick_task**, **debug_gsd**, **verify_work**, **add_tests** operations
- **Superpowers** for execution methodology: TDD, code review, git worktrees, debugging (see Development Methodology above)
- **Integration pattern:** Superpowers discipline applies DURING GSD execution. When **execute_phase** runs, **tdd** governs how code is written. **git_worktree** provides isolation before GSD plans are executed. **finish_branch** handles merge/PR after GSD verification passes.
- **Phase closeout (MANDATORY, hook-enforced gate):**
  After every GSD execution phase, invoke **phase_closeout**. This single skill runs:
  1. **Verify** — test suite must pass
  2. **Review** — code review + fix cycle until clean
  3. **Reflect** — ONE conversation producing error logs, success logs, RETRO.md, and lessons.md
  4. **Gate** — writes `.post-execution-complete` marker
  The `guard-phase-completion.sh` hook blocks `phase complete` without the marker.
  This cannot be skipped. It cannot be deferred. It replaces the old 5-step sequence that was skipped 3 times.

### Stack Enforcement
- Projects with `stack-lock.json` get static checks via `tools/stack-check.sh` during execution
- Phase closeout includes a stack audit (Phase 1.5) that runs technology-specific checks
- Stack drift (check file changes without lock file updates) is caught by `guard-drift-detection.sh`
- Lessons tagged with `[stack:<tech>]` feed back into check files via the learning loop

### Context Engineering (-> Toolkit)
- After ANY correction from Scott: update `tasks/lessons.md`
  ("Next time, do X instead of Y because Z")
- Update `tasks/lessons.md` after EVERY completed phase, not just debug sessions. Empty lessons.md at the end of a multi-phase build is a failure mode. Decisions, gotchas, and patterns discovered during the phase belong there.
- **Error/success/retro logging** is handled by **phase_closeout** at GSD phase completion.
  For mid-session captures outside of GSD phases, use the same patterns:
  - Mistakes: create error log files in `~/Sites/Global/scott-toolkit/errors/`
  - Wins: create success log files in `~/Sites/Global/scott-toolkit/successes/`
  - The distinction: **debug** = code is broken, error logs = Claude/toolkit is broken
- **MUST invoke the **resume** operation** when:
  - Session-start hook says "AUTO-RESUME" (non-negotiable)
  - Scott says "let's continue", "where were we", "pick up where we left off"
  - A `.claude-resume.md` or `.planning/` directory exists in the project
- Review `tasks/lessons.md` at session start (before work begins)
- After any debug session: capture lessons in `tasks/lessons.md`
- Context rot is monitored by the context-reminders hook (warns at 60min and 100 tool uses). If you notice signs of degradation (repeating mistakes, forgetting instructions, inconsistent behavior), suggest /compact or a fresh session even before the hook warns.
- Post-compaction recovery: after any compaction, immediately re-read:
  1. .claude-resume.md and .context-snapshot.md (written by pre-compact hook)
  2. The current task from tasks/todo.md
  3. Any relevant offloaded files from .claude/tool-output-overflow/
  Do NOT continue work based on assumptions about what was in context before compaction.

### Planning
- Enter plan mode for any non-trivial task (3+ steps or architectural decisions)
- Write the plan to tasks/todo.md with checkable items before starting
- Checkpoint commits: before significant refactors or multi-file changes, create a checkpoint: `git add -A && git commit -m "checkpoint before [description]"`. One `git reset` away from safety.
- If something goes sideways mid-task, STOP and re-plan. Don't keep pushing.
- Doom-loop detection: if you've edited the same file 3+ times without progress, stop and re-plan the approach
  - Repeated minor variations on a failing strategy waste tokens -- step back and reconsider
  - Recovery option: spawn a fresh subagent with clean context to retry, passing it the task contract or acceptance criteria so it knows what "done" means without the failed context

### Subagents
- Use subagents for research, exploration, and parallel analysis
- If a task requires reading 3+ files for investigation, spawn a subagent rather than reading in the main context
- Keep the main context window focused on the current build task
- One objective per subagent for focused execution
- Iterative retrieval: subagents should evaluate their own results before returning. If the result is incomplete or ambiguous, follow up with additional searches or reads. Max 3 retrieval cycles before returning what you have.
- Pattern referencing: point to existing code patterns (e.g., "follow the pattern in /api/teams") instead of describing them verbally. Reduces prompt tokens and ensures consistency with existing code.
- Named agent roles with minimum-necessary tool sets:
  - **Researcher/Explorer:** Read, Grep, Glob, WebSearch, WebFetch only (no Write, Edit, Bash)
  - **Planner:** Read, Grep, Glob only
  - **Reviewer:** Read, Grep, Glob, Bash (for running tests)
  - **Executor:** All tools (full access for implementation work)
  - Match the role to the task. Don't give a research subagent write access.
- Verify before presenting: when subagents produce findings (audits, reviews, comparisons), verify claims against primary sources before presenting to Scott. Subagents apply rules mechanically without understanding layered design. Never present a finding that hasn't been checked against the actual file.

### Verification
- Never mark a task complete without proving it works
- Before declaring any task complete, verify:
  1. Tests pass (run the test suite)
  2. No uncommitted changes (git status clean)
  3. tasks/todo.md updated (completed items checked off)
  4. The feature actually works (demonstrate it)
- Ask: "Would Gary be comfortable productionizing this?"
- After code review fixes, ALWAYS run a second verification pass before declaring complete. One review pass is never enough for production code. The first pass catches surface patterns; the second catches schema alignment, business logic edge cases, and end-to-end user story gaps.
- "Tests pass" does NOT mean "code is correct." Tests verify mock behavior. Schema compliance, race conditions, and timezone bugs require end-to-end walkthrough review.
- Task contracts: for non-trivial tasks, define completion criteria upfront:
  - What tests must pass (agent cannot edit these tests)
  - What visual/behavioral verification is needed
  - Any other acceptance criteria specific to this task
  - GSD phases already have acceptance criteria in PLAN.md; use those as the contract

### Bug Fixing
- When given a bug report, just fix it. Don't ask for permission.
- Point at logs, errors, failing tests, then resolve them
- Only escalate to Scott when a decision is needed, not when a fix is needed
- Prompting discipline: use neutral framing when investigating issues
  - Don't say "find the bug" (biases toward manufacturing bugs)
  - Say "trace the logic of each component and report all findings"
  - Neutral prompts reduce sycophancy-driven false positives

### Progress Tracking
- Maintain tasks/todo.md with current milestone tasks
- Mark items complete as you go
- Provide a high-level summary after completing each task
- Commit all work at the end of each story (don't let changes accumulate across sessions)
- Update CLAUDE.md status section after completing each story or milestone
