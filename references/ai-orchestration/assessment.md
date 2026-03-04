# AI Orchestration — Self-Assessment

## Metadata
- Last updated: 2026-02-27
- Version: 1.0
- Assessment date: 2026-02-26

## Scoring Rubric

| Level | Score | What It Means | Spreadsheet Analogy |
|-------|-------|---------------|---------------------|
| **Aware** | 1 | You understand the concept and could explain it | You know VLOOKUP exists |
| **Practicing** | 2 | You've applied it in real projects at least once | You've written a few VLOOKUPs |
| **Proficient** | 3 | You do this reliably and could teach a beginner | You use VLOOKUP without thinking |
| **Leading** | 4 | You design systems using this and guide others | You teach INDEX/MATCH and know when VLOOKUP fails |

---

## Domain Assessment (February 2026)

### Domain 1: AI Foundations

| Area | Score | Evidence |
|------|-------|----------|
| How LLMs work | 3 | Built AI-powered apps, understands context windows, manages hallucination risk |
| The 4D Framework | 2 | Practices intuitively but hasn't formalized Anthropic's framework |
| Model landscape | 3 | Chose Claude for stack, understands Opus/Sonnet/Haiku tradeoffs, selected models per task in Life OS |
| Token economics | 3 | Built $5/mo AI budget into Life OS with model fallback, tracks cost-per-task |

**Domain average: 2.75** | **Current level: Practicing → Proficient**

**Next growth area:** Formalize the 4D Framework through the AI Fluency course

---

### Domain 2: Prompt Engineering

| Area | Score | Evidence |
|------|-------|----------|
| System prompts & personas | 3 | 17 custom skills with structured system prompts, CLAUDE.md, memory files |
| Structured outputs | 3 | Gets JSON, tables, and specific formats from AI consistently |
| Few-shot & chain-of-thought | 2 | Uses occasionally but hasn't formalized techniques |
| XML tag structuring | 2 | Uses in skills but hasn't studied Anthropic's recommended patterns deeply |
| Prompt evaluation | 1 | Knows the concept, hasn't built systematic A/B testing |
| Context assembly | 3 | 15 parallel context queries in Life OS, CLAUDE.md design, memory system |

**Domain average: 2.33** | **Current level: Practicing**

**Next growth area:** Prompt evaluation (systematic testing) and XML tag structuring via Building with the Claude API course

---

### Domain 3: Claude Code Mastery

| Area | Score | Evidence |
|------|-------|----------|
| Context management | 4 | CLAUDE.md, memory files, project-specific context, rules directory — teaches through example |
| Custom skills | 4 | 17 skills built, skill system designed, understands trigger matching |
| Hooks & guards | 3 | 6+ hooks built for safety, workflow enforcement |
| Planning & thinking modes | 3 | Uses plan mode and extended thinking regularly, GSD system |
| The Claude Code SDK | 1 | Knows it exists, hasn't built programmatic integrations |
| Subagent orchestration | 3 | GSD system (v1.21.x) with multi-agent teams, parallel analysis, model_overrides config |

**Domain average: 3.0** | **Current level: Proficient**

**Next growth area:** Claude Code SDK — programmatic integrations that invoke Claude as a tool

---

### Domain 4: MCP & Tool Integration

| Area | Score | Evidence |
|------|-------|----------|
| MCP architecture | 2 | Uses 12+ MCP servers, understands client-server model |
| Three primitives | 1 | Uses tools but hasn't studied resources/prompts distinction |
| Building MCP servers | 1 | Consumer only — hasn't built a custom server yet |
| Tool schema design | 2 | Writes skill descriptions for trigger matching (adjacent skill) |
| Transport & deployment | 1 | Uses stdio locally, hasn't explored remote transport |
| Auth patterns | 2 | Manages API keys, OAuth tokens via credentials file |

**Domain average: 1.5** | **Current level: Aware → Practicing**

**Next growth area:** Build first MCP server (Life OS MCP server is ideal first project) via Intro to MCP course

---

### Domain 5: Agent Architecture

| Area | Score | Evidence |
|------|-------|----------|
| Single-agent patterns | 2 | GSD agents (v1.21.x) use tool loops, planning, and human verification gates; design was inherited |
| Multi-agent coordination | 3 | GSD team creation, parallel agents, task assignment |
| State & memory | 3 | Memory system, context handoff, persistent state across sessions |
| Error recovery & escalation | 2 | Built error hooks and logging, agents have some retry logic |
| Agent evaluation | 1 | No systematic agent quality measurement |
| Chaining, routing, parallelization | 2 | Uses in GSD but hasn't studied Anthropic's formal patterns |

