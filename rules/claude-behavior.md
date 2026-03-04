# Claude Code Behavior Rules

Loaded automatically for all projects via the rules system.

Three systems handle different concerns. Use the right one for the job.

### Development Methodology (-> Superpowers)
- TDD: `superpowers:test-driven-development` for all features and bug fixes
  - Exception: throwaway experiments (explicitly stated by Scott)
- Code review: `superpowers:requesting-code-review` after features, before merges
  - Fix Critical issues immediately, Important issues before proceeding
- Git workflow: `superpowers:using-git-worktrees` for feature development
- Branch merging: `superpowers:finishing-a-development-branch` when complete
- Debugging methodology: follow `superpowers:systematic-debugging`
- Plan writing: `superpowers:writing-plans` for breaking work into tasks

### Project Management (-> GSD)
- Structured projects: `/gsd:plan-phase` and `/gsd:execute-phase` for milestone work
- Quick tasks: `/gsd:quick` for ad-hoc work with state tracking
- Debugging operations: `/gsd:debug` for subagent-isolated investigation
- Verification: `/gsd:verify-work` after phase execution
- Test gaps: `/gsd:add-tests` after completing phases

### Context Engineering (-> Toolkit)
- After ANY correction from Scott: update `tasks/lessons.md`
  ("Next time, do X instead of Y because Z")
- After debugging a prompt/context/harness error: `/scott:log-error`
- After a notable success: `/scott:log-success`
- Review `tasks/lessons.md` at session start (before work begins)
- After completing a milestone: consider `/scott:retro`
- After any debug session: capture lessons in `tasks/lessons.md`

### Planning
- Enter plan mode for any non-trivial task (3+ steps or architectural decisions)
- Write the plan to tasks/todo.md with checkable items before starting
- If something goes sideways mid-task, STOP and re-plan. Don't keep pushing.

### Subagents
- Use subagents for research, exploration, and parallel analysis
- Keep the main context window focused on the current build task
- One objective per subagent for focused execution

### Verification
- Never mark a task complete without proving it works
- Run the code, check for errors, demonstrate correctness
- Ask: "Would Gary be comfortable productionizing this?"

### Bug Fixing
- When given a bug report, just fix it. Don't ask for permission.
- Point at logs, errors, failing tests, then resolve them
- Only escalate to Scott when a decision is needed, not when a fix is needed

### Progress Tracking
- Maintain tasks/todo.md with current milestone tasks
- Mark items complete as you go
- Provide a high-level summary after completing each task
