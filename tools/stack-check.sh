#!/usr/bin/env bash
# stack-check.sh — Run static checks from check files against project files
# Zero tokens, CLI only. Reads check files from toolkit, runs grep patterns.
# Usage: stack-check.sh [options] [files...]
#   --project-dir DIR    Project root (default: current directory)
#   --checks-dir DIR     Check files directory (default: ~/Sites/Global/scott-toolkit/checks)
#   --stack-lock FILE    Path to stack-lock.json (default: PROJECT_DIR/stack-lock.json)
#   --tech TECH          Only run checks for this technology (can repeat)
#   --format FORMAT      Output format: text (default) or json
#   files...             Specific files to check (default: all project files)

set -euo pipefail

# --- Defaults ---
PROJECT_DIR="."
CHECKS_DIR="${SCOTT_TOOLKIT_DIR:-$HOME/Sites/Global/scott-toolkit}/checks"
STACK_LOCK=""
TECHS=()
FORMAT="text"
FILES=()

# --- Parse args ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir) PROJECT_DIR="$2"; shift 2 ;;
    --checks-dir) CHECKS_DIR="$2"; shift 2 ;;
    --stack-lock) STACK_LOCK="$2"; shift 2 ;;
    --tech) TECHS+=("$2"); shift 2 ;;
    --format) FORMAT="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: stack-check.sh [--project-dir DIR] [--tech TECH] [--format text|json] [files...]"
      exit 0
      ;;
    *) FILES+=("$1"); shift ;;
  esac
done

[[ -z "$STACK_LOCK" ]] && STACK_LOCK="${PROJECT_DIR}/stack-lock.json"