**Domain average: 2.17** | **Current level: Practicing**

**Next growth area:** Agent evaluation + formal chaining/routing patterns via Building with the Claude API course

---

### Domain 6: Knowledge Engineering

| Area | Score | Evidence |
|------|-------|----------|
| RAG fundamentals | 1 | Understands concept, hasn't built a RAG system |
| Document processing | 2 | PDF skill exists, handles SOPs and training materials manually |
| Embeddings & vector search | 1 | Knows concept, no implementation experience |
| Contextual retrieval | 1 | Knows Anthropic has improved RAG, hasn't studied approach |
| Knowledge system design | 2 | Structured toolkit references, skills library, memory system (adjacent) |

**Domain average: 1.4** | **Current level: Aware**

**Next growth area:** RAG fundamentals — the entire domain opens up via Building with the Claude API course

---

### Domain 7: Solution Architecture

| Area | Score | Evidence |
|------|-------|----------|
| Problem-AI fit | 3 | Made deliberate decisions about what to automate in Life OS, Advosy workflows |
| System design | 3 | Designed Life OS architecture (WASM, stateless server, adapter pattern) |
| Model selection & routing | 3 | Haiku/Sonnet/Opus routing in Life OS, cost-aware selection |
| Build vs buy | 3 | Chose SurrealDB over Postgres, n8n only when needed, custom vs SaaS decisions |
| Cost-benefit analysis | 2 | Informal — tracks AI costs but hasn't formalized ROI calculations |
| Evaluation & reliability | 2 | Code review skill, verification hooks, but no systematic AI output testing |

**Domain average: 2.67** | **Current level: Practicing → Proficient**

**Next growth area:** Formalize cost-benefit analysis and evaluation practices

---

### Domain 8: AI Leadership & Adoption

| Area | Score | Evidence |
|------|-------|----------|
| Enterprise adoption strategy | 1 | Hasn't studied Anthropic's 3-phase model |
| The productivity J-curve | 2 | Experienced it personally, hasn't applied the framework to teams |
| Champions programs | 1 | Concept stage — hasn't identified champions at Advosy yet |
| Training non-technical teams | 2 | Built Brett's setup package, teaches through example |
| Change management | 2 | Personal experience adopting AI, informal approach to team adoption |
| ROI measurement | 1 | Tracks personal AI costs, no organizational ROI framework |
| AI-powered sales operations | 2 | D2D Payroll, Income Tool, ClaimsForce automations — building blocks exist |

**Domain average: 1.57** | **Current level: Aware → Practicing**

**Next growth area:** Enterprise adoption strategy via Driving Enterprise Adoption course

---

## Overall Dashboard

| Domain | Avg Score | Level | Priority Course |
|--------|-----------|-------|-----------------|
| 1. AI Foundations | 2.75 | Practicing → Proficient | AI Fluency (Tier 3) |
| 2. Prompt Engineering | 2.33 | Practicing | Building with Claude API (Tier 1) |
| 3. Claude Code Mastery | 3.00 | Proficient | Claude Code in Action (Tier 2) |
| 4. MCP & Tool Integration | 1.50 | Aware → Practicing | Intro to MCP (Tier 1) |
| 5. Agent Architecture | 2.17 | Practicing | Building with Claude API (Tier 1) |
| 6. Knowledge Engineering | 1.40 | Aware | Building with Claude API (Tier 1) |
| 7. Solution Architecture | 2.67 | Practicing → Proficient | Practice-based (no dedicated course) |
| 8. AI Leadership & Adoption | 1.57 | Aware → Practicing | Enterprise Adoption (Tier 1) |

**Overall average: 2.17 — Practicing**

```
Strongest:  Domain 3 (Claude Code Mastery) — 3.00
Weakest:    Domain 6 (Knowledge Engineering) — 1.40
Biggest gap to close: Domain 4 (MCP) — high impact, low current score
```

---

## Reassessment Schedule

Reassess every 3 months or after completing a Tier 1 course:
- Next assessment: May 2026 (or after completing Building with the Claude API)
- Update scores with new evidence
- Adjust "Next growth area" for each domain

## Related Files

| File | Purpose |
|------|---------|
| `ai-orchestration-framework.md` | The 8 domains in detail |
| `ai-orchestration-courses.md` | Course tracker with completion status |
