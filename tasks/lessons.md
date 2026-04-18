# Lessons Learned

## v5.1.0 - Plugin Tuning (2026-03-28)

- [harness] Never guess file paths for Claude Code internals. Plugin state lives in `~/.claude/settings.json` under `enabledPlugins`, not in a `/plugins/` directory. Always `cat` the actual file before writing code that depends on its structure.
- [pattern] When listing items from a JSON file, prefer positive matching (grep for a known sibling key like `"command":`) over negative exclusion lists. Exclusion lists are fragile and need updating every time a new section is added.
- [harness] `enabledPlugins: false` disables ALL plugins including required ones. Always use per-plugin disable: `{ "vercel@claude-plugins-official": false }`. The `claude_id` field in interfaces.json has the correct identifier.

## v6.2.5 - Router Workflow Gates Retired (2026-04-18)

- [hooks] PreToolUse block messages MUST go to `console.error` (stderr), not `console.log` (stdout). Claude Code's hook protocol surfaces stderr to the user when a hook exits 2; stdout is silently dropped, producing "No stderr output" errors that hide the real block reason. The `additionalContext` JSON pattern still uses stdout — that's a different channel.
- [hooks] Regex pattern gates that match raw command text are fundamentally over-broad. `/phase.6/i` caught GSD's `execute-phase 6` because `.` is a regex wildcard and `phase` appears in many workflows. Workflow-specific enforcement should happen in the slash-command/skill layer where workflow context is explicit, not in PreToolUse hooks where every Bash command's text is a substring-match target.
- [hooks] When removing a guard, check for dependencies first: `guardProjectScaffolded`, `guardDesignApproved`, `guardReflectionComplete` all imported from `./guards/workflow-gates.js`. The guards file itself remains (harmless), but unused imports were stripped from the router.
- [hooks] After editing `hooks/pretooluse-router.ts` or any file it imports, rebuild the CJS bundle: `bun build hooks/pretooluse-router.ts --outfile hooks/pretooluse-router.cjs --target node --format cjs`. The `~/.claude/hooks/pretooluse-router.cjs` symlink points at the toolkit copy, so rebuilding in-place propagates instantly.
