#!/bin/bash
# Hook: PreCompact/Stop — Extract Instinct Candidates
# Prompts Claude to analyze the current session for patterns worth capturing.
# Writes observations to .claude/instinct-candidates.md for review during retros.
#
# This feeds into the Spa Day workflow (toolkit-spa-day.md) which periodically
# reviews candidates and promotes them to permanent rules/skills.

PROJECT_DIR="$(pwd)"
CANDIDATES_FILE="$HOME/.claude/instinct-candidates.md"

# Create file if it doesn't exist
if [ ! -f "$CANDIDATES_FILE" ]; then
  echo "# Instinct Candidates" > "$CANDIDATES_FILE"
  echo "" >> "$CANDIDATES_FILE"
  echo "Auto-captured session patterns for review during retros or Spa Day." >> "$CANDIDATES_FILE"
  echo "Promote useful patterns to rules/skills. Delete stale ones." >> "$CANDIDATES_FILE"
  echo "" >> "$CANDIDATES_FILE"
fi

# Prompt Claude to capture patterns
echo "SESSION ENDING — Before you go, briefly note any patterns from this session:"
echo "  - Repeated strategies that worked well (potential skill)"
echo "  - Mistakes or anti-patterns to avoid (potential rule)"
echo "  - Workflow friction points (potential improvement)"
echo "Append to ~/.claude/instinct-candidates.md with today's date and project name."
echo "Skip if nothing notable happened this session."

exit 0
