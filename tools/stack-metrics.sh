#!/usr/bin/env bash
# stack-metrics.sh — Aggregate audit artifacts into checks/metrics.json
# Discovers projects dynamically by scanning ~/Sites/ for directories with
# both stack-lock.json and .planning/audits/. Computes per-check statistics
# and finds unmatched [stack]-tagged lessons.
#
# Usage: stack-metrics.sh [--full-rebuild]
#   --full-rebuild: Delete metrics.json and regenerate from scratch
# Output: Updates checks/metrics.json and prints summary to stdout
#
# Compatible with macOS default bash (3.2) — no associative arrays.

set -eo pipefail

TOOLKIT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
METRICS_FILE="${TOOLKIT_DIR}/checks/metrics.json"
SITES_DIR="${HOME}/Sites"

# --- Flags ---
FULL_REBUILD=false
if [[ "${1:-}" == "--full-rebuild" ]]; then
  FULL_REBUILD=true
fi

info()  { echo -e "\033[34m[INFO]\033[0m $*"; }
ok()    { echo -e "\033[32m[  OK]\033[0m $*"; }
warn()  { echo -e "\033[33m[WARN]\033[0m $*"; }

# --- Full rebuild: delete existing metrics ---
if [[ "$FULL_REBUILD" == true ]]; then
  if [[ -f "$METRICS_FILE" ]]; then
    rm "$METRICS_FILE"
    info "Deleted existing metrics.json (full rebuild)"
  fi
fi

# --- Temp directory for per-check counters (avoids declare -A) ---
CHECK_DIR=$(mktemp -d)
trap "rm -rf $CHECK_DIR" EXIT

# Helper: increment a counter file (create if missing)
inc() {
  local file="$1" amount="${2:-1}"
  local current=0
  if [[ -f "$file" ]]; then current=$(cat "$file"); fi
  echo $((current + amount)) > "$file"
}

# Helper: read a counter file (default 0)
val() {
  local file="$1"
  if [[ -f "$file" ]]; then cat "$file"; else echo 0; fi
}

# Helper: read a string file (default empty)
sval() {
  local file="$1"
  if [[ -f "$file" ]]; then cat "$file"; else echo ""; fi
}

# --- Discover projects ---
PROJECTS=()
while IFS= read -r stack_lock; do
  project_dir="$(dirname "$stack_lock")"
  if [[ -d "${project_dir}/.planning/audits" ]]; then
    PROJECTS+=("$project_dir")
  fi
done < <(find "$SITES_DIR" -maxdepth 4 -name "stack-lock.json" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null || true)

