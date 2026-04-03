#!/usr/bin/env bash
# toolkit-lint.sh — Batch scanner for stale cross-references in toolkit and project files.
# Reads banned patterns from config/version-manifest.json (single source of truth).
# Exit 0 = clean, Exit 1 = stale references found (works as pre-commit gate).
# Usage: toolkit-lint.sh [--fix]

set -euo pipefail

TOOLKIT_DIR="${SCOTT_TOOLKIT_DIR:-$HOME/Sites/Global/scott-toolkit}"
MANIFEST="$TOOLKIT_DIR/config/version-manifest.json"
SITES_DIR="$HOME/Sites"
FIX_MODE=false

if [[ "${1:-}" == "--fix" ]]; then
  FIX_MODE=true
fi

# --- Preflight checks ---
if ! command -v jq &>/dev/null; then
  echo "ERROR: jq is required but not installed." >&2
  exit 2
fi

if [[ ! -f "$MANIFEST" ]]; then
  echo "ERROR: Version manifest not found at $MANIFEST" >&2
  exit 2
fi

# --- Read banned patterns from manifest ---
PATTERN_COUNT=$(jq '.cross_reference_patterns.banned | length' "$MANIFEST")
if [[ "$PATTERN_COUNT" -eq 0 ]]; then
  echo "No banned patterns defined in manifest."
  exit 0
fi

# --- Build file list ---
FILES=()

# Toolkit .md files (skip historical docs that legitimately reference old names)
while IFS= read -r -d '' file; do
  basename=$(basename "$file")
  # Skip changelog, resume, and historical audit/comparison docs
  case "$basename" in
    CHANGELOG.md|.claude-resume.md) continue ;;
    v4-file-audit.md|v5-comparison-table.md|v5-unified-design.md) continue ;;
  esac
  FILES+=("$file")
done < <(find "$TOOLKIT_DIR" -name '*.md' -not -path '*/.git/*' -print0 2>/dev/null)

# External CLAUDE.md files from scan_paths
EXTERNAL_GLOBS=$(jq -r '.cross_reference_patterns.scan_paths.external_claude_md[]' "$MANIFEST")
while IFS= read -r glob_pattern; do
  # Expand the glob relative to ~/Sites/
  for file in $SITES_DIR/$glob_pattern; do
    if [[ -f "$file" ]]; then
      FILES+=("$file")
    fi
  done
done <<< "$EXTERNAL_GLOBS"

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "No files to scan."
  exit 0
fi

# --- Scan for stale patterns ---
TOTAL_HITS=0
FILES_WITH_HITS=()

for i in $(seq 0 $((PATTERN_COUNT - 1))); do
  PATTERN=$(jq -r ".cross_reference_patterns.banned[$i].pattern" "$MANIFEST")
  REPLACEMENT=$(jq -r ".cross_reference_patterns.banned[$i].replacement" "$MANIFEST")
  REASON=$(jq -r ".cross_reference_patterns.banned[$i].reason" "$MANIFEST")
  HAS_CONTEXT=$(jq -r ".cross_reference_patterns.banned[$i].context // empty" "$MANIFEST")

  for file in "${FILES[@]}"; do
    # Use grep -n to find matching lines with line numbers
    while IFS=: read -r line_num line_content; do
      echo "  $file:$line_num"
      echo "    Pattern:     $PATTERN"
      echo "    Replacement: $REPLACEMENT"
      echo "    Reason:      $REASON"
      echo ""
      TOTAL_HITS=$((TOTAL_HITS + 1))

      # Track unique files with hits
      if [[ ! " ${FILES_WITH_HITS[*]:-} " =~ " $file " ]]; then
        FILES_WITH_HITS+=("$file")
      fi

      # Auto-fix if --fix and no context field (context means human judgment needed)
      if [[ "$FIX_MODE" == true && -z "$HAS_CONTEXT" ]]; then
        if [[ "$(uname)" == "Darwin" ]]; then
          sed -i '' "s|${PATTERN}|${REPLACEMENT}|g" "$file"
        else
          sed -i "s|${PATTERN}|${REPLACEMENT}|g" "$file"
        fi
        echo "    ✓ Auto-fixed"
        echo ""
      elif [[ "$FIX_MODE" == true && -n "$HAS_CONTEXT" ]]; then
        echo "    ⚠ Skipped (has 'context' field — needs human judgment)"
        echo ""
      fi
    done < <(grep -n -F "$PATTERN" "$file" 2>/dev/null || true)
  done
done

# --- Summary ---
echo "---"
if [[ $TOTAL_HITS -gt 0 ]]; then
  echo "$TOTAL_HITS stale reference(s) found in ${#FILES_WITH_HITS[@]} file(s)."
  if [[ "$FIX_MODE" == false ]]; then
    echo "Run: tools/toolkit-lint.sh --fix  to auto-fix simple patterns."
  fi
  exit 1
else
  echo "No stale references found."
  exit 0
fi
