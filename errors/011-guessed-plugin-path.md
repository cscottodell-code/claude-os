# Error #011: Guessed Plugin Detection Path
**Date:** 2026-03-28
**Project:** scott-toolkit

## What Happened
Wrote a shell hook that checked `~/.claude/plugins/vercel/hooks/hooks.json` to detect if the Vercel plugin was active. That path doesn't exist. The actual plugin state lives in `~/.claude/settings.json` under `enabledPlugins`.

## The Triggering Prompt
```
Insert bidirectional plugin-project alignment check after stack-lock staleness check
```

## What Went Wrong
**Category:** Context Error
**Root cause:** Assumed the plugin file structure without checking. Made up a path based on how I thought plugins might be organized instead of reading the actual settings file.
**Surface symptom:** Plugin detection would always return false, making the "active on non-Vercel project" warning never fire and the "disabled on Vercel project" warning always fire.

## What The Prompt Should Have Been
```
Before writing the detection logic, read ~/.claude/settings.json to understand how plugin state is actually stored. Then write the hook using the real structure.
```

## Prevention
1. Always `cat` or `ls` the actual file/directory before writing code that depends on its structure
2. Never guess file paths for third-party tools. Verify first.

## Pattern Check
- **Seen before?** Yes — similar to guessing API shapes without reading docs
- **Added to toolkit?** Yes — lesson in tasks/lessons.md
