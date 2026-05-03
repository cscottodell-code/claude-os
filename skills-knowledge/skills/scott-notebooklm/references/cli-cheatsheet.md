# notebooklm CLI Cheatsheet

Minimal reference for the commands `scott-notebooklm` uses. For the complete CLI reference,
run `notebooklm skill install` to restore the full official skill at `~/.claude/skills/notebooklm/`.

## Setup

```bash
notebooklm login          # Authenticate (browser-based OAuth)
notebooklm status         # Verify auth
notebooklm --version
notebooklm auth check     # Diagnose auth issues
```

## Notebook Operations

```bash
notebooklm create "Title" --json
# Returns: {"id": "...", "title": "..."}

notebooklm list --json
# Returns: {"notebooks": [{id, title, created_at, ...}]}

notebooklm metadata -n <id> --json
# Returns: {id, title, created_at, sources: [...]}

notebooklm delete -n <id>     # Destructive — ask Scott first
```

## Source Operations

```bash
notebooklm source add "<file-or-url>" -n <notebook-id> --json
# Returns: {"source_id": "...", "title": "...", "status": "processing"}

notebooklm source list -n <notebook-id> --json
# Returns: {"sources": [{id, title, status}]}

notebooklm source wait <source-id> -n <notebook-id> --timeout 120
# Blocks until source status is 'ready' (or timeout)

notebooklm source delete <source-id> -n <notebook-id>
notebooklm source delete-by-title "Exact Title" -n <notebook-id>

notebooklm source fulltext <source-id> -n <notebook-id>
# Get the indexed text content of any source
```

## Web Research (built-in)

```bash
notebooklm source add-research "<query>" -n <notebook-id> --mode fast
# fast: 5-10 sources, ~30s-2min, blocking
# deep: 20+ sources, 15-30 min — use --no-wait + subagent

notebooklm source add-research "<query>" -n <id> --mode deep --no-wait
# Then spawn subagent with: notebooklm research wait -n <id> --import-all
```

## Generation

All generate commands return `{"task_id": "...", "status": "pending"}` with `--json`.
Always use `--json` to capture the task_id for subsequent wait/download.

```bash
notebooklm generate audio --format deep-dive --length long "<prompt>" -n <id> --json
notebooklm generate quiz --difficulty medium --quantity standard -n <id> --json
notebooklm generate flashcards --difficulty medium --quantity standard -n <id> --json
notebooklm generate report --format study-guide --append "<extra>" -n <id> --json

# Other formats:
notebooklm generate video --format explainer -n <id> --json
notebooklm generate slide-deck --format detailed -n <id> --json
notebooklm generate infographic --orientation landscape -n <id> --json
notebooklm generate mind-map -n <id>     # Sync, instant — no wait needed
notebooklm generate data-table "<description>" -n <id> --json
```

## Wait + Download (subagent pattern)

NEVER poll in main conversation. Always dispatch a background subagent:

```
Task(
  prompt="Wait for artifact {task_id} in notebook {id} to complete.
          notebooklm artifact wait {task_id} -n {id} --timeout 1200
          Then: notebooklm download <type> <path> -a {task_id} -n {id}
          Report file size and path when complete.",
  subagent_type="general-purpose"
)
```

Download types:

```bash
notebooklm download audio <path>.mp3 -a <artifact-id> -n <id>
notebooklm download video <path>.mp4 -a <artifact-id> -n <id>
notebooklm download slide-deck <path>.pdf -a <artifact-id> -n <id>
notebooklm download slide-deck <path>.pptx --format pptx -a <artifact-id> -n <id>
notebooklm download report <path>.md -a <artifact-id> -n <id>
notebooklm download mind-map <path>.json -a <artifact-id> -n <id>
notebooklm download data-table <path>.csv -a <artifact-id> -n <id>
notebooklm download quiz <path>.md --format markdown -a <artifact-id> -n <id>
notebooklm download flashcards <path>.md --format markdown -a <artifact-id> -n <id>
```

## Configure Chat

```bash
notebooklm configure --mode detailed --response-length longer --persona "<text>" -n <id>
```

## Chat (used by /scott:learn for application/connection sessions)

```bash
notebooklm ask "question" -n <id>
notebooklm ask "question" -n <id> --json     # Returns answer with references[]
notebooklm ask "question" -n <id> --save-as-note --note-title "Title"
notebooklm history -n <id>
notebooklm history -n <id> --save --note-title "Title"
notebooklm ask "question" -n <id> -c <conversation-id>     # Continue specific thread
```

## Parallel Safety

- ALWAYS use `-n <id>` instead of `notebooklm use <id>`. The latter writes to
  `~/.notebooklm/context.json` and collides between concurrent subagents.
- Use `--json` to extract IDs reliably.
- Partial UUIDs (first 6+ chars) work for `-n` but full UUIDs are safer in automation.

## Exit Codes

| Code | Meaning | Action |
|---|---|---|
| 0 | Success | Continue |
| 1 | Error (auth, not found, processing failed) | Check stderr |
| 2 | Timeout (wait commands only) | Extend timeout or check status manually |

## Common Errors

| Error | Cause | Action |
|---|---|---|
| Auth/cookie error | Session expired | `notebooklm auth check` then `notebooklm login` |
| "No notebook context" | Context not set | Use `-n <id>` flag |
| "No result found for RPC ID" | Rate limited | Wait 5-10 min, retry |
| `GENERATION_FAILED` | Google rate limit | Wait and retry later |
| Download fails | Generation incomplete | Check `notebooklm artifact list -n <id>` |

## Processing Times (suggested timeouts)

| Operation | Typical | Suggested timeout |
|---|---|---|
| Source processing | 30s - 10 min | 600s |
| Research (fast) | 30s - 2 min | 180s |
| Research (deep) | 15 - 30+ min | 1800s |
| Audio generation | 10 - 20 min | 1200s |
| Video generation | 15 - 45 min | 2700s |
| Quiz, flashcards | 5 - 15 min | 900s |
| Report, data-table | 5 - 15 min | 900s |
| Mind-map | instant | n/a |

## Reinstalling Full Reference

The full official skill (565 lines, all commands, all options, all error codes) can be
restored anytime:

```bash
notebooklm skill install
```

This creates `~/.claude/skills/notebooklm/SKILL.md` alongside `scott-notebooklm`. To
remove it again: `notebooklm skill uninstall`.
