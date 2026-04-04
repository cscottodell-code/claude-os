#!/usr/bin/env bash
# toolkit-lint.sh — Comprehensive integrity checker for the scott-toolkit.
# Checks: stale patterns, skill integrity, hook integrity, settings.json consistency.
# Reads banned patterns from config/version-manifest.json (single source of truth).
# Exit 0 = clean, Exit 1 = issues found (works as pre-commit gate).
# Usage: toolkit-lint.sh [--fix] [--section patterns|skills|hooks|all]

set -uo pipefail

TOOLKIT_DIR="${SCOTT_TOOLKIT_DIR:-$HOME/Sites/Global/scott-toolkit}"
MANIFEST="$TOOLKIT_DIR/config/version-manifest.json"
SETTINGS="$HOME/.claude/settings.json"
SITES_DIR="$HOME/Sites"
HOOKS_SYMLINK_DIR="$HOME/.claude/hooks"
SKILLS_DEPLOY_DIR="$HOME/.claude/skills"
FIX_MODE=false
SECTION="all"
TOTAL_ISSUES=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --fix) FIX_MODE=true ;;
    --section) SECTION="$2"; shift ;;
    --help|-h)
      echo "Usage: toolkit-lint.sh [--fix] [--section patterns|skills|hooks|all]"
      echo ""
      echo "Sections:"
      echo "  patterns  Stale cross-reference patterns (from version-manifest.json)"
      echo "  skills    Skill existence, references, and deployment integrity"
      echo "  hooks     Hook registration, symlinks, and settings.json consistency"
      echo "  all       Run all checks (default)"
      echo ""
      echo "Options:"
      echo "  --fix     Auto-fix stale patterns (skips patterns needing human judgment)"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
  shift
done

# --- Preflight ---
if ! command -v jq &>/dev/null; then
  echo "ERROR: jq is required but not installed." >&2
  exit 2
fi

issue() {
  local section="$1" msg="$2"
  echo "  [$section] $msg"
  TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
}

# ============================================================
# SECTION 1: Stale cross-reference patterns
# ============================================================
if [[ "$SECTION" == "all" || "$SECTION" == "patterns" ]]; then
  echo "=== Stale Pattern Check ==="

  if [[ ! -f "$MANIFEST" ]]; then
    echo "  SKIP: version-manifest.json not found"
  else
    PATTERN_COUNT=$(jq '.cross_reference_patterns.banned | length' "$MANIFEST")

    # Build file list
    SCAN_FILES=()
    while IFS= read -r -d '' file; do
      bn=$(basename "$file")
      case "$bn" in
        CHANGELOG.md|.claude-resume.md) continue ;;
        v4-file-audit.md|v5-comparison-table.md|v5-unified-design.md) continue ;;
      esac
      SCAN_FILES+=("$file")
    done < <(find "$TOOLKIT_DIR" -name '*.md' -not -path '*/.git/*' -print0 2>/dev/null)

    # External CLAUDE.md files
    while IFS= read -r glob_pattern; do
      [[ -z "$glob_pattern" ]] && continue
      for file in $SITES_DIR/$glob_pattern; do
        [[ -f "$file" ]] && SCAN_FILES+=("$file")
      done
    done < <(jq -r '.cross_reference_patterns.scan_paths.external_claude_md[]' "$MANIFEST" 2>/dev/null)

    for i in $(seq 0 $((PATTERN_COUNT - 1))); do
      PATTERN=$(jq -r ".cross_reference_patterns.banned[$i].pattern" "$MANIFEST")
      REPLACEMENT=$(jq -r ".cross_reference_patterns.banned[$i].replacement" "$MANIFEST")
      REASON=$(jq -r ".cross_reference_patterns.banned[$i].reason" "$MANIFEST")
      HAS_CONTEXT=$(jq -r ".cross_reference_patterns.banned[$i].context // empty" "$MANIFEST")

      for file in "${SCAN_FILES[@]}"; do
        while IFS=: read -r line_num _; do
          issue "pattern" "$file:$line_num — '$PATTERN' ($REASON) -> $REPLACEMENT"
          if [[ "$FIX_MODE" == true && -z "$HAS_CONTEXT" ]]; then
            if [[ "$(uname)" == "Darwin" ]]; then
              sed -i '' "s|${PATTERN}|${REPLACEMENT}|g" "$file"
            else
              sed -i "s|${PATTERN}|${REPLACEMENT}|g" "$file"
            fi
            echo "    -> Auto-fixed"
          fi
        done < <(grep -n -F "$PATTERN" "$file" 2>/dev/null || true)
      done
    done
  fi
  echo ""
