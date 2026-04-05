---
name: scott-rebuild-metrics
description: >-
  Regenerate checks/metrics.json from all audit artifacts across all projects.
  Use when metrics.json is missing, corrupted, or out of sync. Also use when
  Scott says "rebuild metrics", "refresh metrics", "regenerate metrics",
  "metrics.json is wrong", "checks are out of sync", "audit data is stale",
  "recompute metrics", or "fix metrics".
user_invocable: true
invocation_hint: /scott:rebuild-metrics - Regenerate metrics.json from audit artifacts
section: stack
---

# Rebuild Metrics

## Purpose
Delete `checks/metrics.json` and regenerate it from scratch by scanning all
audit artifacts across all projects. This is the recovery command for when
the computed cache gets out of sync with the source data.

## When to use
- `metrics.json` is missing or corrupted
- Audit artifacts were manually edited or added
- After recovering from a git issue that affected metrics
- Scott says "rebuild metrics"

## Instructions

### Phase 1: Rebuild [AUTO]

1. Run: `~/Sites/Global/scott-toolkit/tools/stack-metrics.sh --full-rebuild`
2. Show the output to Scott

### Phase 2: Verify [AUTO]

1. Read the regenerated `~/Sites/Global/scott-toolkit/checks/metrics.json`
2. Confirm it has valid JSON structure
3. Report: "Metrics rebuilt. Found <N> projects, <N> audit files, <N> checks tracked."

That's it. This is a simple recovery command.
