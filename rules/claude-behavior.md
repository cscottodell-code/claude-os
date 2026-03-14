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
- Debugging methodology: follow `superpowers:systematic-debugging`
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

### Planning
- Enter plan mode for any non-trivial task (3+ steps or architectural decisions)
- Write the plan to tasks/todo.md with checkable items before starting
- If something goes sideways mid-task, STOP and re-plan. Don't keep pushing.
- Doom-loop detection: if you've edited the same file 3+ times without progress, stop and re-plan the approach
  - Repeated minor variations on a failing strategy waste tokens -- step back and reconsider

### Subagents
- Use subagents for research, exploration, and parallel analysis
- If a task requires reading 3+ files for investigation, spawn a subagent rather than reading in the main context
- Keep the main context window focused on the current build task
- One objective per subagent for focused execution

### Verification
- Never mark a task complete without proving it works
- Before declaring any task complete, verify:
  1. Tests pass (run the test suite)
  2. No uncommitted changes (git status clean)
  3. tasks/todo.md updated (completed items checked off)
  4. The feature actually works (demonstrate it)
- Ask: "Would Gary be comfortable productionizing this?"

### Bug Fixing
- When given a bug report, just fix it. Don't ask for permission.
- Point at logs, errors, failing tests, then resolve them
- Only escalate to Scott when a decision is needed, not when a fix is needed

### Progress Tracking
- Maintain tasks/todo.md with current milestone tasks
- Mark items complete as you go
- Provide a high-level summary after completing each task
- Commit all work at the end of each story (don't let changes accumulate across sessions)
- Update CLAUDE.md status section after completing each story or milestone
