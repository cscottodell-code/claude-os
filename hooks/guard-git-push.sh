#!/bin/bash
# Guard: Block git push unless explicitly confirmed
# Exit code 2 = block the action (per Claude Code hooks spec)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Strip quoted strings to avoid false positives (e.g. echo "git push")
STRIPPED=$(echo "$COMMAND" | sed -E "s/'[^']*'//g; s/\"[^\"]*\"//g")

if echo "$STRIPPED" | grep -qE 'git\s+push'; then
  echo "Git push blocked — use /scott:bypass or confirm manually before pushing."
  exit 2
fi

exit 0
