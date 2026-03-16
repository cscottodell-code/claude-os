# Claimsforce Debugging Guide

Workflow debugging, formula reference issues, and BPM vs Workflows.

---

## Workflows vs BPM Flowcharts

Claimsforce has TWO automation systems:

| Feature | Workflows | BPM Flowcharts |
|---------|-----------|----------------|
| **Path** | Admin > Workflows | Admin > BPM > Flowcharts |
| **Complexity** | Simple "when X, do Y" | Multi-step with branching |
| **Timing** | Fire instantly | Support timer delays |
| **Tracking** | Log entries only | Full Process Instances |
| **Use When** | Simple automations | Need delays, tracking, complex flows |

### When to Use BPM Instead
- Need a delay (timer events)
- Need audit trail (Process Instances)
- Need visibility into which records completed
- Complex branching with multiple paths

---

## Workflow Debugging Guide

### Check if Workflow is Firing
1. Administration > Workflows > [Your Workflow]
2. Scroll to **Log** section at bottom
3. If entries appear, workflow IS triggering

### Common Issue: Fires but Actions Fail

**Symptom:** Log shows triggered, but records weren't created
**Cause:** Create Record actions fail silently when formulas return NULL

**Example (Jan 2026):**
```
Workflow Log: 21+ entries (IS firing)
Compensation records: 0 with "BE" in name (FAILING)
payoutsCreated = true (Update Target Record worked)
```

### Debugging Steps
1. Check Workflow Log - Is it firing?
2. Check Boolean flag - Did Update Target Record work?
3. Search created records by expected name pattern
4. Examine a created record - Are fields empty?
5. Compare FE vs BE - FE has direct access, BE needs traversal

---

## Formula Reference Issues

| Scenario | Formula Syntax | Status |
|----------|----------------|--------|
| Direct field on trigger entity | `amount` | Works |
| Related entity field (1 level) | `claim.name` | May not resolve |
| Related entity field (2 levels) | `claim.setter.manager` | May not resolve |

**Known Issue:** In Check-triggered workflows, `claim.xxx` returns empty:
- `claim.name` -> empty (names like "- Setter BE")
- `claim.setter` -> empty (silent failure)
- `claim.id` -> empty (Source link not set)

**Workarounds:**
1. Use BPM Flowchart triggered by Claim instead of Check
2. Calculate values in Before Save Formula on Check entity
3. Use n8n webhook to fetch related data via API