echo "Stack Metrics — $(date +%Y-%m-%d\ %H:%M)"
echo "Scanning: ${SITES_DIR}"
echo "Projects discovered: ${#PROJECTS[@]}"
if [[ ${#PROJECTS[@]} -gt 0 ]]; then
  for p in "${PROJECTS[@]}"; do
    echo "  - ${p#$HOME/}"
  done
fi
echo "---"

if [[ ${#PROJECTS[@]} -eq 0 ]]; then
  info "No projects with audit data found. Metrics will be empty."
  info "Projects need both stack-lock.json and .planning/audits/ to be included."
fi

# --- Scan audit artifacts ---
AUDIT_COUNT=0
for project_dir in "${PROJECTS[@]}"; do
  while IFS= read -r audit_file; do
    AUDIT_COUNT=$((AUDIT_COUNT + 1))

    # Parse each check entry from the audit JSON
    current_id=""
    current_result=""
    current_fix_applied=""
    current_fp=""
    current_fix_attempts=""

    while IFS= read -r line; do
      if echo "$line" | grep -q '"check_id"'; then
        current_id=$(echo "$line" | sed -E 's/.*"check_id":[ ]*"([^"]+)".*/\1/')
      elif echo "$line" | grep -q '"result"'; then
        current_result=$(echo "$line" | sed -E 's/.*"result":[ ]*"([^"]+)".*/\1/')
      elif echo "$line" | grep -q '"fix_applied"'; then
        if echo "$line" | grep -q "true"; then
          current_fix_applied="true"
        else
          current_fix_applied="false"
        fi
      elif echo "$line" | grep -q '"false_positive"'; then
        if echo "$line" | grep -q "true"; then
          current_fp="true"
        else
          current_fp="false"
        fi
      elif echo "$line" | grep -q '"fix_attempts"'; then
        current_fix_attempts=$(echo "$line" | sed -E 's/.*"fix_attempts":[ ]*([0-9]+).*/\1/')
      fi

      # When we hit a closing brace after collecting fields, process the entry
      if echo "$line" | grep -q "}" && [[ -n "$current_id" && -n "$current_result" ]]; then
        # Create check directory if first time seeing it
        mkdir -p "${CHECK_DIR}/${current_id}"

        inc "${CHECK_DIR}/${current_id}/total"

        case "$current_result" in
          PASS)   inc "${CHECK_DIR}/${current_id}/pass" ;;
          FAIL)
            inc "${CHECK_DIR}/${current_id}/fail"
            audit_date=$(grep -o '"timestamp":[^,]*' "$audit_file" 2>/dev/null | head -1 | sed -E 's/.*"([0-9]{4}-[0-9]{2}-[0-9]{2}).*/\1/' || echo "")
            if [[ -n "$audit_date" ]]; then
              echo "$audit_date" > "${CHECK_DIR}/${current_id}/last_caught"
            fi
            ;;
          ACCEPT) inc "${CHECK_DIR}/${current_id}/accept" ;;
        esac

        if [[ "$current_fix_applied" == "true" ]]; then
          inc "${CHECK_DIR}/${current_id}/fixes"
        fi
        if [[ "$current_fp" == "true" ]]; then
          inc "${CHECK_DIR}/${current_id}/fp"
        fi
        if [[ -n "$current_fix_attempts" && "$current_fix_attempts" != "0" ]]; then
          inc "${CHECK_DIR}/${current_id}/fix_attempts" "$current_fix_attempts"
        fi

        # Reset for next entry
        current_id=""
        current_result=""
        current_fix_applied=""
        current_fp=""
        current_fix_attempts=""
      fi
    done < "$audit_file"

  done < <(find "${project_dir}/.planning/audits" -name "audit_*.json" 2>/dev/null || true)
done

# --- Scan for unmatched [stack] lessons ---
UNMATCHED_FILE=$(mktemp)
for project_dir in "${PROJECTS[@]}"; do
  lessons_file="${project_dir}/tasks/lessons.md"
  if [[ -f "$lessons_file" ]]; then
    project_name=$(basename "$project_dir")
    while IFS= read -r lesson_line; do
      if [[ -n "$lesson_line" ]] && ! echo "$lesson_line" | grep -q "\[promoted to check:"; then
        clean_line=$(echo "$lesson_line" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\[stack\][ ]*//')
        echo "{\"project\": \"${project_name}\", \"lesson\": \"${clean_line}\"}" >> "$UNMATCHED_FILE"
      fi
    done < <(grep "^\[stack\]" "$lessons_file" 2>/dev/null || true)
  fi
done

UNMATCHED_COUNT=0
if [[ -f "$UNMATCHED_FILE" ]]; then
  UNMATCHED_COUNT=$(wc -l < "$UNMATCHED_FILE" | tr -d ' ')
fi

# --- Compute value score ---
compute_value_score() {
  local total="$1" fp="$2" fixes="$3" harmful="$4"

  if [[ "$harmful" -gt 0 ]]; then
    echo "harmful"; return
  fi
  if [[ "$total" -gt 0 && "$fp" -gt 0 ]]; then
    local fp_rate=$(( (fp * 100) / total ))
    if [[ "$fp_rate" -gt 30 ]]; then
      echo "noisy"; return
    fi
  fi
  if [[ "$fixes" -ge 3 ]]; then
    echo "high"
  elif [[ "$fixes" -ge 1 ]]; then
    echo "proven"
  else
    echo "untested"
  fi
}

# --- Get list of all check IDs ---
CHECK_IDS=()
if [[ -d "$CHECK_DIR" ]]; then
  for d in "$CHECK_DIR"/*/; do
    if [[ -d "$d" ]]; then
      CHECK_IDS+=("$(basename "$d")")
    fi
  done
fi
CHECK_COUNT=${#CHECK_IDS[@]}

# --- Build metrics JSON ---
TEMP_METRICS=$(mktemp)
{
  echo "{"
  echo "  \"last_aggregated\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","

  # Discovered projects
  echo "  \"discovered_projects\": ["
  first=true
  if [[ ${#PROJECTS[@]} -gt 0 ]]; then
    for p in "${PROJECTS[@]}"; do
      if [[ "$first" == true ]]; then first=false; else echo ","; fi
      printf "    \"%s\"" "${p#$HOME/}"
    done
  fi
  echo ""
  echo "  ],"

  # Overall pass rate
  total_all=0
  pass_all=0
  if [[ ${#CHECK_IDS[@]} -gt 0 ]]; then
    for cid in "${CHECK_IDS[@]}"; do
      total_all=$((total_all + $(val "${CHECK_DIR}/${cid}/total")))
      pass_all=$((pass_all + $(val "${CHECK_DIR}/${cid}/pass")))
    done
  fi
  if [[ "$total_all" -gt 0 ]]; then
    pass_pct=$((pass_all * 100 / total_all))
    echo "  \"overall_pass_rate\": 0.${pass_pct},"
  else
    echo "  \"overall_pass_rate\": null,"
  fi

  echo "  \"audit_count\": ${AUDIT_COUNT},"

  # Per-check stats
  echo "  \"checks\": {"
  first=true
  for cid in $(if [[ ${#CHECK_IDS[@]} -gt 0 ]]; then printf '%s\n' "${CHECK_IDS[@]}" | sort; fi); do
    if [[ "$first" == true ]]; then first=false; else echo ","; fi

    c_total=$(val "${CHECK_DIR}/${cid}/total")
    c_pass=$(val "${CHECK_DIR}/${cid}/pass")
    c_fail=$(val "${CHECK_DIR}/${cid}/fail")
    c_accept=$(val "${CHECK_DIR}/${cid}/accept")
    c_fp=$(val "${CHECK_DIR}/${cid}/fp")
    c_fixes=$(val "${CHECK_DIR}/${cid}/fixes")
    c_harmful=0
    c_fix_attempts=$(val "${CHECK_DIR}/${cid}/fix_attempts")
    c_last=$(sval "${CHECK_DIR}/${cid}/last_caught")

    # Average fix attempts
    if [[ "$c_fixes" -gt 0 ]]; then
      avg_x10=$((c_fix_attempts * 10 / c_fixes))
      avg_str="$((avg_x10 / 10)).$((avg_x10 % 10))"
    else
      avg_str="0"
    fi

    value=$(compute_value_score "$c_total" "$c_fp" "$c_fixes" "$c_harmful")

    printf "    \"%s\": {\n" "$cid"
    printf "      \"total_runs\": %d,\n" "$c_total"
    printf "      \"pass\": %d,\n" "$c_pass"
    printf "      \"fail\": %d,\n" "$c_fail"
    printf "      \"accept\": %d,\n" "$c_accept"
    printf "      \"false_positives\": %d,\n" "$c_fp"
    printf "      \"fixes_applied\": %d,\n" "$c_fixes"
    printf "      \"harmful_count\": %d,\n" "$c_harmful"
    printf "      \"avg_fix_attempts\": %s,\n" "$avg_str"
    printf "      \"value_score\": \"%s\",\n" "$value"
    if [[ -n "$c_last" ]]; then
      printf "      \"last_caught\": \"%s\"\n" "$c_last"
    else
      printf "      \"last_caught\": null\n"
    fi
    printf "    }"
  done
  echo ""
  echo "  },"

  # Unmatched lessons
  echo "  \"unmatched_lessons\": ["
  if [[ -s "$UNMATCHED_FILE" ]]; then
    first=true
    while IFS= read -r lesson_json; do
      if [[ "$first" == true ]]; then first=false; else echo ","; fi
      printf "    %s" "$lesson_json"
    done < "$UNMATCHED_FILE"
  fi
  echo ""
  echo "  ]"

  echo "}"
} > "$TEMP_METRICS"

mv "$TEMP_METRICS" "$METRICS_FILE"
rm -f "$UNMATCHED_FILE"

# --- Summary ---
echo ""
echo "--- Aggregation Summary ---"
ok "Scanned ${#PROJECTS[@]} projects, ${AUDIT_COUNT} audit files"
ok "Tracked ${CHECK_COUNT} unique checks"
if [[ "$UNMATCHED_COUNT" -gt 0 ]]; then
  warn "${UNMATCHED_COUNT} unmatched [stack] lessons (candidates for new checks)"
else
  ok "No unmatched [stack] lessons"
fi
ok "Metrics written to ${METRICS_FILE#$TOOLKIT_DIR/}"
