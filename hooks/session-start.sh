#!/bin/bash
# Hook: SessionStart — Smart Project Detection + Active Projects Rebuild
# 1. Scans ~/Sites/*/.claude-resume.md to rebuild ACTIVE-PROJECTS.md
# 2. Detects current project state and suggests the right workflow
# Non-blocking: outputs a suggestion, does not auto-invoke anything.

SITES_DIR="$HOME/Sites"
ACTIVE_PROJECTS="$SITES_DIR/Global/ACTIVE-PROJECTS.md"
PROJECT_DIR="$(pwd)"

# --- 0. Sync down from GitHub ---
if [ -x "$HOME/.claude-config/sync-down.sh" ]; then
    "$HOME/.claude-config/sync-down.sh" || true
fi

# --- 0b. Log rotation for bash-commands.log ---
BASH_LOG="$HOME/.claude/bash-commands.log"
if [ -f "$BASH_LOG" ]; then
  line_count=$(wc -l < "$BASH_LOG")
  if [ "$line_count" -gt 1000 ]; then
    tail -500 "$BASH_LOG" > "${BASH_LOG}.tmp" && mv "${BASH_LOG}.tmp" "$BASH_LOG"
  fi
fi

# --- 1. Rebuild ACTIVE-PROJECTS.md from resume files ---
{
  echo "# Active Projects"
  echo "_Auto-generated at $(date '+%Y-%m-%d %H:%M'). Do not edit manually._"
  echo ""
  echo "| Project | Last Worked | Status | Path |"
  echo "|---------|-------------|--------|------|"

  FOUND_ANY=false
  for resume_file in "$SITES_DIR"/*/.claude-resume.md "$SITES_DIR"/*/*/.claude-resume.md; do
    [ -f "$resume_file" ] || continue
    FOUND_ANY=true

    proj_dir="$(dirname "$resume_file")"
    proj_name="$(basename "$proj_dir")"
    last_modified="$(stat -f '%Sm' -t '%Y-%m-%d' "$resume_file" 2>/dev/null || date -r "$resume_file" '+%Y-%m-%d' 2>/dev/null || echo 'unknown')"

    # Extract status from the "## Where we are" or first non-header line
    status="$(grep -A1 '## Where we are' "$resume_file" 2>/dev/null | tail -1 | sed 's/^[[:space:]]*//')"
    if [ -z "$status" ]; then
      status="$(grep -m1 '^Workflow:\|^Current:' "$resume_file" 2>/dev/null | head -1 | sed 's/^[[:space:]]*//')"
    fi
    [ -z "$status" ] && status="In progress"

    # Truncate long status
    if [ ${#status} -gt 60 ]; then
      status="${status:0:57}..."
    fi

    echo "| $proj_name | $last_modified | $status | $proj_dir |"
  done

  if [ "$FOUND_ANY" = false ]; then
    echo "| _(none)_ | | No active projects found | |"
  fi
} > "$ACTIVE_PROJECTS"

# --- 1b. Stack-lock staleness check ---
if [ -f "$PROJECT_DIR/stack-lock.json" ]; then
  LAST_REVIEWED=$(grep -o '"last_reviewed":\s*"[^"]*"' "$PROJECT_DIR/stack-lock.json" 2>/dev/null | sed -E 's/.*"([0-9]{4}-[0-9]{2}-[0-9]{2})".*/\1/' || true)
  if [ -z "$LAST_REVIEWED" ]; then
    LAST_REVIEWED=$(grep -o '"locked":\s*"[^"]*"' "$PROJECT_DIR/stack-lock.json" 2>/dev/null | sed -E 's/.*"([0-9]{4}-[0-9]{2}-[0-9]{2})".*/\1/' || true)
  fi
  if [ -n "$LAST_REVIEWED" ]; then
    # Calculate days since last review (macOS date)
    REVIEW_EPOCH=$(date -j -f "%Y-%m-%d" "$LAST_REVIEWED" "+%s" 2>/dev/null || echo 0)
    NOW_EPOCH=$(date "+%s")
    if [ "$REVIEW_EPOCH" -gt 0 ]; then
      DAYS_AGO=$(( (NOW_EPOCH - REVIEW_EPOCH) / 86400 ))
      if [ "$DAYS_AGO" -gt 30 ]; then
        echo "Stack checks last reviewed ${DAYS_AGO} days ago (${LAST_REVIEWED}). Consider running stack-preflight.sh to verify."
      fi
    fi
  fi
fi

# --- 2. Detect current project state ---

# Check if we're in a project directory
if [ -f "$PROJECT_DIR/CLAUDE.md" ]; then
  # Existing project — check for resume file
  # Detect project category from path
  CATEGORY=""
  case "$PROJECT_DIR" in
    "$SITES_DIR"/Global/*)   CATEGORY="Global" ;;
    "$SITES_DIR"/Personal/*) CATEGORY="Personal" ;;
    "$SITES_DIR"/Advosy/*)   CATEGORY="Advosy" ;;
    "$SITES_DIR"/Bresco/*)   CATEGORY="Bresco" ;;
  esac

  if [ -f "$PROJECT_DIR/.claude-resume.md" ]; then
    if [ -n "$CATEGORY" ]; then
      echo "AUTO-RESUME [$CATEGORY]: Resume file found. You MUST invoke /scott:resume before doing any work. Read .claude-resume.md and tasks/todo.md to restore context."
    else
      echo "AUTO-RESUME: Resume file found. You MUST invoke /scott:resume before doing any work. Read .claude-resume.md and tasks/todo.md to restore context."
    fi
  elif [ -d "$PROJECT_DIR/.planning" ]; then
    if [ -n "$CATEGORY" ]; then
      echo "GSD PROJECT [$CATEGORY]: .planning/ directory found. You MUST invoke /scott:resume to check project state before doing any work."
    else
      echo "GSD PROJECT: .planning/ directory found. You MUST invoke /scott:resume to check project state before doing any work."
    fi
  else
    if [ -n "$CATEGORY" ]; then
      echo "Project detected [$CATEGORY] (CLAUDE.md found). No resume file. If Scott asks to continue prior work, invoke /scott:resume."
    else
      echo "Project detected (CLAUDE.md found). No resume file. If Scott asks to continue prior work, invoke /scott:resume."
    fi
  fi
elif [ "$PROJECT_DIR" = "$HOME" ]; then
  # Home directory — show active projects
  COUNT=$(grep -c '^\|' "$ACTIVE_PROJECTS" 2>/dev/null)
  COUNT=$((COUNT - 2))  # subtract header rows
  if [ "$COUNT" -gt 0 ]; then
    echo "Active projects ($COUNT): see ~/Sites/Global/ACTIVE-PROJECTS.md"
  fi
else
  # Unknown directory — might be starting a new project
  if [ -z "$(ls -A "$PROJECT_DIR" 2>/dev/null)" ] || [ ! -f "$PROJECT_DIR/CLAUDE.md" ]; then
    : # Empty or no CLAUDE.md — don't suggest anything, might just be exploring
  fi
fi

exit 0
