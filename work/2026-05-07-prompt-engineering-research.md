# Prompt Engineering Best Practices Synthesis (Working Doc)

**Status:** SHIPPED 2026-05-08 (3 sessions). See Part 8 for closeout.
**Date:** 2026-05-07 to 2026-05-08
**Owner:** Scott + Claude (Opus 4.7, 1M context)
**Goal:** Update Scott's persistent Claude instructions with best 2025-26 prompt engineering practices, plus a subagent template that all future agents inherit.

---

## Executive Summary

Web research (~3000 words) and local audit (~2500 words) returned high-quality, source-cited briefs. Key findings:

1. **Scott's existing rules are already aligned with most current best practices.** The `[VERIFIED]/[INFERRED]/[ASSUMED]` provenance system is validated by KDD 2025 calibration research as orthogonal to confidence (and thus complementary). The "treat LLM as over-eager junior intern" Karpathy posture is the right architectural framing per Karpathy's 2025-26 writing.

2. **Several gaps are worth filling:** anti-sycophancy phrase blocklist, lead-with-counterargument rule, anti-anchoring rule, calibrated probability bands per provenance label, subagent prompt template, anti-padding rule, anti-hype vocabulary block, when-to-ask-clarification threshold, disagreement protocol, length budget for skill outputs.

3. **Several discredited patterns appear in instructions Scott has been considering:**
   - "World-class expert" persona prompts measurably HURT factual accuracy on knowledge tasks (Search Engine Journal citing peer-reviewed work).
   - "Never hallucinate" is wishful and unenforceable; replace with "before claiming X, do Y."
   - Length maximization correlates with hallucination.
   - ALL-CAPS / CRITICAL / MUST stacking now causes overtriggering on Claude 4.5+; Anthropic explicitly recommends dialing back.
   - Negative-only framing without positive alternatives is weak.

4. **Critical structural issues found in the audit:**
   - Identity.md is NOT directly injected into sessions; only paraphrased.
   - 31 `gsd-*` agent files in `~/.claude/agents/` are legacy (GSD demolished 2026-04-28).
   - 6+ skill files still reference GSD orchestration.
   - About-Scott block duplicated in 3 places with drift (Bresco vs Savvynth, ~/Sites still referenced).
   - Tech stack restated 3 times.
   - Em dash rule violated in MEMORY.md, scott-resume, scott-new-project, cowork-global-instructions.
   - cowork-global-instructions.md still says "Bresco" and uses ~/Sites paths (pre-2026-05-02 restructure).
   - scott-research has excellent subagent rules locked inside one skill that should be hoisted.

---

## Part 1: Research Findings (web research subagent)

### Anti-sycophancy

**Anthropic's own constitution** (verbatim, [VERIFIED]):
- "Diplomatically honest rather than dishonestly diplomatic"
- "Epistemic cowardice, giving deliberately vague or noncommittal answers to avoid controversy or to placate people, violates honesty norms"
- Claude should "share genuine assessments of hard moral dilemmas, disagree with experts when it has good reason to, point out things people might not want to hear"

**Opus 4.7 reduces sycophancy ~50% vs 4.6** on relationship-guidance evals; remaining bias is in weights, not removable by prompting alone. [VERIFIED]

**Prompt-level techniques that work:**
- Ask Claude for assessment BEFORE revealing your view. Order matters more than wording. [VERIFIED]
- Frame opposition concretely: "What are the strongest arguments against this?" beats generic "be critical." [INFERRED]
- Set explicit no-capitulation rule: "Only change your position if I have given you a new argument or new evidence. Otherwise, restate and defend." [VERIFIED]
- Start fresh sessions for high-stakes second opinions. Long context accumulates capitulation pressure. [VERIFIED]

**What backfires:**
- Generic "do not be sycophantic" produces tone shift without changing capitulation. [INFERRED, low confidence]
- Aggressive ALL-CAPS demands. Anthropic explicitly says 4.5/4.6/4.7 are overresponsive; recommends dialing back. [VERIFIED]
- Long phrase blocklists tend to be ignored (bloated CLAUDE.md causes Claude to ignore actual instructions). [VERIFIED]

### Confidence calibration

**Anthropic's own pattern** (Opus 4.7 prompting guide, [VERIFIED]):
- "Report every issue you find, including ones you are uncertain about. For each finding, include your confidence level and an estimated severity so a downstream filter can rank them."
- For research: "develop several competing hypotheses. Track your confidence levels in your progress notes to improve calibration. Regularly self-critique your approach."

