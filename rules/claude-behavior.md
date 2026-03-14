# Claude Code Behavior Rules

Loaded automatically for all projects via the rules system.

Three systems handle different concerns. Use the right one for the job.

### Development Methodology (-> Superpowers)
- TDD: `superpowers:test-driven-development` for all features and bug fixes
  - Exception: throwaway experiments (explicitly stated by Scott)
  - Exception: low-criticality UI changes (styling, layout tweaks) can skip TDD with Scott's explicit approval
- Code review: `superpowers:requesting-code-review` after features, before merges
  - Fix Critical issues immediately, Important issues before proceeding
- Git workflow: `superpowers:using-git-worktrees` for feature development
- Branch merging: `superpowers:finishing-a-development-branch` when complete
- Debugging methodology: follow `scott:debug` for Scott's projects (adds lesson capture), `superpowers:systematic-debugging` for non-Scott projects
- Plan writing: `superpowers:writing-plans` for breaking work into tasks

### Workflow Execution
- Phases tagged [STOP]: pause and wait for Scott's input before continuing
- Phases tagged [AUTO]: show a one-line summary, then immediately proceed
- Phases tagged [DELEGATE]: hand off to GSD/BMAD/Superpowers, then proceed
- No tag = [STOP] (safe default)
- Never skip a phase — AUTO means "don't wait for permission," not "skip"
- If an AUTO phase hits an issue requiring Scott's judgment, pause and ask

### Project Management (-> GSD or BMAD, per project CLAUDE.md)
- Read the project's CLAUDE.md PM Mode field to determine tools
- **GSD mode (default):** /gsd:plan-phase, /gsd:execute-phase, /gsd:quick, /gsd:debug, /gsd:verify-work, /gsd:add-tests
- **BMAD mode:** /bmad-bmm-create-prd, /bmad-bmm-create-epics-and-stories, /bmad-bmm-sprint-planning, /bmad-bmm-dev-story, /bmad-bmm-code-review
- If no PM Mode specified, default to GSD

### Context Engineering (-> Toolkit)
- After ANY correction from Scott: update `tasks/lessons.md`
  ("Next time, do X instead of Y because Z")
- After debugging a prompt/context/harness error: `/scott:log-error`
- After a notable success: `/scott:log-success`
- Review `tasks/lessons.md` at session start (before work begins)
- After completing a milestone: consider `/scott:retro`
- After any debug session: capture lessons in `tasks/lessons.md`
- Watch for context rot: if a session has been running 1+ hours or context feels noisy, suggest /compact or a fresh session
  - Signs of degradation: repeating earlier mistakes, forgetting instructions, inconsistent behavior
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
- Named agent roles with minimum-necessary tool sets:
  - **Researcher/Explorer:** Read, Grep, Glob, WebSearch, WebFetch only (no Write, Edit, Bash)
  - **Planner:** Read, Grep, Glob only
  - **Reviewer:** Read, Grep, Glob, Bash (for running tests)
  - **Executor:** All tools (full access for implementation work)
  - Match the role to the task. Don't give a research subagent write access.

### Verification
- Never mark a task complete without proving it works
- Before declaring any task complete, verify:
  1. Tests pass (run the test suite)
  2. No uncommitted changes (git status clean)
  3. tasks/todo.md updated (completed items checked off)
  4. The feature actually works (demonstrate it)
- Ask: "Would Gary be comfortable productionizing this?"
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