fi

# ============================================================
# SECTION 2: Skill integrity
# ============================================================
if [[ "$SECTION" == "all" || "$SECTION" == "skills" ]]; then
  echo "=== Skill Integrity Check ==="

  # 2a. Every standalone skill dir must have a SKILL.md
  for skill_dir in "$TOOLKIT_DIR"/skills/*/; do
    [[ -d "$skill_dir" ]] || continue
    skill_name=$(basename "$skill_dir")
    if [[ ! -f "$skill_dir/SKILL.md" ]]; then
      issue "skill" "Missing SKILL.md: skills/$skill_name/"
    fi
  done

  # 2b. Workflow-generated skills: source workflow must exist
  while IFS= read -r line; do
    workflow_file=$(echo "$line" | awk -F'"' '{print $2}')
    skill_name=$(echo "$line" | awk -F'"' '{print $4}')
    if [[ -n "$workflow_file" && ! -f "$TOOLKIT_DIR/workflows/$workflow_file" ]]; then
      issue "skill" "Workflow-generated skill '$skill_name' references missing workflow: workflows/$workflow_file"
    fi
  done < <(grep 'deploy_workflow_skill ' "$TOOLKIT_DIR/setup.sh" | grep -v '^deploy_workflow_skill()')

  # 2c. Skill references in workflows and README must resolve
  ALL_SKILL_NAMES=()
  # Standalone skills
  for d in "$TOOLKIT_DIR"/skills/*/; do
    [[ -d "$d" ]] && ALL_SKILL_NAMES+=("$(basename "$d")")
  done
  # Workflow-generated skills (extract from setup.sh)
  while IFS= read -r name; do
    [[ -n "$name" ]] && ALL_SKILL_NAMES+=("$name")
  done < <(grep 'deploy_workflow_skill ' "$TOOLKIT_DIR/setup.sh" | grep -v '^deploy_workflow_skill()' | awk -F'"' '{print $4}')

  # Deduplicate
  UNIQUE_SKILLS=($(printf '%s\n' "${ALL_SKILL_NAMES[@]}" | sort -u))

  # Find /scott:xxx references in workflows and README
  for ref_file in "$TOOLKIT_DIR"/workflows/*.md "$TOOLKIT_DIR/README.md"; do
    [[ -f "$ref_file" ]] || continue
    while IFS= read -r match; do
      # Convert /scott:foo-bar to scott-foo-bar
      skill_ref=$(echo "$match" | sed 's|^/scott:|scott-|; s|^/||')
      found=false
      for s in "${UNIQUE_SKILLS[@]}"; do
        if [[ "$s" == "$skill_ref" ]]; then
          found=true
          break
        fi
      done
      if [[ "$found" == false ]]; then
        issue "skill" "$(basename "$ref_file") references '$match' but no skill '$skill_ref' exists"
      fi
    done < <(grep -ohE '/scott:[a-z][-a-z]*' "$ref_file" 2>/dev/null | sort -u)
  done

  # 2d. Deployed skills must match source (check for orphaned deployments)
  # Skip *-workspace dirs (eval artifacts from skill-creator)
  if [[ -d "$SKILLS_DEPLOY_DIR" ]]; then
    for deployed_dir in "$SKILLS_DEPLOY_DIR"/scott-*/; do
      [[ -d "$deployed_dir" ]] || continue
      deployed_name=$(basename "$deployed_dir")
      [[ "$deployed_name" == *-workspace ]] && continue
      # Check if it exists as standalone skill OR workflow-generated skill
      found=false
      for s in "${UNIQUE_SKILLS[@]}"; do
        if [[ "$s" == "$deployed_name" ]]; then
          found=true
          break
        fi
      done
      if [[ "$found" == false ]]; then
        issue "skill" "Deployed skill '$deployed_name' in ~/.claude/skills/ has no source in toolkit"
      fi
    done
  fi

  # 2e. Check for standalone/workflow-generated conflicts (same name, two sources)
  while IFS= read -r wf_skill; do
    [[ -z "$wf_skill" ]] && continue
    if [[ -d "$TOOLKIT_DIR/skills/$wf_skill" ]]; then
      issue "skill" "Conflict: '$wf_skill' exists as both standalone skill AND workflow-generated skill in setup.sh"
    fi
  done < <(grep 'deploy_workflow_skill ' "$TOOLKIT_DIR/setup.sh" | grep -v '^deploy_workflow_skill()' | awk -F'"' '{print $4}')

  echo ""
fi

