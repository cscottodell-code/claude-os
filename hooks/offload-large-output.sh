#!/bin/bash
# Hook: PostToolUse — Offload Large Tool Outputs
# Detects tool results >4KB and writes them to a file,
# replacing context content with a file path + summary.
#
# This prevents a single large tool result (big file read, web fetch, etc.)
# from eating a huge chunk of the context window.
#
# Output files go to: .claude/tool-output-overflow/
# The post-compaction recovery rule (claude-behavior.md) knows to re-read these.

# Read the tool result from stdin
RESULT=$(cat)
TOOL_NAME=$(echo "$RESULT" | jq -r '.tool_name // empty' 2>/dev/null)
OUTPUT=$(echo "$RESULT" | jq -r '.tool_output // empty' 2>/dev/null)

# Skip if we can't parse or output is empty
if [ -z "$OUTPUT" ] || [ -z "$TOOL_NAME" ]; then
  exit 0
fi

# Check size (4KB = 4096 bytes)
SIZE=$(echo -n "$OUTPUT" | wc -c | tr -d ' ')
if [ "$SIZE" -lt 4096 ]; then
  exit 0
fi

# Create overflow directory
OVERFLOW_DIR="$(pwd)/.claude/tool-output-overflow"
mkdir -p "$OVERFLOW_DIR"

# Write to timestamped file
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
FILENAME="${TOOL_NAME}-${TIMESTAMP}.md"
echo "$OUTPUT" > "$OVERFLOW_DIR/$FILENAME"

# Report to Claude
SIZE_KB=$((SIZE / 1024))
echo "Large tool output (${SIZE_KB}KB) saved to .claude/tool-output-overflow/$FILENAME"
echo "Re-read this file if you need the full content."

exit 0
