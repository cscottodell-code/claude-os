# AI Orchestration Mastery Framework

## Metadata
- Last updated: 2026-02-26
- Version: 1.0
- Author: Scott O'Dell
- Purpose: Define the 8 domains of AI Orchestration mastery, grounded in Scott's tech stack

## What Is AI Orchestration?

AI Orchestration is the discipline of designing, building, and managing systems where
AI works alongside humans and other tools to accomplish real work. It's not about
coding — it's about directing AI the way a conductor directs an orchestra.

**Three Contexts This Framework Serves:**

| Context | Role | AI Focus |
|---------|------|----------|
| **Advosy** | Head of Sales | Design and deploy AI across sales operations for all subsidiaries |
| **Bresco** | Partner (with Brett) | Build AI orchestration products and consulting capabilities |
| **Personal** | Life OS builder | AI-powered life management — the hands-on lab for every domain |

**Tech Stack:** Claude Code + MCP | Nuxt 4 | SurrealDB (WASM) | TypeScript | Tailwind CSS v4 | Pinia | n8n (when it makes sense)

---

## The 8 Domains

### Domain 1: AI Foundations

Understanding how AI models work, what they can and can't do, and how to collaborate
with them effectively.

| Area | What It Means |
|------|--------------|
| How LLMs work | Mental model of capabilities, limitations, hallucination patterns, context windows — not the math |
| The 4D Framework | Anthropic's collaboration model: Delegation, Description, Discernment, Diligence |
| Model landscape | Claude (Opus/Sonnet/Haiku) vs GPT vs Gemini vs open-source — when each fits |
| Token economics | Pricing per model, context window sizes, cost-per-task math, budget management |

**Courses:** Claude 101, AI Fluency: Framework & Foundations

**Apply it:**
- **Advosy:** Evaluate which AI tasks justify Opus vs Haiku spend across sales workflows
- **Bresco:** Advise clients on model selection for their use cases
- **Life OS:** Already applied — Sonnet/Haiku fallback, $5 budget, model-aware routing

---

### Domain 2: Prompt Engineering

The craft of communicating with AI to get reliable, high-quality results every time.

| Area | What It Means |
|------|--------------|
| System prompts & personas | Defining AI behavior, role, tone, constraints — skills already do this |
| Structured outputs | Getting JSON, tables, or specific formats consistently |
| Few-shot & chain-of-thought | Teaching by example, making AI reason step-by-step |
| XML tag structuring | Anthropic's `<context>`, `<instructions>`, `<examples>` organization |
| Prompt evaluation | Systematic A/B testing — test datasets, automated grading, measuring consistency |
| Context assembly | Choosing what information to send AI and how to structure it |

**Course:** Building with the Claude API

**Apply it:**
- **Advosy:** Design prompt templates for sales coaching, lead qualification, deal analysis
- **Bresco:** Build reusable prompt libraries for client projects
- **Life OS:** Deepen AI coaching prompts — v2 cross-domain pattern detection and pre-meeting briefings

---

### Domain 3: Claude Code Mastery

Your primary development interface. Mastering Claude Code IS mastering your ability to build.

| Area | What It Means |
|------|--------------|
| Context management | CLAUDE.md, memory files, project-specific context — keeping Claude focused |
| Custom skills | Reusable instructions Claude applies automatically (17 built so far) |
| Hooks & guards | Automated safety and workflow enforcement (6+ hooks built) |
| Planning & thinking modes | Extended thinking for complex reasoning, plan mode for multi-step work |
| The Claude Code SDK | Scripts that invoke Claude as a tool — programmatic integrations |
| Subagent orchestration | Agent teams for parallel, specialized work — GSD system |

**Courses:** Claude Code in Action, Introduction to Agent Skills

**Apply it:**
- **Advosy:** Build skills that encode Advosy sales processes for any Claude Code user
- **Bresco:** Package skills and hooks as deliverables for clients
- **Life OS:** v2/v3 expansion means mastering context management for a growing codebase

---

### Domain 4: MCP & Tool Integration

The protocol that connects AI to the real world. Power user (12+ servers) — next step is builder.

| Area | What It Means |
|------|--------------|
| MCP architecture | How clients, servers, and transports work together |
| Three primitives | Tools (model-controlled), Resources (app-controlled), Prompts (user-controlled) |
| Building MCP servers | Creating custom servers in TypeScript or Python |
| Tool schema design | Names and descriptions that make AI use tools correctly |
| Transport & deployment | Stdio vs StreamableHTTP, production hosting, scaling |
| Auth patterns | OAuth flows, API key management, token refresh, least-privilege access |

**Courses:** Introduction to MCP, MCP: Advanced Topics

**Apply it:**
- **Advosy:** Build MCP servers for ClaimsForce CRM and Spotio — Claude queries sales data directly
- **Bresco:** MCP server development as a core service offering
- **Life OS:** Build a Life OS MCP server — habits, tasks, goals accessible to Claude during work

---

### Domain 5: Agent Architecture

Designing AI systems that plan, act, observe, and adjust — not just respond to one prompt.

| Area | What It Means |
|------|--------------|
| Single-agent patterns | ReAct (Reason + Act), tool-use loops, planning agents |
| Multi-agent coordination | When to parallelize vs serialize, hand-off patterns, shared vs isolated state |
| State & memory | How agents remember across turns and sessions — context handoff, persistent memory |
| Error recovery & escalation | Agents that retry intelligently, self-diagnose, know when to ask a human |
| Agent evaluation | Measuring if agents do a good job — success criteria, quality rubrics, cost tracking |
| Chaining, routing, parallelization | Anthropic's patterns — chain sequentially vs route to specialists vs run in parallel |

