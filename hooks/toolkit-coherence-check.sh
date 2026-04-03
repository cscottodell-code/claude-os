#!/bin/bash
# PostToolUse hook: Validate cross-references when toolkit files are modified
# Fires on Edit|Write targeting files in scott-toolkit
# Advisory only — warns but never blocks (always exits 0)

TOOLKIT_DIR="${SCOTT_TOOLKIT_DIR:-$HOME/Sites/Global/scott-toolkit}"
MANIFEST="$TOOLKIT_DIR/config/version-manifest.json"

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only activate for files inside scott-toolkit
if ! echo "$FILE_PATH" | grep -q 'scott-toolkit'; then
  exit 0
fi

# Skip if file doesn't exist
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Bail silently if jq missing or manifest missing
if ! command -v jq &>/dev/null || [ ! -f "$MANIFEST" ]; then
  exit 0
fi

BANNED_COUNT=$(jq '.cross_reference_patterns.banned | length' "$MANIFEST" 2>/dev/null) || exit 0
WARNINGS=""

for i in $(seq 0 $((BANNED_COUNT - 1))); do
  PATTERN=$(jq -r ".cross_reference_patterns.banned[$i].pattern" "$MANIFEST")
  REASON=$(jq -r ".cross_reference_patterns.banned[$i].reason" "$MANIFEST")
  REPLACEMENT=$(jq -r ".cross_reference_patterns.banned[$i].replacement" "$MANIFEST")

  if grep -qF "$PATTERN" "$FILE_PATH" 2>/dev/null; then
    WARNINGS="${WARNINGS}\n⚠ ${REASON}: ${PATTERN} found — use ${REPLACEMENT} instead"
  fi
done

if [ -n "$WARNINGS" ]; then
  echo "Toolkit coherence check for $(basename "$FILE_PATH"):"
  echo -e "$WARNINGS"
fi

exit 0
