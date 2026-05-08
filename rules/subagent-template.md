# Subagent Prompt Template

The single source of truth for cross-agent behavior consistency. Apply when dispatching any subagent (Task tool, Agent tool, custom agents, scheduled remote agents) or when designing skill prompts that produce LLM behavior.

Patterns derived from Anthropic's official subagent docs (May 2026), Karpathy's context-engineering posture, and Scott's scott-research dispatch rules (originally locked inside that one skill, now hoisted).

**Inheritance is by convention, not enforcement.** Anthropic's harness does not auto-import this template into agent prompts. The orchestrator (Claude) is responsible for applying it when crafting briefs. References in agent frontmatter or skill descriptions are documentation, not automatic mechanisms.

## Brief format (the prompt you send the subagent)

Every subagent prompt MUST contain:

1. **Objective** (one sentence). What single goal is this subagent producing?
2. **Context** (2-5 sentences). Why this matters; what the orchestrator is doing.
3. **Files / inputs** (explicit paths). What the subagent should read.
4. **Constraints** (bulleted). What the subagent must NOT do.
5. **Output format** (template or example). What the orchestrator expects back.
6. **Prior knowledge** (relevant facts the subagent should not have to discover).
7. **Termination criterion** (when is the subagent done?).

## Behavior rules baked into every subagent prompt

Include these in EVERY brief, even if Scott's identity.md already covers them. Subagents do not always inherit context the way you would expect; explicit beats implicit.

- **Provenance labels.** All claims labeled [VERIFIED], [INFERRED], or [ASSUMED]. Add confidence modifier only when divergent from the label's default ([VERIFIED, low confidence], [INFERRED, high confidence]).
- **No preamble.** Output begins with the structured response. No "I'll help with this" or "Here's what I found."
- **No closing commentary.** Output ends with the last item of the structured response. No "I hope this helps" or methodology summary.
- **Anti-padding.** Brevity beats comprehensiveness. If a topic has no good source, say so. "I found very little on this angle" is honest and valuable.
- **Direct quotes for top claims.** When citing a source, include a direct quote in quotation marks. Prevents fabrication and cherry-picking.
- **No fabricated URLs.** Cite only URLs you actually retrieved. If you reasoned about a likely URL but did not retrieve it, say "[URL not verified]."
- **Action-grounded uncertainty.** "Before claiming X, do Y." If you cannot do Y, say "I cannot verify this without [resource]" instead of asserting.
- **Em dash policy.** No em dashes in returned output. Use commas, periods, or restructure. (Returned output flows back to the orchestrator and may reach Scott; preserve the no-em-dashes-in-Scott's-view invariant.)
- **Distilled return.** 1-2K tokens of structured summary, not raw tool output. The orchestrator's context budget is shared.

## Tool scoping per role

Match tools to role. Omitting `tools` grants ALL tools by default; be intentional.

| Role | Tool set |
|---|---|
| Researcher / Explorer | Read, Grep, Glob, WebSearch, WebFetch (no Bash, no Edit, no Write) |
| Reviewer / Auditor / Security Auditor | Read, Grep, Glob, Bash (no Edit, no Write) |
| Planner | Read, Grep, Glob (read-only) |
| Executor / Implementer | Full tool set |
| Doc writer | Read, Grep, Glob, Write |

## When to spawn vs do it yourself

Spawn a subagent when:

- The task pulls a lot of raw text into context that will not be needed after synthesis (file audits, web research, large file reads).
- Multiple independent investigations can run in parallel.
- The task is well-scoped and self-contained.

Do NOT spawn a subagent when:

- The work is doable in a single response.
- You need iterative back-and-forth with the user.
- The subagent would just relay information you could get directly with a single tool call.

## Self-check before sending the brief

- [ ] Objective is one clear sentence, not three goals stacked.
- [ ] Tool scope matches the role.
- [ ] Output format is concrete (template or example, not "be helpful").
- [ ] Termination criterion is unambiguous.
- [ ] Behavior rules block is included verbatim.
- [ ] Brief is under 1500 words. Briefs longer than this rarely produce better output and cost context.

## Self-check before processing returned output

- [ ] Did the subagent follow the format?
- [ ] Did it cite sources for load-bearing claims?
- [ ] Did it flag what it could not verify?
- [ ] Are any claims unsupported? If yes, treat as [ASSUMED] regardless of how the subagent labeled them.

## Convention for custom agents in ~/.claude/agents/

Every agent file should reference this template in its description or header section so reviewers know what behaviors are expected. Example:

```yaml
---
description: Research X. Behavior follows ~/Scott/claude-os/rules/subagent-template.md.
tools: Read, Grep, Glob, WebSearch, WebFetch
---
```

Or as a header section in the agent's prompt body:

```markdown
# Behavior

This agent follows the subagent template at `~/Scott/claude-os/rules/subagent-template.md`. Provenance labels, no preamble, no closing commentary, direct quotes for top claims, no fabricated URLs.
```

When the orchestrator (Claude) dispatches this agent, it uses the template to construct the actual brief sent to the subagent. The reference in the agent file is documentation for human reviewers and a reminder to the orchestrator; Anthropic's harness does not parse it as an instruction.

## Sources

- Anthropic Claude Code subagents docs: https://code.claude.com/docs/en/sub-agents
- Anthropic Effective context engineering for AI agents: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Karpathy context-engineering posture: https://x.com/karpathy/status/1937902205765607626
- scott-research dispatch rules (now hoisted): `~/.claude/skills/scott-research/references/dispatch.md`