**Source vs confidence labels are orthogonal.** Provenance labels (Scott's `[VERIFIED]/[INFERRED]/[ASSUMED]`) capture "did I check a source?" Confidence labels (high/medium/low) capture residual uncertainty. KDD 2025 survey (Wang et al.) confirms these are complementary, not substitutes. [INFERRED]

**Late-2025 finding:** Across five frontier models, all show systematic overconfidence; Claude Opus 4.5 is best-calibrated but still has substantial calibration error. Treat verbalized "high confidence" as upper bounds. [VERIFIED, low confidence on absolute numbers]

**Validated pattern (matches Scott's existing approach):** Provenance label first, confidence modifier only when divergent.

### Anti-hallucination

**"Never hallucinate" is wishful and ignored.** No primary source endorses this framing. The model has no internal "hallucination" classifier at generation time. [INFERRED, very high confidence]

**What Anthropic explicitly recommends** (Opus 4.7 guide for coding, [VERIFIED]):
- "Never speculate about code you have not opened. If the user references a specific file, you MUST read the file before answering."
- Pattern: replace "do not hallucinate" with "before claiming X, do Y." Action-grounded, verifiable.

**What the literature says works:**
- **Chain-of-Verification (Dhuliawala et al. 2023, [VERIFIED]):** Draft, generate verification questions, answer them independently, revise.
- **Self-consistency:** Multiple reasoning paths, majority vote.
- **Quote first, answer from quotes:** Anthropic's long-context guidance, "ask Claude to quote relevant parts of the documents first before carrying out its task."
- **Structured outputs / tool-call enums** when accuracy matters.

**Length controls.** Forcing long answers correlates with hallucination because the model fills space. Anthropic explicitly recommends reducing length directives on 4.6/4.7 because the model already calibrates length. [VERIFIED]

**"If you don't know, say so" framing** works better paired with a positive alternative: "If you do not know, say so AND propose what you would need to find out (a file to read, a query to run, a question to ask the user)." [INFERRED]

### Agentic patterns

**Karpathy's mid-2025 shift:** "+1 for 'context engineering' over 'prompt engineering'." LLM as CPU, context window as RAM, developer as OS managing what gets loaded when. Stop optimizing prompt strings, start optimizing context configuration. [VERIFIED]

**Karpathy's December 2025 inflection:** End-to-end application generation is real. Right unit of design is system configuration around the model (where it runs, what it sees, what it can do), not prompt phrasing. The "autonomy slider" is a key product primitive. [VERIFIED]

**Anthropic's official subagent rules** (Claude Code subagents docs + Opus 4.7 guide, [VERIFIED]):
- One clear goal per subagent. Action-oriented description.
- Scope tools per agent. Read-heavy roles get search tools only; executors get edit/write/bash. Omitting `tools` grants all tools by default; be intentional.
- Subagents return only "a condensed, distilled summary of its work (often 1,000-2,000 tokens)" to avoid polluting lead agent's context.
- Do not spawn for work doable in a single response. Spawn multiple in same turn when fanning out.
- Opus 4.7 spawns fewer subagents by default than 4.6; steerable with explicit guidance.
- Positive framing outperforms negative for subagent prompts.

**Long-horizon state.** External state files (tests.json, progress.txt), git as state log, "starting fresh" over compaction when context lost.

### System prompt hygiene

**Length** (Anthropic Claude Code best practices, [VERIFIED]):
- "CLAUDE.md is loaded every session, so only include things that apply broadly. Keep it concise. For each line, ask: 'Would removing this cause Claude to make mistakes?' If not, cut it. Bloated CLAUDE.md files cause Claude to ignore your actual instructions."
- HumanLayer recommends < 300 lines, ideally < 60. Frontier models reliably handle 150-200 instructions.

**Anthropic's include/exclude table:**
- INCLUDE: bash commands Claude cannot guess, code style differing from defaults, test instructions, repo etiquette, project-specific architecture, env quirks, non-obvious gotchas.
- EXCLUDE: anything Claude can read from code, standard conventions, detailed API docs (link instead), frequently-changing info, file-by-file descriptions, "self-evident practices like 'write clean code.'"

**"Right altitude" principle** (Anthropic): "specific enough to guide behavior effectively, yet flexible enough to provide the model with strong heuristics." Avoid hardcoded brittle logic; avoid vague platitudes. [VERIFIED]

**Tone-up phrases** ("IMPORTANT", "YOU MUST") still work but use sparingly. Reserve for 2-3 truly critical rules. [VERIFIED]

**Imports.** Use `@path/to/file` to pull in supplementary docs only when relevant, instead of inlining. [VERIFIED]

### Discredited patterns to avoid

1. **"You are a world-class expert"** without specificity. Helps tone, HURTS factual accuracy. Persona prompts are "neither broadly beneficial nor harmful" and depend on task type; instruction-tuned models gain tone steerability but suffer factual drops. [VERIFIED]
2. **"Never hallucinate."** Wishful, unenforceable. Replace with "before claiming X, do Y." [VERIFIED by absence of any primary source endorsing this]
3. **Length maximization** ("be thorough, comprehensive, exhaustive"). Correlates with hallucination. Opus 4.7 already auto-calibrates. [VERIFIED]
4. **Contradictory tone instructions** ("warm but ruthless", "concise but exhaustive"). Modern Claude follows literal instructions. Pick one. [INFERRED, very high confidence]
5. **ALL-CAPS COMMAND STACKING.** Anthropic explicitly recommends dialing back on 4.5/4.6/4.7. [VERIFIED]
6. **Negative-only framing** without positive alternatives. Anthropic: "Tell Claude what to do instead of what not to do." [VERIFIED]
7. **Prefilling assistant turns to force formats.** Deprecated starting Claude 4.6. [VERIFIED]

### Source list

**Anti-sycophancy:** anthropic.com/constitution; anthropic.com/news/protecting-well-being-of-users
**Calibration:** platform.claude.com prompting guide; arxiv.org/abs/2503.15850 (KDD 2025 UQ survey)
**Anti-hallucination:** arxiv.org/abs/2309.11495 (CoVe); arxiv.org/abs/2505.09031 (CoT+RAG+SC)
**Agentic / Karpathy:** x.com/karpathy/status/1937902205765607626; karpathy.bearblog.dev/year-in-review-2025; anthropic.com/engineering/effective-context-engineering-for-ai-agents; anthropic.com/engineering/building-agents-with-the-claude-agent-sdk; code.claude.com/docs/en/sub-agents
**Hygiene:** code.claude.com/docs/en/best-practices; humanlayer.dev/blog/writing-a-good-claude-md
**Discredited:** searchenginejournal.com (persona prompts hurt accuracy)

### Open questions / gaps from research

1. No primary Anthropic source addresses sycophancy at the prompt layer. All anti-sycophancy prompt patterns are practitioner-derived.
2. Karpathy's recent writing is sparse on prompt specifics; he has moved away from prompt phrasing toward system architecture.
3. No consensus on confidence-label vocabulary. Scott's provenance-first system is defensible but idiosyncratic.
4. Section ordering inside CLAUDE.md is unstudied.
5. "Lead with strongest counterargument" is consistent with Anthropic constitution spirit but not Anthropic-recommended phrasing per se.

---

## Part 2: Audit Findings (local audit subagent)

### File inventory (load behavior is critical)

| Path | Lines | Loaded? |
|---|---|---|
| `~/.claude/CLAUDE.md` | 73 | YES, every session |
| `~/.claude/rules/claude-behavior.md` | 69 | YES, auto-loaded by rules system |
| `~/.claude/rules/code-style.md` | 46 | conditional (path-glob) |
| `~/Scott/claude-os/rules/claude-behavior.md` | 69 | byte-identical source for ~/.claude copy |
| `~/Scott/growth-os/wiki/identity.md` | 109 | NO direct injection; only paraphrased into CLAUDE.md and MEMORY.md |
| `~/Scott/growth-os/CLAUDE.md` | ~150 | YES when cwd is growth-os |
| `MEMORY.md` (auto-memory index) | 140 | YES every session |
| `~/.claude/cowork-global-instructions.md` | 85 | YES on Cowork sessions only |
| `~/.claude/agents/gsd-*` | 31 files | conditional (legacy) |
| `~/.claude/skills/scott-* + advosy-*` | 22 SKILL.md, 3,363 lines | on trigger |

**The identity.md non-injection finding is the most important structural discovery.** Scott has been treating identity.md as the source of truth, but Claude only sees its paraphrased copies in CLAUDE.md and MEMORY.md. Drift between them is invisible until something breaks.

### Existing best practices already in place (samples)

**Source labels and verification:**
- identity.md:44 "Label every claim in research/analysis as [VERIFIED], [INFERRED], or [ASSUMED]. List assumptions in a dedicated section. Include 'What's missing' for gaps a domain expert would challenge."
- identity.md:45 "Never write SurrealQL from general SQL knowledge. Verify against Context7."
- identity.md:49 "Verify primary sources during synthesis, not as a separate post-compact turn."

**Anti-patterns block (identity.md:79-91, Karpathy-grounded):**
- Silent wrong assumptions, no clarifications sought, inconsistencies not surfaced, tradeoffs not presented, no pushback when warranted, code/comments changed without understanding.

**Tone, format, length:**
- CLAUDE.md:24-28 Direct and concise. Tables and bullets over prose. Beginner framing.
- identity.md:46 No em dashes, ever. Enforced at edit time by `hooks/guards/em-dash.ts`.

**Posture:**
- identity.md:20 "Treat the LLM as an over-eager junior intern savant who bullshits you all the time. Tight leash. Watch the work like a hawk."
- identity.md:23-25 Small incremental chunks with verification between each.

**Process guardrails:**
- identity.md:41 Never commit or push autonomously.
- identity.md:42 Never edit `~/.claude/settings.json` mid-session.
- identity.md:47 Use neutral framing for bug investigation.
- identity.md:48 Doom-loop detection.

**Subagent rules (claude-behavior.md:53-61):**
- One objective per subagent. Tool sets per role. Brief with objective/files/constraints/output format/prior knowledge. Verify findings against primary sources.

### Gaps identified

| Gap | Status |
|---|---|
| Anti-sycophancy phrase blocklist | NOT covered |
| Lead-with-counterargument rule | NOT covered |
| Anti-anchoring on first plausible cause | NOT covered (debug skill walks through hypotheses but no rule) |
| Calibrated probability bands per provenance label | NOT covered |
| Subagent prompt template (boilerplate brief) | PARTIAL (claude-behavior.md lists what to include, no template) |
| Anti-length-padding rule (global) | PARTIAL (in scott-research only) |
| Anti-hype vocabulary block | NOT covered |
| Tool-use guidance (when to read vs Grep vs use a skill) | PARTIAL (Obsidian routing only) |
| When-to-ask-clarification threshold | PARTIAL (scattered across skills) |
| Disagreement protocol (how to push back) | NOT covered |
| Self-checking before claiming completion | NOT covered as rule (skill exists if invoked) |
| Brevity contract for skill outputs | NOT covered (skills sprawl 200-380 lines) |

### Critical contradictions / duplications

1. **About-Scott duplicated in 3 places, all slightly different.** CLAUDE.md and cowork-global-instructions.md still reference Bresco; growth-os says "Savvynth (formerly Bresco)." Cowork uses ~/Sites paths (demolished 2026-05-02).
2. **Tech stack restated 3 times.** identity.md still references ~/Sites for project location.
3. **Em dash rule violated in:** MEMORY.md (many places), scott-resume:95, scott-new-project:26, scott-new-project:69-70, cowork-global-instructions.md (lines 5, 28, 30, 33, 75, 77).
4. **GSD references in supposedly-current files:** scott-new-project (lines 25, 21, 17), scott-pause, scott-new-feature, scott-resume, scott-research, plus 31 gsd-* agents in `~/.claude/agents/` and `~/.claude/get-shit-done/` directory residue.
5. **identity.md:55** says project location is ~/Sites (gone 2026-05-02).
6. **identity.md:31-35** Values and Decision Rules are placeholders ("Migrate from BOPs notes"). Has been placeholder since at least May 2.
7. **MEMORY.md:68 "Eleanor PM mode"** says GSD. Stale.
8. **scott-research's excellent subagent rules** (no preamble, no closing commentary, no padding, direct quotes for top claims) are locked inside one skill. Should be hoisted to `claude-behavior.md`.

### Skill SKILL.md observations

- Almost no skill restates anti-sycophancy, em-dash, or `[VERIFIED]/[INFERRED]/[ASSUMED]` rules. They assume those come from CLAUDE.md and identity.md.
- scott-research has the most extensive behavior rules of any skill. The "no preamble / no closing commentary / no padding / no fabricated URLs / direct quotes for top claims" pattern is generalizable.
- scott-presentation:25 "Read [the wiki page] once at start of any session that invokes this skill. Do not re-derive content from training data." Generalizable: use authoritative source over training data.
- gsd-assumptions-analyzer.md:90 "Confidence levels must be honest, do not inflate Confident when evidence is thin." Worth porting before deletion.
- No skill enforces a length budget on its own output. Several generate 200+ line documents.

### Audit's recommended file layout

| Concern | Belongs in |
|---|---|
| LLM-agnostic identity, posture, hard rules, anti-patterns | `growth-os/wiki/identity.md` (already correct) |
| Claude Code-specific harness rules: subagent template, post-compact recovery, toolkit commit, agent output discipline | `claude-os/rules/claude-behavior.md` |
| Project fingerprint: about-Scott, tech stack pointers | A single source-of-truth file referenced by both `.claude/CLAUDE.md` and `cowork-global-instructions.md` |
| Battle-tested observations / feedback notes | MEMORY.md (already correct) |
| Code style rules | `claude-os/rules/code-style.md` (already correct) |

---

## Part 3: Critical Discoveries (synthesized)

1. **Identity.md is not auto-loaded.** This single fact reshapes the architecture. Either (a) the harness needs a hook to inject it, or (b) we accept it as the LLM-agnostic master and CLAUDE.md is its Claude-specific operationalized mirror, with a discipline for keeping them in sync.

2. **The "minimum harness" principle is at war with reality.** identity.md (109 lines) + CLAUDE.md (73) + claude-behavior.md (69) + MEMORY.md (140) + per-project CLAUDE.md (~150) = ~540 lines always-loaded BEFORE any skill. Anthropic recommends < 300 ideal, < 60 if possible.

3. **Scott's existing rules are very good.** Most current best practices are already encoded. The big wins are not "rewrite everything" but "fill 8-10 specific gaps + hoist scott-research's subagent rules + clean contradictions."

4. **The biggest leverage is the subagent template.** One template that all future agents (and current scott-* skills on next edit) inherit gives compounding returns.

5. **A pile of cleanup work is overdue and not strictly prompt engineering.** The 31 GSD agents, the stale cowork-global-instructions, the placeholder identity.md sections, the duplicated About-Scott blocks, the em dash violations. These muddy the picture but are not part of the prompt engineering update per se.

---

## Part 4: Three Synthesis Approaches

### Approach A: Surgical (1 session)

Add the 5 highest-leverage missing rules. Fix only contradictions that affect Claude's behavior right now. Don't touch GSD agents, don't rebuild cowork instructions, don't audit deeper.

**Scope:**
- Add to `identity.md`: anti-sycophancy phrase blocklist, lead-with-counterargument, anti-anchoring rule, disagreement protocol.
- Add to `claude-behavior.md`: the subagent prompt template (hoisted from scott-research's dispatch.md), with anti-padding and direct-quote-for-top-claims rules.
- Mirror identity.md changes to CLAUDE.md (the paraphrased copy).
- Defer everything else.

**Tradeoffs:**
- Pro: Fast. Single session. Low risk.
- Con: Leaves identity.md non-injection problem unsolved. Leaves contradictions and stale GSD content. Mostly addresses prompt patterns, not "training future agents."

### Approach B: Full synthesis (2-3 sessions, RECOMMENDED)

Add all the missing rules in a clean structure. Fix all the contradictions. Hoist scott-research's subagent rules. Build the subagent prompt template. Bulk-archive gsd-* agents. Update existing scott-* skills that have GSD residue. Rebuild cowork-global-instructions.

**Phases:**

*Session 1 (today, after approach selection):*
- Verify exactly which files the harness loads (read settings.json, hooks, rules system).
- Decide: hook to inject identity.md, OR accept CLAUDE.md as Claude-specific mirror with sync discipline.
- Draft the new rules text. Get Scott's approval before writing to permanent files.

*Session 2:*
- Write rules to identity.md, claude-behavior.md, MEMORY.md per agreed structure.
- Build the subagent prompt template at `claude-os/rules/subagent-template.md` (or as a section in claude-behavior.md).
- Fix em dash violations in the rule-defining files (MEMORY.md, scott-resume, scott-new-project, cowork-global-instructions).
- Canonicalize About-Scott to one source.
- Update scott-* skills with GSD residue (remove stale references; the skills themselves stay).

*Session 3:*
- Bulk-archive gsd-* agent files to `~/.claude/agents/.archive-2026-04-28-gsd-demolition/`.
- Rebuild or merge cowork-global-instructions.md.
- Replace identity.md placeholder sections (or remove until populated).
- Final pass: verify changes don't violate any of the new rules. Commit toolkit.

**Tradeoffs:**
- Pro: Comprehensive. Solves the structural issues, not just prompt patterns. Builds inheritance for future agents.
- Con: 2-3 sessions. Risk of scope creep. Some changes (cowork rebuild) are infrastructure, not prompt engineering.

### Approach C: Verify-first (3 sessions)

Before designing anything, run a verification phase to confirm what the harness actually loads. Then synthesize. Then apply.

**Phases:**

*Session 1 (today):*
- Read settings.json, all hooks, the rules system implementation.
- Confirm: which files are injected, when, in what order, by what mechanism.
- Test: edit identity.md with a marker, start a fresh test session, verify whether marker appears.
- Document the actual loading model in the working doc.

*Session 2:*
- Synthesize the new rules + structure based on verified loading model.
- Get Scott's approval.

*Session 3:*
- Apply changes.
- Cleanup.

**Tradeoffs:**
- Pro: Highest confidence we're solving the right problem. Catches surprises.
- Con: Slowest. May discover the loading model is exactly what we already think, in which case the verification was overhead.

---

## Recommended Path

**Approach B**, modified to fold in the lightweight verification of Approach C as the FIRST step of Session 1. Specifically, before drafting any rules, spend 15-20 minutes reading settings.json and the rules system to confirm the loading model. If it matches expectations, proceed with B. If it surprises us, adjust the design.

**Reasoning:**
- A leaves real value on the table (no template inheritance, no cleanup of contradictions actively misleading Claude).
- C's full verification phase is overhead given how much we already know from the audit.
- B-with-verification-first gets the right design without burning a full session on verification alone.

**Estimated effort:** 2-3 sessions. Today is session 1 (interview + research + audit done; verification + draft rules + Scott approval next).

---

## Open Decisions for Scott

1. **Approve approach B-with-verification-first?** Or A or C?
2. **Identity.md auto-load mechanism:** add a hook to inject it, OR accept CLAUDE.md as the operationalized Claude-specific mirror with sync discipline?
3. **Subagent template location:** dedicated file `claude-os/rules/subagent-template.md`, OR section in `claude-behavior.md`?
4. **Cleanup scope this round:** include cowork rebuild and GSD agent archival (full B), OR defer those to a separate cleanup session?

---

## Source documents

- Web research subagent output: stored above in Part 1.
- Local audit subagent output: stored above in Part 2.
- Both subagents adhered to constraints: source citations, provenance labels, no em dashes, structured briefs.

---

## Part 5: Verification Findings (2026-05-07 session 1)

### Load model (verified)

| File | Loaded? | How |
|---|---|---|
| `~/.claude/CLAUDE.md` | YES | Auto-loaded by Claude Code at session start |
| `~/.claude/rules/claude-behavior.md` (symlink to `~/Scott/claude-os/rules/`) | YES | Auto-loaded by rules system at session start |
| `~/.claude/rules/code-style.md` (symlink) | Conditional | Loaded when ts/vue/js paths in scope |
| `MEMORY.md` (auto-memory index) | YES | Always-loaded with first ~200 lines |
| `~/Scott/growth-os/wiki/identity.md` | NO | Only mentioned/referenced; must be Read manually |
| Per-project CLAUDE.md (e.g., growth-os/CLAUDE.md) | YES | When cwd matches |
| `~/.claude/cowork-global-instructions.md` | YES (Cowork only) | Cowork session init [INFERRED] |

### Symlink topology

`~/.claude/rules/claude-behavior.md` and `~/.claude/rules/code-style.md` are SYMLINKS to `~/Scott/claude-os/rules/`. So edits to `~/Scott/claude-os/rules/*` propagate immediately to `~/.claude/rules/*`. No drift between source and mirror.

### Hooks inventory (relevant ones)

- `session-start.ts` — GitHub sync + ACTIVE-PROJECTS.md rebuild + project state detection. Does NOT inject identity.md.
- `pre-compact.ts` + `extract-instincts.ts` — write `.claude-resume.md` and harvest learnings before compact.
- `guards/em-dash.ts` — blocks em dashes in shipped code; **exempts `~/.claude/`, `~/Scott/claude-os/`, `~/Scott/growth-os/`** (this is critical).
- `guards/claude-md.ts` — blocks edits to CLAUDE.md/MEMORY.md without bypass marker.
- `guards/surrealdb-inject.ts` — injects SurrealDB context on .surql edits.
- `guards/surrealdb-validate-write.ts` — validates SurrealDB writes.
- `auto-format.ts`, `version-propagate.ts`, `toolkit-coherence-check.ts`, `uiux-reminder.ts`, `check-file-test-trigger.ts` — quality gates on edits.

### Important discoveries

1. **Em dash "violations" are not violations.** The em dash guard exempts `~/.claude/`, `~/Scott/claude-os/`, `~/Scott/growth-os/`. So MEMORY.md, identity.md, skill files, and rule files can use em dashes without the guard blocking. The audit's "rule-defining files violate the rule" finding was based on the stated rule wording, not the actual enforced policy. **Fix: update the stated rule to match actual policy.**

2. **GSD agent count confirmed: 31.** Plus 5 non-GSD agents that should stay (api-connector, automation-tester, business-consultant, code-explainer, error-translator).

3. **Claude Code memory file imports.** Anthropic documents `@path/to/file` for slash commands. The research subagent claimed it works for CLAUDE.md memory files at Anthropic's primary docs. Context7 didn't surface a definitive global-CLAUDE.md @import example in 2 queries. **Decision: trust the docs, test by observation in Session 2.** Fallback: hook injection if @import doesn't work.

4. **Auto-compact set to 1M tokens.** Scott has plenty of context budget. The "minimum harness" pressure is more about cognitive overhead and instruction-following degradation, less about hitting the limit.

5. **`hooks/toolkit-coherence-check.ts` exists.** Implies there's already infrastructure for cross-file consistency checks. Could potentially extend to enforce CLAUDE.md ↔ identity.md sync if we don't go @import.

---

## Part 6: Draft Rule Changes (proposed for Scott's approval)

### 6.1 — identity.md: Hard Rules section additions

Add the following items to identity.md "Hard rules" section (after current line 49):

```markdown
- **Lead with the strongest counterargument** before agreeing with any non-trivial position Scott takes. State the case against, then your assessment. Order matters more than wording (per Anthropic Constitution's "diplomatically honest" rule).
- **Do not capitulate without new evidence or a superior argument.** If pushed back on without new information, restate your position and the reasoning. Apologizing for disagreeing is a sycophancy tell.
- **Forbidden openers (anti-sycophancy blocklist):** "great question," "you're absolutely right," "fascinating perspective," "excellent point," "what a thoughtful question," any phrase that validates before answering. Lead with the answer.
- **Confidence bands per provenance label.** [VERIFIED] = primary source checked, default high confidence (70-95%). [INFERRED] = no source but reasoning chain holds, default moderate (40-70%). [ASSUMED] = no source and no rigorous chain, default low (10-40%). Add explicit modifier when divergent: e.g., [VERIFIED, low confidence] for contested sources, [INFERRED, high confidence] for airtight chains.
- **Anti-anchoring on numbers.** When Scott provides an estimate or count, generate your own independently first, THEN compare. Do not refine his number; replace it with yours, then show both for him to reconcile.
- **Anti-hallucination is action-grounded, not aspirational.** "Never hallucinate" is wishful and unenforceable. The actionable form is: "Before claiming X, do Y." Concrete Y's: read the file, run the grep, query Context7, ask Scott. If you cannot do Y, say "I cannot verify this without [resource]" instead of asserting.
- **When-to-ask threshold.** Ask a clarifying question when (a) two reasonable interpretations exist AND the cost of choosing wrong is high, OR (b) Scott's request contains a contradiction or ambiguous noun, OR (c) you are about to take an action that is hard to reverse. Otherwise proceed and surface assumptions in the response.
- **Disagreement tone.** Direct, not aggressive. State the disagreement, the reason, the alternative. Do not soften with "but you might be right" hedges. Do not punch up with "actually" or "well actually." Frame: diplomatically honest, not dishonestly diplomatic.
- **Self-check before completion claims.** Before saying "done," "fixed," "working," "ready to ship," verify: Did I run the test? Did I read the file I claim to have read? Did I check the actual output? If no, do it now or say "claimed but not verified."
- **Length is calibrated to task complexity, not maximized.** Long answers correlate with hallucination because the model fills space. Anthropic guidance for Claude 4.5+: drop "be thorough/comprehensive" directives; the model already auto-calibrates. Default to the shortest correct answer.
```

### 6.2 — identity.md: Em dash rule rewording

Replace the current line 46 (`- **Never use em dashes** in any context. Use commas, periods, or restructure the sentence.`) with:

```markdown
- **Em dashes** are forbidden in shipped code, public docs, PRs, and READMEs. Personal/internal files (`~/.claude/`, `~/Scott/claude-os/`, `~/Scott/growth-os/`) are exempt; the em-dash guard at `hooks/guards/em-dash.ts` enforces this automatically. Bypass marker for one-off internal exceptions: `touch ~/.claude/.allow-em-dash`. Use commas, periods, or restructure when in doubt.
```

### 6.3 — identity.md: Anti-patterns additions

Add the following to identity.md "Anti-patterns" section (after current line 90):

```markdown
- **Persona prompts for accuracy.** "You are a world-class expert in X" measurably HURTS factual accuracy on knowledge tasks (peer-reviewed work cited in Search Engine Journal, May 2024). Personas help tone, not facts. Mitigation: scope persona to voice/style only; never use it to claim expertise.
- **Length maximization.** "Be thorough/comprehensive/exhaustive" instructions correlate with hallucination because they encourage padding. Mitigation: state the SHORTEST correct answer first; expand only on request.
- **Contradictory tone instructions.** "Be warm but ruthless," "concise but exhaustive." Modern Claude follows literal instructions; contradictions resolve nondeterministically. Mitigation: pick one tone, anchor with examples.
- **ALL-CAPS COMMAND STACKING.** CRITICAL/MUST/NEVER stacking that worked on Claude 3.x now causes overtriggering on 4.5+. Anthropic explicitly recommends dialing back. Mitigation: reserve "IMPORTANT" and "YOU MUST" for at most 2-3 truly critical rules per file.
- **Negative-only framing.** "Don't do X" without showing the desired alternative. Mitigation: pair every prohibition with a positive replacement.
- **"Never hallucinate" wishful directive.** Unenforceable; the model has no internal hallucination classifier at generation time. Mitigation: replace with action-grounded "before claiming X, do Y."
```

### 6.4 — identity.md: Stale path fix

Replace line 55 (`- **Project location:** ~/Sites (personal: ~/Sites/Personal). New projects go to Coolify on Hetzner. Vercel is legacy-only.`) with:

```markdown
- **Project location:** `~/Scott/claude-projects/` (apps live here flat). Knowledge and identity in `~/Scott/growth-os/`. Toolkit config in `~/Scott/claude-os/`. New deployed projects go to Coolify on Hetzner. Vercel is legacy-only.
```

### 6.5 — identity.md: Placeholder sections

Recommendation: REMOVE the Values (line 29-31) and Decision Rules (line 33-35) sections until populated. Placeholders saying "Migrate from BOPs notes" since at least May 2 are dead weight that bloats every reference to identity.md.

Alternative: leave them as TODOs but mark with `> [PLACEHOLDER]` so they self-document as not-yet-real.

**Open question for Scott:** remove or keep as TODO?

### 6.6 — claude-behavior.md: Subagent template integration

Replace the current "Subagent rules" section (lines 53-61) with:

```markdown
## Subagent and agent prompt template

When dispatching ANY subagent (Task tool, Agent tool, scheduled remote agents, custom agents in `~/.claude/agents/`, or skills that produce LLM behavior), apply the template at `@~/Scott/claude-os/rules/subagent-template.md`.

Quick rules (full template at the path above):
- One objective per subagent. Do not bundle.
- Match tool set to role. Researcher: Read/Grep/Glob/WebSearch/WebFetch. Reviewer: same plus Bash. Executor: full tools. Scope deliberately; omitting `tools` grants all by default.
- Brief format: objective, files, constraints, output format, prior knowledge, termination criterion.
- Return format: distilled summary 1-2K tokens, not raw output.
- No preamble, no closing commentary in returned output.
- Verify subagent findings against primary sources before presenting to Scott.
- Spawn in parallel when fanning out. Do not spawn for work doable in one response.

Inheritance principle: every new agent file in `~/.claude/agents/` and every new skill in `~/.claude/skills/` should reference or import this template.
```

### 6.7 — NEW FILE: ~/Scott/claude-os/rules/subagent-template.md

Create new file with the following content:

```markdown
# Subagent Prompt Template

The single source of truth for cross-agent behavior consistency. Apply when dispatching any subagent (Task tool, Agent tool, custom agents, scheduled remote agents) or when designing skill prompts that produce LLM behavior.

Patterns derived from Anthropic's official subagent docs (May 2026), Karpathy's context-engineering posture, and Scott's scott-research dispatch rules (originally locked inside that one skill, now hoisted).

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

Include these in EVERY brief, even if Scott's identity.md already covers them. Subagents do not always inherit context the way you'd expect; explicit > implicit.

- **Provenance labels.** All claims labeled [VERIFIED], [INFERRED], or [ASSUMED]. Add confidence modifier only when divergent.
- **No preamble.** Output begins with the structured response. No "I'll help with this" or "Here's what I found."
- **No closing commentary.** Output ends with the last item of the structured response. No "I hope this helps" or methodology summary.
- **Anti-padding.** Brevity > comprehensiveness. If a topic has no good source, say so. "I found very little on this angle" is honest and valuable.
- **Direct quotes for top claims.** When citing a source, include a direct quote in quotation marks. Prevents fabrication and cherry-picking.
- **No fabricated URLs.** Cite only URLs you actually retrieved. If you reasoned about a likely URL but didn't retrieve it, say "[URL not verified]."
- **Action-grounded uncertainty.** "Before claiming X, do Y." If you cannot do Y, say "I cannot verify this without [resource]" instead of asserting.
- **Em dash policy.** No em dashes in returned output (returned to orchestrator who may relay to Scott).
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
- The task pulls a lot of raw text into context that won't be needed after synthesis.
- Multiple independent investigations can run in parallel.
- The task is well-scoped and self-contained.

Do NOT spawn a subagent when:
- The work is doable in a single response.
- You need iterative back-and-forth with the user.
- The subagent would just relay information you could get directly.

## Self-check before sending the brief

- [ ] Objective is one clear sentence, not three goals stacked.
- [ ] Tool scope matches the role.
- [ ] Output format is concrete (template or example, not "be helpful").
- [ ] Termination criterion is unambiguous.
- [ ] Behavior rules block is included verbatim.
- [ ] Brief is under 1500 words.

## Self-check before processing returned output

- [ ] Did the subagent follow the format?
- [ ] Did it cite sources for load-bearing claims?
- [ ] Did it flag what it couldn't verify?
- [ ] Are any claims unsupported? If yes, treat as [ASSUMED] regardless of how the subagent labeled them.

## Inheritance for custom agents in ~/.claude/agents/

Every agent file should include a frontmatter line referencing this template, OR a header section that explicitly references it. New agents created via /scott:new-feature or any future agent-creation skill MUST follow this convention.

Example agent frontmatter:

```yaml
---
description: One-sentence description of agent purpose
tools: Read, Grep, Glob
behavior: "@~/Scott/claude-os/rules/subagent-template.md"
---
```
```

### 6.8 — ~/.claude/CLAUDE.md restructure

Replace entire CLAUDE.md content with:

```markdown
@~/Scott/growth-os/wiki/identity.md

# Claude Code-specific layer

Identity, hard rules, anti-patterns, posture, communication style, response quality, and verified preferences live in identity.md (auto-imported above). The sections below are Claude Code-specific and live only here.

## Reference Files (read on-demand)
- `~/.claude/credentials.md` — API keys, tokens, bot credentials
- `~/.claude/commands-reference.md` — Terminal commands cheat sheet
- `~/.claude/team-contacts.md` — Contact info for Scott, Brett, etc.

## Two-system model
- `~/Scott/claude-os/` Claude Code config (hooks, skills, light rules pointing at the vault)
- `~/Scott/growth-os/` Personal OS (identity, knowledge, daily notes, log, capture pipeline)

GSD: abandoned 2026-04-28 (v7 demolition). Superpowers + Impeccable: opportunistic plugins, not orchestrated.

## Context Routing (skills load on demand)
| Need | Skill | Auto? |
|---|---|---|
| SurrealDB | /scott:surrealdb | Yes (hook on .surql touch) |
| UI/UX | /scott:uiux + /impeccable:* | Yes (hook on .vue touch) |
| Debugging | /scott:debug | No |
| New project | /scott:new-project | No |
| Resume work | /scott:resume | Yes (on AUTO-RESUME) |
| Advosy context | /advosy:context | No |
| Learning | /scott:learn | No |

## Quick References
- GitHub: `cscottodell-code`
- SurrealDB start: `~/Scott/claude-projects/surrealdb-local/start.sh`
- Project catalog: `~/Scott/claude-os/references/project-catalog.md`
- Conversation history: `~/.claude/projects/`

## Context Hygiene
Keep this file lean. Only Claude Code-specific layer here. Identity, posture, hard rules, communication style, response quality all live in identity.md (auto-imported above).

## About Scott
- Head of Sales at Advosy (home services company, Arizona)
- Building tools across Advosy, Savvynth (formerly Bresco), and personal projects
- Expert with spreadsheets, learning to code; spreadsheet analogies welcome
```

**Net change:** CLAUDE.md drops from 73 lines to ~35. Duplicates removed. Bresco corrected to "Savvynth (formerly Bresco)." Identity content centralized in identity.md.

### 6.9 — Cleanup tasks for Session 3

Not draft text; execution items:

1. Bulk-archive 31 `gsd-*` agents to `~/.claude/agents/.archive-2026-04-28-gsd-demolition/`. Port any keeper rules first (e.g., gsd-assumptions-analyzer's "do not inflate Confident when evidence is thin" — already in subagent template above).
2. Rebuild or remove `~/.claude/cowork-global-instructions.md` (currently uses Bresco + ~/Sites paths).
3. Update GSD references in scott-* skills (skip scott-research per Scott's constraint). Specifically: scott-new-project lines 17, 21, 25; scott-pause; scott-new-feature; scott-resume.
4. Update MEMORY.md "Eleanor PM mode" line 68 (says "GSD" — stale).
5. Delete `~/.claude/get-shit-done/`, `~/.claude/gsd-file-manifest.json`, `~/.claude/gsd-local-patches/` directories.
6. Final pass: verify changes don't violate any of the new rules.
7. Commit toolkit (per identity.md mandate; data loss has happened before).

---

## Part 7: Open Decisions for Scott (updated)

1. **Approach approved:** B with verification-first. ✓ DONE.
2. **Identity.md auto-load:** @import in CLAUDE.md (decided). Test by observation Session 2; fallback to hook in Session 3 if it fails.
3. **Subagent template location:** dedicated file `~/Scott/claude-os/rules/subagent-template.md` with pointer in claude-behavior.md (decided).
4. **Cleanup scope:** included (decided).
5. **NEW: identity.md placeholder sections (Values, Decision Rules):** remove until populated, OR leave as `> [PLACEHOLDER]` TODOs?
6. **NEW: Review style:** holistic review of this working doc, OR batch-by-batch walkthrough with approval at each batch?
7. **NEW: Approve draft rule text in Part 6?** Once approved, Session 2 applies them.


---

## Part 8: Final Closeout (Session 3, 2026-05-08)

All planned work completed across 3 sessions.

### Open decisions resolved (Part 7)
1. **Approach B-with-verification-first** — followed; no surprises in verification.
2. **identity.md auto-load via @import** — verified working at start of Session 3 (identity.md content appears in the injected CLAUDE.md context). Hook fallback not needed.
3. **Subagent template location** — created at `~/Scott/claude-os/rules/subagent-template.md` (Session 2). `claude-behavior.md` "Subagent and agent prompt template" section points at it.
4. **Cleanup scope** — full B applied. 31 gsd-* agents archived to `~/.claude/agents/.archive-2026-04-28-gsd-demolition/`. 3 legacy directories (`get-shit-done/`, `gsd-file-manifest.json`, `gsd-local-patches/`) deleted. `cowork-global-instructions.md` removed (not rebuilt). GSD operation references stripped from 4 scott-* skills.
5. **identity.md placeholder sections** — moot. Current identity.md does not contain Values or Decision Rules placeholder sections; cleaned up before Session 3 started. Sections present: Personal foundation, Posture, Hard rules, Verified preferences, Tag taxonomy, Anti-patterns, Tool stitching, How this file is maintained.
6. **Review style** — hybrid worked: sequential edits with batched parallel reads at phase boundaries.
7. **Draft rule text approval** — applied Session 2.

### What ships
- LLM-agnostic identity rules in `growth-os/wiki/identity.md` (10 new hard rules including anti-sycophancy blocklist, anti-anchoring, when-to-ask threshold, disagreement protocol).
- Claude-specific harness rules in `claude-os/rules/claude-behavior.md` (subagent template integration).
- Subagent template at `claude-os/rules/subagent-template.md` (~6KB, hoisted from scott-research dispatch rules).
- Lean `~/.claude/CLAUDE.md` (35 lines, @imports identity.md).
- Cleaned `~/.claude/agents/` directory (5 active, 31 archived).
- Updated `MEMORY.md` (stale Eleanor PM-mode line removed; demolition record kept).

### Commits
- Session 1+2 commits (rule changes, subagent template, scott-research updates) — pushed before Session 3.
- Session 3 commit `d30238d` (skills GSD cleanup) — pushed at end of Session 3.

### Followups outside this project
- scott-research updates in progress in another session (not touched here).
- Other SYNC-DIRTY items at session start (rules, CLAUDE.md, scott-research) resolve when the other session pushes its work.
