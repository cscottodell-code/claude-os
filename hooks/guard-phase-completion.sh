#!/bin/bash
# Guard: Block GSD phase completion unless post-execution sequence was completed
# Exit code 2 = block the action (per Claude Code hooks spec)
#
# Enforces the mandatory /scott:phase-closeout skill which runs:
#   1. Verify (test suite)
#   2. Review (code review + fix cycle)
#   3. Reflect (errors, successes, retro, lessons)
#   4. Gate (writes the marker file)
#
# The marker file .post-execution-complete is written by phase-closeout
# ONLY after all steps finish. Without it, phase completion is blocked.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Strip quoted strings to avoid false positives
STRIPPED=$(echo "$COMMAND" | sed -E "s/'[^']*'//g; s/\"[^\"]*\"//g")

# Only intercept the specific GSD phase completion command
if ! echo "$STRIPPED" | grep -qE 'gsd-tools.*phase\s+complete'; then
  exit 0
fi

# Extract phase number from command (e.g., "phase complete 3" or "phase complete 03")
PHASE_NUM=$(echo "$STRIPPED" | grep -oE 'phase\s+complete\s+"?[0-9.]+"?' | awk '{print $3}' | tr -d '"')

if [ -z "$PHASE_NUM" ]; then
  # Can't determine phase number — let it through (don't break non-standard invocations)
  exit 0
fi

# Check if .planning/phases/ exists (are we in a GSD project?)
if [ ! -d ".planning/phases" ]; then
  exit 0
fi

# Find the phase directory — handle both "1" and "01" formats
PHASE_DIR=$(find .planning/phases -maxdepth 1 -type d -name "${PHASE_NUM}*" 2>/dev/null | head -1)

# If not found, try zero-padded version (e.g., "1" -> "01")
if [ -z "$PHASE_DIR" ]; then
  PADDED=$(printf "%02d" "$PHASE_NUM" 2>/dev/null || echo "$PHASE_NUM")
  PHASE_DIR=$(find .planning/phases -maxdepth 1 -type d -name "${PADDED}*" 2>/dev/null | head -1)
fi

if [ -z "$PHASE_DIR" ]; then
  # Phase directory not found — let gsd-tools handle the error
  exit 0
fi

# Check for the completion marker
if [ -f "${PHASE_DIR}/.post-execution-complete" ]; then
  exit 0
fi

# BLOCKED — marker not found
echo "BLOCKED: Post-execution sequence not completed for phase ${PHASE_NUM}."
echo ""
echo "Run /scott:phase-closeout first. It handles verify, review, reflect, and gate."
echo "The marker file is created automatically when phase-closeout completes."
echo "To bypass: /scott:bypass"
exit 2
