# Lessons Learned

## v5.1.0 - Plugin Tuning (2026-03-28)

- [harness] Never guess file paths for Claude Code internals. Plugin state lives in `~/.claude/settings.json` under `enabledPlugins`, not in a `/plugins/` directory. Always `cat` the actual file before writing code that depends on its structure.
- [pattern] When listing items from a JSON file, prefer positive matching (grep for a known sibling key like `"command":`) over negative exclusion lists. Exclusion lists are fragile and need updating every time a new section is added.
- [harness] `enabledPlugins: false` disables ALL plugins including required ones. Always use per-plugin disable: `{ "vercel@claude-plugins-official": false }`. The `claude_id` field in interfaces.json has the correct identifier.
