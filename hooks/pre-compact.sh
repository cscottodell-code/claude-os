#!/bin/bash
# Hook: PreCompact — Resume File Prompt + Mechanical Backup
# 1. Tells Claude to write .claude-resume.md (Claude has the context to make it useful)
# 2. Writes a mechanical .context-snapshot.md as fallback (in case compaction is instant)

PROJECT_DIR="$(pwd)"

# Only run in projects with CLAUDE.md
if [ ! -f "$PROJECT_DIR/CLAUDE.md" ]; then
  exit 0
fi

# --- Mechanical backup (fallback) ---
SNAPSHOT="$PROJECT_DIR/.context-snapshot.md"
{
  echo "# Context Snapshot"
  echo "_Auto-generated before compaction at $(date '+%Y-%m-%d %H:%M')_"
  echo ""

  if [ -f "$PROJECT_DIR/tasks/todo.md" ]; then
    echo "## Pending Tasks"
    grep -E '^\s*- \[ \]' "$PROJECT_DIR/tasks/todo.md" 2>/dev/null || echo "None."
    echo ""
  fi

  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    BRANCH=$(git branch --show-current 2>/dev/null)
    echo "## Git State"
    echo "Branch: $BRANCH"
    echo '```'
    git log --oneline -5 2>/dev/null || echo "No history."
    echo '```'
    CHANGES=$(git status --short 2>/dev/null)
    if [ -n "$CHANGES" ]; then
      echo "Uncommitted:"
      echo '```'
      echo "$CHANGES"
      echo '```'
    fi
    echo ""
  fi

  if [ -f "$PROJECT_DIR/.planning/STATE.md" ]; then
    echo "## GSD State"
    cat "$PROJECT_DIR/.planning/STATE.md"
    echo ""
  fi
} > "$SNAPSHOT"

# --- Prompt Claude to write the meaningful resume file ---
echo "COMPACTION IMMINENT — Write .claude-resume.md NOW with:"
echo "  - Current workflow and phase"
echo "  - What's done, what's in progress, what's next"
echo "  - Key decisions made this session"
echo "Mechanical backup saved to .context-snapshot.md."

exit 0
