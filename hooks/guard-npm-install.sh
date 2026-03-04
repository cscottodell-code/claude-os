#!/bin/bash
# Guard: Block npm install (but allow npm ci for clean installs)
# Exit code 2 = block the action (per Claude Code hooks spec)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Strip quoted strings to avoid false positives
STRIPPED=$(echo "$COMMAND" | sed -E "s/'[^']*'//g; s/\"[^\"]*\"//g")

# Match "npm install" or "npm i" followed by packages
if echo "$STRIPPED" | grep -qE 'npm\s+(install|i)\s'; then
  PACKAGES=$(echo "$COMMAND" | sed -E 's/.*npm\s+(install|i)\s+//')
  echo "npm install blocked — packages to install: $PACKAGES. Confirm with Scott before adding new dependencies."
  exit 2
fi

# Also catch bare "npm install" or "npm i" (no packages)
if echo "$STRIPPED" | grep -qE 'npm\s+(install|i)$'; then
  echo "npm install blocked — this would install all dependencies from package.json. Use 'npm ci' for clean installs, or confirm with Scott."
  exit 2
fi

exit 0
