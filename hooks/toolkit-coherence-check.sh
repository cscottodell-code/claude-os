#!/bin/bash
# PostToolUse hook: Validate cross-references when toolkit files are modified
# Fires on Edit|Write targeting files in scott-toolkit
# Advisory only — warns but never blocks (always exits 0)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only activate for files inside scott-toolkit
if ! echo "$FILE_PATH" | grep -q 'scott-toolkit'; then
  exit 0
fi

# Skip if file doesn't exist (e.g. new file not yet written)
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

WARNINGS=""

# Check for old shorthand path ~/scott-toolkit/ (should be ~/Sites/Global/scott-toolkit/)
if grep -q '~/scott-toolkit/' "$FILE_PATH" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠ Stale path: ~/scott-toolkit/ found — should be ~/Sites/Global/scott-toolkit/"
fi

# Check for templates/ references (renamed to context/)
if grep -q 'templates/' "$FILE_PATH" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠ Stale reference: templates/ found — renamed to context/"
fi

# Check for old instructions filename
if grep -q 'scott-toolkit-instructions.md' "$FILE_PATH" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠ Stale reference: scott-toolkit-instructions.md found — renamed to docs/user-guide.md"
fi

# Check for deleted skills/reference/ path
if grep -q 'skills/reference/' "$FILE_PATH" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠ Stale reference: skills/reference/ found — deleted in v4"
fi

if [ -n "$WARNINGS" ]; then
  echo "Toolkit coherence check for $(basename "$FILE_PATH"):"
  echo -e "$WARNINGS"
fi

exit 0
