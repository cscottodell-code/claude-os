#!/bin/bash
# Hook: UI/UX Reminder — PostToolUse nudge for .vue file edits
# Non-blocking (exit 0 always). Fires at most once per phase.
# Reminds to run /impeccable:audit before closeout.
#
# NOT part of the stack audit system. Separate, lightweight nudge.

INPUT=$(cat)

# Get the file path from the tool input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

# Only trigger for .vue files
if [[ "$FILE_PATH" != *.vue ]]; then
  exit 0
fi

# Only trigger during GSD execution phases (check for .planning/ dir)
if [[ ! -d "$(pwd)/.planning" ]]; then
  exit 0
fi

# Fire at most once per phase (use a temp marker)
# Cross-platform hash: md5 on macOS, md5sum on Linux
if command -v md5 >/dev/null 2>&1; then
  DIR_HASH=$(pwd | md5 -q | cut -c1-8)
elif command -v md5sum >/dev/null 2>&1; then
  DIR_HASH=$(pwd | md5sum | cut -c1-8)
else
  DIR_HASH="default"
fi
MARKER="/tmp/uiux-reminder-${DIR_HASH}"
if [[ -f "$MARKER" ]]; then
  exit 0
fi

# Create marker so we don't repeat
touch "$MARKER"

echo "UI/UX nudge: .vue file edited. Consider running /impeccable:audit before closeout."

exit 0
