# Context Protection Patterns

Patterns and settings for managing Claude Code's context window effectively.

## Compaction Threshold

Two env vars in `~/.claude/settings.json` env block control when Claude Code auto-compacts. NOT `~/.zshrc`. The settings.json env block is read at process start and overrides shell env.

```json
{
  "env": {
    "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "1000000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "100"
  }
}
```

**What each one does:**

- `CLAUDE_CODE_AUTO_COMPACT_WINDOW` sets the effective context window in tokens. Required when using a model whose default window is server-pushed lower than the model's marketed size (Opus 4.7 1M is one of these).
- `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` sets the percentage of the window at which compaction fires (1 to 100). The actual trigger is `min(floor(window * pct / 100), window - 13000)`, so even at 100% it fires at window minus 13k tokens.

**Trigger formula in plain English:**

`compaction_fires_at = min(window * pct / 100, window - 13000)`

Examples on a 1,000,000 window:

| pct | Computed | Effective trigger |
|---|---|---|
| 50 | 500,000 | 500,000 |
| 80 | 800,000 | 800,000 |
| 100 | 1,000,000 | 987,000 (capped by 13k margin) |

Scott's preference is `100` to use as much of the 1M window as possible before compaction. The original doc recommended `50` for "earlier compaction preserves more useful context." That tradeoff made sense on 200k models. On 1M Opus, it wastes headroom.

## CRITICAL FOOT-GUN: the `"800k"` parse trap

The window env var uses raw `parseInt(value, 10)`. The "k" and "m" suffixes are parsed in some other code paths but NOT in this one. So:

| Value | What CC sees | Status |
|---|---|---|
| `"800k"` | `800` | Rejected (below 100,000 floor), silently falls back to server-pushed default |
| `"1m"` | `1` | Rejected, same fallback |
| `"800000"` | `800000` | Accepted |
| `"1000000"` | `1000000` | Accepted (max) |

If the window env var falls back, a server-pushed flag (`tengu_amber_redwood2` on Opus 4.7) takes over and forces a much smaller window. This was the root cause of Scott's 2026-04-29 emergency where compaction fired at 66k on a 1M model.

**Always use raw integer values for `CLAUDE_CODE_AUTO_COMPACT_WINDOW`. Never use `k` or `m` suffixes.**

## Hard kill switches

If you want auto-compaction off entirely (manual `/compact` still works):

```json
{
  "env": {
    "DISABLE_AUTO_COMPACT": "1"
  }
}
```

Or:

```json
{
  "autoCompactEnabled": false
}
```

Both are honored by CC 2.1.123. `DISABLE_COMPACT=1` also exists and is more aggressive (turns off the compact code path entirely, including manual `/compact`).

## Constants reference (CC 2.1.123)

Extracted from the binary. Useful when picking a window value.

| Constant | Value | What it does |
|---|---|---|
| Window floor | 100,000 | Minimum accepted by `CLAUDE_CODE_AUTO_COMPACT_WINDOW`. Below this, value is rejected. |
| Window ceiling | 1,000,000 | Maximum. You can't set higher. |
| Compact margin | 13,000 | Subtracted from `window * pct / 100` for the actual trigger point. |
| Blocked margin | 20,000 | When context approaches `window - 20000`, CC blocks further input until compaction. |
| Rapid-refill window | 5,400,000 ms (90 min) | If 3 compactions happen within this window, a "rapid refill" guard fires. |
| Rapid-refill cap | 3 | Number of compactions in the rapid-refill window before the guard activates. |

## Other related env vars

These exist in the binary but are not load-bearing for the standard threshold control. Listed for completeness:

- `CLAUDE_CODE_BLOCKING_LIMIT_OVERRIDE`: overrides the hard `window - 20000` blocking cap.
- `CLAUDE_CODE_DISABLE_PRECOMPACT_SKIP`: disables the optimization that skips PreCompact hooks under certain conditions.
- `CLAUDE_AFTER_LAST_COMPACT`: internal flag, not user-tunable.

## Verifying the fix is live

After editing `~/.claude/settings.json`, the env vars only take effect on the NEXT Claude Code process start. Existing sessions still have the old values.

```bash
# Inside a fresh Claude Code session
echo $CLAUDE_CODE_AUTO_COMPACT_WINDOW
# Should print exactly the integer you set, e.g. 1000000
```

If it prints empty or a different value, settings.json is malformed or the var was overwritten by a shell profile.

## Post-compaction recovery rule

After compaction fires, follow the recovery rule in `claude-behavior.md`:

1. Read `.claude-resume.md` (written by pre-compact hook + agent at compaction time).
2. Read `.context-snapshot.md` (mechanical snapshot from pre-compact hook).
3. Read the current task definition.
4. Resume work without asking the user to re-explain.

---

*Source: Claude Code 2.1.123 binary string extraction + live verification 2026-04-29.*

## Deferred Tool Loading

Claude Code already defers MCP tool loading natively. All MCP server tools appear
in the deferred tools list and are discovered via ToolSearch on demand. No additional
configuration needed. This gives the same 85% token reduction described in the
sources without any settings changes.

## Prompt Caching

Keeping CLAUDE.md and rules files stable (not changing every session) maximizes
prompt cache hits. Cached input tokens cost 10% of non-cached tokens (90% savings).
This is why CLAUDE.md should be a router (pointing to other files) rather than a
container that changes frequently.

## Tool Output Offloading

The `offload-large-output.sh` PostToolUse hook writes tool results >4KB to
`.claude/tool-output-overflow/` to prevent large results from bloating context.
The post-compaction recovery rule knows to re-read relevant offloaded files.

## Skill Input Examples

Skills should include `input_examples` in their YAML frontmatter showing 1-2
realistic invocations. This improves accuracy from 72% to 90% on complex
parameter handling (Lance Martin source).

Format:
```yaml
---
name: skill-name
description: ...
input_examples:
  - "/skill-name https://example.com -- extract a source file from this URL"
  - "/skill-name --skip -- work with existing files in raw-sources/"
---
```

Start with most-used skills and add examples as skills are updated.

## Thinking Token Budget

For API-based orchestration (not Claude Code CLI), set `MAX_THINKING_TOKENS=10000`
for routine coding sessions. Extended thinking is powerful but expensive -- capping
it for standard implementation work reduces hidden costs ~70% while preserving
quality. Reserve uncapped thinking for planning, debugging, and verification phases
where deep reasoning matters most.

## JSON State Tracking

When tracking progress or feature state across autonomous multi-session workflows,
use JSON files instead of Markdown checklists. Models optimistically edit Markdown
(checking boxes, rewriting lists) but treat JSON as structurally rigid data.
JSON state files resist accidental tampering and parse reliably.

Example: use `progress.json` with `{"phase": 2, "tasks_complete": 5, "tasks_total": 8}`
rather than a Markdown checklist that the model might optimistically check off.

## Reasoning Budget Allocation

For API-based orchestration with extended thinking, allocate reasoning budget
strategically by phase type:

| Phase Type | Reasoning Level | Why |
|------------|----------------|-----|
| Planning | High | Deep analysis of requirements and architecture |
| Verification | High | Thorough checking catches issues early |
| Implementation | Standard | Following established patterns, less exploration needed |
| Documentation | Standard | Straightforward content generation |

Strategic allocation achieved 66.5% task completion vs 53.9% for constant max
reasoning in benchmarks (Trivedy). This is relevant for API use -- Claude Code
manages its own reasoning internally.