**Course:** Building with the Claude API

**Apply it:**
- **Advosy:** Agent workflows for lead qualification → assignment → follow-up → coaching
- **Bresco:** Build multi-agent systems as products for clients
- **Life OS:** v3 multi-domain AI mentoring — separate AI mentors for health, spiritual, financial, career, relationships sharing context

---

### Domain 6: Knowledge Engineering

How to give AI access to knowledge at scale — beyond a single file or prompt.

| Area | What It Means |
|------|--------------|
| RAG fundamentals | Retrieval Augmented Generation — finding and feeding AI the right context |
| Document processing | Chunking strategies, text extraction from PDFs, handling SOPs |
| Embeddings & vector search | Semantic search — finding information by meaning, not keywords |
| Contextual retrieval | Anthropic's improved RAG — adding context to chunks before embedding |
| Knowledge system design | Structuring company knowledge for AI agents to navigate programmatically |

**Course:** Building with the Claude API

**Apply it:**
- **Advosy:** RAG over sales playbooks, training materials, SOPs for AI-answered questions
- **Bresco:** Knowledge engineering as a service — making client documents AI-accessible
- **Life OS:** RAG over personal knowledge — Background Ops, 48 Laws, years of review data

---

### Domain 7: Solution Architecture

The architect's eye — turning "we have a problem" into "here's the AI solution."

| Area | What It Means |
|------|--------------|
| Problem-AI fit | Framework for where AI creates real value vs hype/overkill |
| System design | Whiteboarding architectures — data flow, API boundaries, failure modes |
| Model selection & routing | Haiku for speed/cost, Sonnet for quality, Opus for complexity |
| Build vs buy | When to build custom vs use existing tools vs buy SaaS |
| Cost-benefit analysis | Quantifying AI ROI — hours saved, revenue impact, cost reduction |
| Evaluation & reliability | Testing AI outputs systematically, monitoring quality, guardrails |

**Course:** No dedicated Anthropic course — learned through practice and Building with the Claude API

**Apply it:**
- **Advosy:** Design AI strategy for sales operations — automate, augment, or leave alone
- **Bresco:** Core consulting skill — scoping solutions, estimating ROI, designing architectures
- **Life OS:** Architecture decisions already made (WASM, stateless server, cost-controlled AI); v2/v3 expands with voice pipeline, multi-domain routing, sync

---

### Domain 8: AI Leadership & Adoption

Scaling AI from "I use it" to "the whole organization uses it."

| Area | What It Means |
|------|--------------|
| Enterprise adoption strategy | Anthropic's 3-phase: Activation → Acceleration → Expansion |
| The productivity J-curve | Teams get slower before faster — managing expectations through the dip |
| Champions programs | Identifying and empowering AI champions across subsidiaries |
| Training non-technical teams | Playbooks and templates the sales team can actually use |
| Change management | Psychological safety for experimentation, celebrating wins, handling resistance |
| ROI measurement | Proving AI value in dollars, hours saved, deals closed |
| AI-powered sales operations | Lead scoring, coaching, forecasting, pipeline management with AI |

**Course:** Driving Enterprise Adoption of Claude

**Apply it:**
- **Advosy:** Roll out AI across all sales teams — champions first, measure wins, expand
- **Bresco:** Help clients adopt AI using the same framework — adoption consulting
- **Life OS:** Personal adoption journey IS the case study for teaching others

---

## How the Domains Connect

```
Foundations (1) + Prompt Engineering (2)
        ↓
Claude Code Mastery (3)  ←→  MCP & Tools (4)
        ↓                         ↓
Agent Architecture (5)  ←→  Knowledge Engineering (6)
        ↓
Solution Architecture (7)
        ↓
AI Leadership & Adoption (8)
```

- **Domains 1-2** are the language — communicate with AI effectively
- **Domains 3-4** are the interface — interact with and extend AI capabilities
- **Domains 5-6** are the architecture — design complex AI systems
- **Domain 7** is the design skill — know what to build and why
- **Domain 8** is the multiplier — make it matter beyond yourself

---

## Life OS as the Through-Line Project

Every domain can be practiced through Life OS expansion:

| Domain | Life OS Application |
|--------|-------------------|
| 1. Foundations | Model selection implemented (Sonnet/Haiku fallback, $5 budget) |
| 2. Prompt Engineering | AI coaching with 15 parallel context queries → v2 cross-domain patterns |
| 3. Claude Code | Entire app built through Claude Code with custom skills |
| 4. MCP | Build Life OS MCP server — habits, tasks, goals accessible during work |
| 5. Agent Architecture | v3 multi-domain AI mentoring = multi-agent coaching system |
| 6. Knowledge Engineering | RAG over personal knowledge — Background Ops, 48 Laws, review data |
| 7. Solution Architecture | Every v2/v3 feature requires architecture decisions |
| 8. AI Leadership | Personal journey IS the case study for teaching others |

---

## Related Files

| File | Purpose |
|------|---------|
| `ai-orchestration-courses.md` | Trackable course checklist with completion status |
| `ai-orchestration-assessment.md` | Self-assessment across all 8 domains with scoring |
| `project-catalog.md` | All active projects this framework applies to |
| `stack-overview.md` | Technical stack details |
