#!/bin/bash
# Context-Aware Reminders Hook (PostToolUse, all tools)
# Tracks session duration and tool use count. Warns at thresholds.
# Replaces the behavioral "context rot" rule with mechanical enforcement.
#
# Thresholds:
#   - 60 minutes: suggest /compact or fresh session (then every 30 min)
#   - 100 tool uses: suggest /compact (then every 50)
#
# State file: /tmp/claude-context-HASH.json (per-directory, per-day)

# Generate a stable session key from working directory + today's date
day=$(date +%Y%m%d)
dir_hash=$(echo "$PWD" | md5 2>/dev/null || echo "$PWD" | md5sum | cut -c1-8)
dir_hash="${dir_hash:0:8}"
state_file="/tmp/claude-context-${dir_hash}-${day}.json"

# Initialize state file on first call
if [ ! -f "$state_file" ]; then
  now=$(date +%s)
  echo "{\"start\":$now,\"tools\":0,\"warned_duration\":0,\"warned_tools\":0}" > "$state_file"
  exit 0
fi

# Read current state
state=$(cat "$state_file")
start=$(echo "$state" | jq -r '.start')
tools=$(echo "$state" | jq -r '.tools')
warned_duration=$(echo "$state" | jq -r '.warned_duration')
warned_tools=$(echo "$state" | jq -r '.warned_tools')

# Increment tool count
tools=$((tools + 1))
now=$(date +%s)
elapsed=$(( now - start ))
elapsed_min=$(( elapsed / 60 ))

# Check duration threshold (60 min first, then every 30 min)
duration_warn=""
if [ "$elapsed_min" -ge 60 ]; then
  # Calculate which 30-min bracket we're in (60, 90, 120, ...)
  bracket=$(( (elapsed_min - 60) / 30 ))
  if [ "$bracket" -gt "$warned_duration" ] || [ "$warned_duration" -eq 0 ]; then
    warned_duration=$((bracket + 1))
    hours=$((elapsed_min / 60))
    mins=$((elapsed_min % 60))
    duration_warn="Session running ${hours}h${mins}m. Context may be degrading. Consider /compact or a fresh session."
  fi
fi

# Check tool count threshold (100 first, then every 50)
tools_warn=""
if [ "$tools" -ge 100 ]; then
  bracket=$(( (tools - 100) / 50 ))
  if [ "$bracket" -gt "$warned_tools" ] || [ "$warned_tools" -eq 0 ]; then
    warned_tools=$((bracket + 1))
    tools_warn="$tools tool uses this session. Context window is filling up. Consider /compact."
  fi
fi

# Write updated state
echo "{\"start\":$start,\"tools\":$tools,\"warned_duration\":$warned_duration,\"warned_tools\":$warned_tools}" > "$state_file"

# Output warnings
if [ -n "$duration_warn" ] || [ -n "$tools_warn" ]; then
  echo ""
  echo "--- Context Health Check ---"
  [ -n "$duration_warn" ] && echo "  $duration_warn"
  [ -n "$tools_warn" ] && echo "  $tools_warn"
  echo "----------------------------"
fi

exit 0
