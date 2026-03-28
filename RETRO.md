# Retrospective: scott-toolkit

## Metadata
- Last updated: 2026-03-28
- Version: 1.0
- Project: scott-toolkit
- Milestone: v5.1.0 Plugin Tuning

## 1. Project Summary
Added plugin awareness to the toolkit. 8 files changed across the toolkit, plus 2 external stack-lock bumps. Two commits: the feature and a code review fix. Total: ~126 lines added, ~49 removed.

## 2. What Went Well
- Research-to-implementation was seamless. All decisions locked in prior session, zero ambiguity during build. (Success #009)
- toolkit-resolve rewrite was better than the original plan. Positive matching via `grep -B1 "command"` is self-maintaining.
- Code review caught a Critical bug (wrong detection path) before ship.

## 3. What Went Wrong
- Guessed the Claude Code plugin file structure instead of checking. Would have shipped a silently broken feature. (Error #011)
- First draft of `enabledPlugins: false` would have disabled required plugins (Superpowers, Impeccable).
- `"next"` grep pattern was too loose for stack-lock matching.

## 4. Lessons Learned
- Never guess file paths for third-party tool internals. Always verify first.
- Prefer positive matching over exclusion lists in grep pipelines.
- Per-plugin disable (`"vercel@claude-plugins-official": false`) is the correct granularity. Never `enabledPlugins: false`.

## 5. Toolkit Updates Needed
| Action | File | Change Needed | Reason |
|--------|------|--------------|--------|
| None pending | - | All changes shipped in this session | - |

## 6. Patterns Discovered
- **Plugin ID format:** `name@publisher` (e.g., `vercel@claude-plugins-official`, `impeccable@impeccable`). The publisher suffix varies.
- **Settings merge:** Project-level `.claude/settings.json` deep-merges with global. Per-plugin keys override individually.
