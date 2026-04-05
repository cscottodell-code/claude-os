---
name: scott-stack-review
description: Stack health dashboard showing check metrics, new check candidates, and refinement opportunities. Run monthly (aligned with toolkit-spa-day) or after completing a major milestone. Use when Scott says "stack review", "check health", "how are my checks doing", or "learning loop".
user_invocable: true
invocation_hint: /scott:stack-review - Monthly stack health dashboard (check metrics, learning loop)
section: stack
---

# Stack Review Dashboard

## Purpose
Show Scott how the stack enforcement system is performing across all projects.
Runs `stack-metrics.sh` to aggregate data, then presents a 5-section dashboard
with actionable recommendations. Scott approves or rejects each recommendation.

**No automatic promotion.** The system recommends, Scott decides.

## When to use
- Monthly during toolkit-spa-day
- After completing a major project milestone
- When Scott asks about check quality or learning loop status

## Instructions

### Phase 1: Aggregate [AUTO]

1. Run `~/Sites/Global/scott-toolkit/tools/stack-metrics.sh`
2. Read the generated `~/Sites/Global/scott-toolkit/checks/metrics.json`
3. If metrics are empty (no projects with audit data), tell Scott:
   "No audit data yet. Projects need both `stack-lock.json` and `.planning/audits/` to be tracked.
   Run `/scott:stack-baseline` on an existing project to generate initial audit data."
4. Proceed to the dashboard.

### Phase 2: Dashboard [STOP]

Present all 5 sections. Use tables for readability.

**Section 1: System Health**

Show the overall pass rate as a percentage. Example:
```
Overall pass rate: 94% (across 47 check runs in 3 projects)
```
No automated thresholds. Scott develops intuition for what "normal" looks like over time.

**Section 2: New Check Candidates**

Show `[stack]`-tagged lessons from `unmatched_lessons` in metrics.json.
For each:
- The lesson text and source project
- A suggested check ID (derive from the lesson content, e.g., "surreal-missing-assert-required")
- A suggested pattern if derivable from the lesson

Ask Scott for each: "Promote to check? (yes/skip)"

If Scott approves:
1. Add the check entry to the relevant technology's check file in `checks/`
2. Annotate the original lesson in `tasks/lessons.md`: `[promoted to check: <check-id>]`

**Section 3: Check Health Report**

Rank all checks by value score. Present as a table:

| Check ID | Runs | Pass | Fail | FP | Fixes | Value | Last Caught |
|----------|------|------|------|----|-------|-------|-------------|

Group by value score:
- **High value** (keep, possibly tighten)
- **Proven** (working as intended)
- **Untested** (never caught anything, removal candidate if old)
- **Noisy** (high false-positive rate, needs pattern refinement)
- **Harmful** (fix caused problems, needs immediate attention)

For untested checks: flag if older than the pruning threshold:
- Live checks (agent-based): flag after 60 days of zero catches
- Static checks (CLI grep): flag after 90 days of zero catches

**Section 4: Refinement Candidates**

List checks with high false-positive rates (noisy checks).
Prioritize refining these over adding new checks (boosting principle).

For each noisy check:
- Show the current pattern
- Suggest a refinement if possible
- Ask Scott: "Refine, remove, or skip?"

**Section 5: Overlap Detection**

List all checks grouped by technology. At Scott's scale (10-20 checks total),
overlap is visible at a glance. No automated overlap algorithm needed.

Ask: "Do any of these look redundant?"

### Phase 3: Apply Changes [AUTO]

If Scott approved any changes (new checks, removals, refinements):
1. Apply all changes to check files
2. Run `stack-metrics.sh` again to update metrics
3. Summarize what changed

## Completion Checklist
- [ ] Metrics aggregated
- [ ] Dashboard presented (all 5 sections)
- [ ] Scott reviewed recommendations
- [ ] Approved changes applied to check files
- [ ] Metrics refreshed after changes
