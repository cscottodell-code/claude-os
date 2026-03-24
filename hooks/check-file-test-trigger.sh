#!/usr/bin/env bash
# check-file-test-trigger.sh — PostToolUse hook
# Fires test fixtures automatically when check files are edited.
# Registered as a PostToolUse hook for Edit and Write tools.
#
# When a check file (checks/*.json) is modified, this hook runs
# stack-check.sh against the matching test fixtures to verify
# the check file still works correctly.

set -euo pipefail

TOOLKIT_DIR="${SCOTT_TOOLKIT_DIR:-$HOME/Sites/Global/scott-toolkit}"
CHECKS_DIR="${TOOLKIT_DIR}/checks"
FIXTURES_DIR="${CHECKS_DIR}/test-fixtures"
STACK_CHECK="${TOOLKIT_DIR}/tools/stack-check.sh"

# Get the file that was just edited (passed via hook context)
EDITED_FILE="${CLAUDE_TOOL_ARG_FILE_PATH:-${CLAUDE_TOOL_ARG_file_path:-}}"

# Only trigger for check file edits
if [[ -z "$EDITED_FILE" ]]; then
  exit 0
fi

# Normalize to basename
BASENAME=$(basename "$EDITED_FILE")

# Only process .json files in the checks/ directory
if [[ "$EDITED_FILE" != *"/checks/"* ]] || [[ "$BASENAME" != *.json ]]; then
  exit 0
fi

# Skip the schema file
if [[ "$BASENAME" == "stack-lock.schema.json" ]]; then
  exit 0
fi

# Extract technology name from filename (e.g., surrealdb.json -> surrealdb)
TECH="${BASENAME%.json}"

# Check if test fixtures exist for this technology
if [[ ! -d "${FIXTURES_DIR}/${TECH}" ]]; then
  echo "[check-test] No test fixtures found for ${TECH}. Consider adding them."
  exit 0
fi

echo "[check-test] Check file modified: ${BASENAME}"
echo "[check-test] Running test fixtures for ${TECH}..."

PASS=true

# Test good fixtures (should all PASS)
if [[ -d "${FIXTURES_DIR}/${TECH}/good" ]]; then
  echo "[check-test] Testing good fixtures (expect PASS)..."
  if "$STACK_CHECK" --project-dir "${FIXTURES_DIR}/${TECH}/good" --tech "$TECH" >/dev/null 2>&1; then
    echo "[check-test] Good fixtures: PASS"
  else
    echo "[check-test] WARNING: Good fixtures FAILED — check file may have a false positive"
    PASS=false
  fi
fi

# Test bad fixtures (should all FAIL)
if [[ -d "${FIXTURES_DIR}/${TECH}/bad" ]]; then
  echo "[check-test] Testing bad fixtures (expect FAIL)..."
  if "$STACK_CHECK" --project-dir "${FIXTURES_DIR}/${TECH}/bad" --tech "$TECH" >/dev/null 2>&1; then
    echo "[check-test] WARNING: Bad fixtures PASSED — check file may have a false negative"
    PASS=false
  else
    echo "[check-test] Bad fixtures: FAIL (expected)"
  fi
fi

if [[ "$PASS" == true ]]; then
  echo "[check-test] All fixture tests passed for ${TECH}."
else
  echo "[check-test] Fixture tests have issues. Review the check file changes."
fi
