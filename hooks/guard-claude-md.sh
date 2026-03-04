#!/bin/bash
# Guard: Block modifications to CLAUDE.md and MEMORY.md files
# These files control Claude's behavior — changes should be intentional
# Exit code 2 = block the action (per Claude Code hooks spec)

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only check Edit and Write tools
if [ "$TOOL_NAME" != "Edit" ] && [ "$TOOL_NAME" != "Write" ]; then
  exit 0
fi

if echo "$FILE_PATH" | grep -qiE '(CLAUDE\.md|MEMORY\.md)$'; then
  echo "CLAUDE.md/MEMORY.md modification blocked — tell Scott what you want to change and why before editing these files."
  exit 2
fi

exit 0