# ============================================================
# SECTION 3: Hook integrity
# ============================================================
if [[ "$SECTION" == "all" || "$SECTION" == "hooks" ]]; then
  echo "=== Hook Integrity Check ==="

  # 3a. Every hook on disk should be registered in settings.json
  if [[ -f "$SETTINGS" ]]; then
    REGISTERED_HOOKS=$(jq -r '.. | .command? // empty' "$SETTINGS" | grep -oE '[^/]+\.sh"?$' | tr -d '"' | sort -u || true)

    for hook_file in "$TOOLKIT_DIR"/hooks/*.sh; do
      hook_name=$(basename "$hook_file")
      if ! echo "$REGISTERED_HOOKS" | grep -qF "$hook_name"; then
        issue "hook" "Hook '$hook_name' exists on disk but is NOT registered in settings.json"
      fi
    done

    # 3b. Every toolkit hook in settings.json should exist on disk
    while IFS= read -r cmd; do
      # Extract hook filename from command path
      hook_name=$(echo "$cmd" | grep -oE '[^/]+\.sh"?$' | tr -d '"')
      [[ -z "$hook_name" ]] && continue
      # Skip non-toolkit hooks (GSD js files, osascript, jq commands, etc.)
      echo "$cmd" | grep -qE '\.claude/hooks/.*\.sh' || continue
      if [[ ! -f "$TOOLKIT_DIR/hooks/$hook_name" && ! -f "$HOOKS_SYMLINK_DIR/$hook_name" ]]; then
        issue "hook" "settings.json references '$hook_name' but it doesn't exist on disk"
      fi
    done < <(jq -r '.. | .command? // empty' "$SETTINGS" 2>/dev/null)

    # 3c. Path consistency: all toolkit hook paths should use symlink form
    while IFS= read -r cmd; do
      if echo "$cmd" | grep -qF 'Sites/Global/scott-toolkit/hooks/'; then
        hook_name=$(echo "$cmd" | grep -oE '[^/]+\.sh"?$' | tr -d '"')
        issue "hook" "settings.json uses direct path for '$hook_name' — should use symlink path (\$HOME/.claude/hooks/)"
      fi
    done < <(jq -r '.. | .command? // empty' "$SETTINGS" 2>/dev/null)

    # 3d. Path form consistency: flag mixed ~ vs $HOME usage
    SETTINGS_HOOKS=$(jq -r '.. | .command? // empty' "$SETTINGS" 2>/dev/null || true)
    TILDE_COUNT=$(echo "$SETTINGS_HOOKS" | grep -cF '~/.claude/hooks/' || true)
    DOLLAR_HOME_COUNT=$(echo "$SETTINGS_HOOKS" | grep -cF '$HOME/.claude/hooks/' || true)
    if [[ "$TILDE_COUNT" -gt 0 && "$DOLLAR_HOME_COUNT" -gt 0 ]]; then
      issue "hook" "settings.json mixes ~ ($TILDE_COUNT) and \$HOME ($DOLLAR_HOME_COUNT) in hook paths — pick one form"
    fi
  else
    echo "  SKIP: settings.json not found at $SETTINGS"
  fi

  # 3e. Dangling symlinks in ~/.claude/hooks/
  if [[ -d "$HOOKS_SYMLINK_DIR" ]]; then
    for symlink in "$HOOKS_SYMLINK_DIR"/*.sh; do
      [[ -L "$symlink" ]] || continue
      if [[ ! -e "$symlink" ]]; then
        issue "hook" "Dangling symlink: ~/.claude/hooks/$(basename "$symlink") -> $(readlink "$symlink")"
      fi
    done
  fi

  # 3f. Dangling symlinks in ~/.claude/skills/
  if [[ -d "$SKILLS_DEPLOY_DIR" ]]; then
    for skill_dir in "$SKILLS_DEPLOY_DIR"/*/; do
      [[ -d "$skill_dir" ]] || continue
      skill_md="$skill_dir/SKILL.md"
      if [[ -L "$skill_md" && ! -e "$skill_md" ]]; then
        issue "skill" "Dangling symlink: ~/.claude/skills/$(basename "$skill_dir")/SKILL.md -> $(readlink "$skill_md")"
      fi
    done
  fi

  echo ""
fi

# ============================================================
# Summary
# ============================================================
echo "=== Summary ==="
if [[ $TOTAL_ISSUES -gt 0 ]]; then
  echo "$TOTAL_ISSUES issue(s) found."
  if [[ "$FIX_MODE" == false && ("$SECTION" == "all" || "$SECTION" == "patterns") ]]; then
    echo "Run: tools/toolkit-lint.sh --fix  to auto-fix stale patterns."
  fi
  exit 1
else
  echo "All checks passed."
  exit 0
fi
