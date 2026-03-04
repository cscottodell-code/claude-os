#!/bin/bash
# Guard: Block destructive commands that are hard to reverse
# Exit code 2 = block the action (per Claude Code hooks spec)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Strip quoted strings to avoid false positives
STRIPPED=$(echo "$COMMAND" | sed -E "s/'[^']*'//g; s/\"[^\"]*\"//g")

if echo "$STRIPPED" | grep -qE 'rm\s+-rf'; then
  echo "Blocked: 'rm -rf' would permanently delete files/directories. Tell Scott what you want to remove and why."
  exit 2
fi

if echo "$STRIPPED" | grep -qE 'git\s+reset\s+--hard'; then
  echo "Blocked: 'git reset --hard' would discard all uncommitted changes permanently. Tell Scott what you want to reset and why."
  exit 2
fi

if echo "$STRIPPED" | grep -qE 'git\s+checkout\s+\.'; then
  echo "Blocked: 'git checkout .' would discard all unstaged changes. Tell Scott what you want to revert and why."
  exit 2
fi

if echo "$STRIPPED" | grep -qE 'git\s+clean\s+-f'; then
  echo "Blocked: 'git clean -f' would permanently delete untracked files. Tell Scott what you want to clean and why."
  exit 2
fi

exit 0
