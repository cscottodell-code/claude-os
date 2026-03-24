# Context Protection Patterns

Patterns and settings for managing Claude Code's context window effectively.

## Compaction Threshold

`CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50` is set in ~/.zshrc. This triggers compaction
at 50% context usage instead of the default (higher). Earlier compaction preserves
more useful context. Three independent sources recommend this setting.

After compaction, follow the post-compaction recovery rule in claude-behavior.md:
re-read .claude-resume.md, .context-snapshot.md, and the current task.

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