# --- Determine which technologies to check ---
get_locked_techs() {
  if [[ -f "$STACK_LOCK" ]]; then
    # Extract technology names where audit=true
    grep -o '"[a-z-]*":\s*{[^}]*"audit":\s*true' "$STACK_LOCK" | grep -o '^"[^"]*"' | tr -d '"'
  else
    # No stack-lock: check all available technologies
    for f in "$CHECKS_DIR"/*.json; do
      [[ "$(basename "$f")" == "stack-lock.schema.json" ]] && continue
      basename "$f" .json
    done
  fi
}

if [[ ${#TECHS[@]} -eq 0 ]]; then
  while IFS= read -r tech; do
    TECHS+=("$tech")
  done < <(get_locked_techs)
fi

# --- Check if this is a Bun project ---
is_bun_project() {
  [[ -f "${PROJECT_DIR}/bunfig.toml" || -f "${PROJECT_DIR}/bun.lockb" || -f "${PROJECT_DIR}/bun.lock" ]]
}

# --- Load exceptions from stack-lock ---
is_excepted() {
  local check_id="$1" file="$2"
  if [[ -f "$STACK_LOCK" ]]; then
    grep -q "\"check_id\":\s*\"${check_id}\"" "$STACK_LOCK" && \
    grep -q "\"file\":\s*\"${file}\"" "$STACK_LOCK" && return 0
  fi
  return 1
}

# --- Run checks ---
ERRORS=0
WARNINGS=0
RESULTS=()

run_checks_for_tech() {
  local tech="$1"
  local check_file="${CHECKS_DIR}/${tech}.json"

  if [[ ! -f "$check_file" ]]; then
    return
  fi

  # Extract static checks using basic parsing (no jq dependency)
  local in_static=false
  local id="" pattern="" message="" severity="" condition="" file_filter=""

  while IFS= read -r line; do
    # Track when we enter/exit the static checks array
    if echo "$line" | grep -q '"static"'; then
      in_static=true
      continue
    fi
    if [[ "$in_static" == true ]] && echo "$line" | grep -q '^\s*\]'; then
      in_static=false
      continue
    fi

    if [[ "$in_static" != true ]]; then
      continue
    fi

    # Parse check fields
    if echo "$line" | grep -q '"id"'; then
      id=$(echo "$line" | sed 's/.*"id":\s*"\([^"]*\)".*/\1/')
    elif echo "$line" | grep -q '"pattern"'; then
      pattern=$(echo "$line" | sed 's/.*"pattern":\s*"\([^"]*\)".*/\1/')
    elif echo "$line" | grep -q '"message"'; then
      message=$(echo "$line" | sed 's/.*"message":\s*"\([^"]*\)".*/\1/')
    elif echo "$line" | grep -q '"severity"'; then
      severity=$(echo "$line" | sed 's/.*"severity":\s*"\([^"]*\)".*/\1/')
    elif echo "$line" | grep -q '"condition"'; then
      condition=$(echo "$line" | sed 's/.*"condition":\s*"\([^"]*\)".*/\1/')
    elif echo "$line" | grep -q '"file_filter"'; then
      file_filter=$(echo "$line" | sed 's/.*"file_filter":\s*"\([^"]*\)".*/\1/')
    fi

    # End of a check object — process it
    if echo "$line" | grep -q '^\s*}'; then
      if [[ -n "$id" && -n "$pattern" ]]; then
        # Check condition
        if [[ "$condition" == "bun_project" ]] && ! is_bun_project; then
          id="" pattern="" message="" severity="" condition="" file_filter=""
          continue
        fi

        # Build grep args
        local grep_args=(-rn --include="*.ts" --include="*.js" --include="*.vue" --include="*.surql" --include="*.css")
        if [[ -n "$file_filter" ]]; then
          grep_args=(-rn --include="$file_filter")
        fi

        # Search files
        local search_target="${PROJECT_DIR}"
        if [[ ${#FILES[@]} -gt 0 ]]; then
          search_target=""
          for f in "${FILES[@]}"; do
            search_target="$search_target $f"
          done
        fi

        local matches
        matches=$(grep -E "${grep_args[@]}" "$pattern" $search_target 2>/dev/null || true)

        if [[ -n "$matches" ]]; then
          while IFS= read -r match_line; do
            local file_path
            file_path=$(echo "$match_line" | cut -d: -f1)
            local line_num
            line_num=$(echo "$match_line" | cut -d: -f2)

            # Skip node_modules, .git, .planning
            if echo "$file_path" | grep -qE "(node_modules|\.git/|\.planning/)"; then
              continue
            fi

            # Skip excepted files
            if is_excepted "$id" "$file_path"; then
              continue
            fi

            if [[ "$severity" == "error" ]]; then
              ((ERRORS++)) || true
            else
              ((WARNINGS++)) || true
            fi

            if [[ "$FORMAT" == "json" ]]; then
              RESULTS+=("{\"check\":\"${id}\",\"severity\":\"${severity}\",\"file\":\"${file_path}\",\"line\":${line_num},\"message\":\"${message}\"}")
            else
              local color="\033[33m" # yellow for warning
              [[ "$severity" == "error" ]] && color="\033[31m" # red for error
              echo -e "${color}[${severity^^}]${color}\033[0m ${file_path}:${line_num}"
              echo "  ${id}: ${message}"
            fi
          done <<< "$matches"
        fi
      fi
      id="" pattern="" message="" severity="" condition="" file_filter=""
    fi
  done < "$check_file"
}

# --- Main ---
echo "Stack Check — $(date +%Y-%m-%d\ %H:%M)"
echo "Project: $(cd "$PROJECT_DIR" && pwd)"
echo "Technologies: ${TECHS[*]}"
if [[ -f "$STACK_LOCK" ]]; then
  echo "Stack lock: $STACK_LOCK"
else
  echo "Stack lock: none (checking all patterns)"
fi
echo "---"

for tech in "${TECHS[@]}"; do
  run_checks_for_tech "$tech"
done

# --- Summary ---
echo ""
if [[ "$FORMAT" == "json" ]]; then
  echo "["
  for i in "${!RESULTS[@]}"; do
    if [[ $i -lt $((${#RESULTS[@]} - 1)) ]]; then
      echo "  ${RESULTS[$i]},"
    else
      echo "  ${RESULTS[$i]}"
    fi
  done
  echo "]"
fi

TOTAL=$((ERRORS + WARNINGS))
if [[ $TOTAL -eq 0 ]]; then
  echo -e "\033[32mPASS\033[0m — No violations found."
  exit 0
elif [[ $ERRORS -gt 0 ]]; then
  echo -e "\033[31mFAIL\033[0m — ${ERRORS} error(s), ${WARNINGS} warning(s)."
  exit 1
else
  echo -e "\033[33mWARN\033[0m — ${WARNINGS} warning(s), 0 errors."
  exit 0
fi
