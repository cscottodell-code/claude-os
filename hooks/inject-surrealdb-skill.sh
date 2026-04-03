#!/bin/bash
# Hook: PreToolUse — Auto-inject SurrealDB skill when touching SurrealDB files
# Matches: *.surql, **/db.ts, **/surreal*, **/surrealdb*, and surreal/curl commands
# Dedup: Only injects once per session (uses temp file marker)

SKILL_FILE="$HOME/.claude/skills/scott-surrealdb/SKILL.md"
DEDUP_FILE="/tmp/surrealdb-skill-injected-${CLAUDE_SESSION_ID:-$$}"

# Already injected this session? Skip.
if [ -f "$DEDUP_FILE" ]; then
  exit 0
fi

# Read tool input from stdin
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

MATCH=false

# Check file-based tools (Read, Edit, Write)
if [ -n "$FILE_PATH" ]; then
  case "$FILE_PATH" in
    *.surql) MATCH=true ;;
    */db.ts) MATCH=true ;;
    */surreal*) MATCH=true ;;
    */surrealdb*) MATCH=true ;;
    *surrealdb*) MATCH=true ;;
    *surreal*schema*) MATCH=true ;;
    *surreal*migration*) MATCH=true ;;
  esac
fi

# Check Bash commands
if [ -n "$COMMAND" ]; then
  if echo "$COMMAND" | grep -qiE '(surreal|surrealdb|surql|localhost:800[0-9])'; then
    MATCH=true
  fi
fi

if [ "$MATCH" = true ] && [ -f "$SKILL_FILE" ]; then
  # Mark as injected for this session
  touch "$DEDUP_FILE"

  # Strip frontmatter and output as additionalContext
  CONTENT=$(sed -n '/^---$/,/^---$/!p' "$SKILL_FILE" | tail -n +1)

  # Output JSON with additionalContext
  jq -n --arg content "$CONTENT" '{
    "additionalContext": ("[SurrealDB Skill Auto-Loaded] " + $content)
  }'
fi
