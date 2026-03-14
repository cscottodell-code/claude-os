# Retrospective: Eleanor M1 Foundation
**Date:** 2026-03-11
**Project:** Eleanor
**Milestone:** M1 Foundation (Stories 1.1-1.6)
**Duration:** ~2 weeks (Feb 28 - Mar 7, 2026)

## 1. What Was Built
Eleanor's foundation layer across 6 stories and 35 commits:

- **1.1 Desktop App Shell:** Nuxt 4 SPA + Tauri 2 desktop shell, Nuxt UI v4 with Eleanor design tokens, 3-column layout, SurrealDB connection
- **1.2 Send/Receive Messages:** POST /api/chat endpoint, AI router with task type registry, Anthropic + Google AI SDKs, message persistence
- **1.3 Conversation History:** Past message loading, context assembly for AI calls
- **1.4 Intent Detection:** Intent classifier (Haiku + fallback), format directives per intent, override dropdown, regenerate endpoint, SDK upgrade to stable v2.0.1
- **1.5 Decision Support:** Decision intent type, decision_support task type, model downgrade (Sonnet to Haiku due to API key limitation)
- **1.6 Mobile PWA Shell:** @vite-pwa/nuxt, service worker, bottom tab bar, responsive layout, placeholder pages

## 2. What Went Well
- **All 6 stories completed and merged cleanly.** No story required major rework or architectural changes.
- **SurrealDB v3 integration worked well** once the v2/v3 syntax differences were identified and documented.
- **Tauri 2 setup was smooth.** Desktop shell worked on first try with SPA mode.
- **AI router pattern (task type registry)** proved flexible. Adding decision_support was straightforward because the registry pattern was already in place.
- **Intent classifier + format directives** created a clean separation between detection and formatting.
- **BMAD story-based workflow** kept each story scoped and manageable.
- **Code review skill** caught real issues (Story 1.5 task_type persistence bug, Story 1.6 simplification opportunities).

## 3. What Went Wrong
- **Anthropic API key lacks Sonnet access.** The architecture specifies Claude Sonnet 4.5 for high-value tasks (coaching, decisions), but the API key only works with Haiku. This forced a runtime workaround and reduced response quality for the tasks that matter most. Time was spent debugging 404 errors before realizing it was a key tier issue, not a model ID issue.
- **SurrealDB v3 breaking changes** required multiple mid-story fixes (storage path, WebSocket endpoint, ORDER BY syntax, type::thing renamed to type::record). These were caught and documented but could have been avoided with upfront research.
- **LLM JSON parsing** required a code fence stripping workaround. Models don't reliably return raw JSON even when instructed to.
- **Validation array duplication** (validIntents hardcoded in two files) caused a silent classification bug. Caught in code review.

## 4. Lessons Learned
- **Next time, verify API key model access before committing to a model in the architecture.** The Sonnet 404 issue burned time and left a workaround in production code.
- **Next time, check SurrealDB version-specific syntax (v2 vs v3) before writing queries.** Several issues came from assuming v2 patterns would work on v3.
- **Always strip code fences from LLM JSON output.** This is not optional, it's a required step in any LLM-to-JSON pipeline.
- **Never duplicate constant arrays across files.** Import from a single source of truth.
- **Use StringRecordId from the SDK instead of SurrealQL's type::record() in parameterized queries.** The SDK misinterprets the arguments.

## 5. Toolkit Updates Needed
| Update | File | Why |
|--------|------|-----|
| Add "verify API key model access" to new-project checklist | `workflows/new-project.md` | Would have caught the Sonnet issue before it became a mid-build blocker |
| Add LLM JSON fence-stripping as a standard pattern | `memory/MEMORY.md` or skill | This pattern will apply to every project with LLM integration |
| Add SurrealDB v3 breaking changes to surrealdb-patterns skill | `skills/surrealdb-patterns/SKILL.md` | Prevent repeating the v2-to-v3 migration pain |

## 6. Reusable Patterns
| Pattern | Description | Reuse potential |
|---------|-------------|-----------------|
| Task type registry | Register AI task types with model, prompt, and fallback config in one place | Any multi-model AI app |
| Intent classifier + format directives | Classify user intent, then apply per-intent formatting instructions | Any conversational AI |
| StringRecordId pattern | Use SDK's StringRecordId instead of SurrealQL's type::record() | All SurrealDB v3 projects |
| Code fence stripping | Always strip markdown fences from LLM JSON output | Any LLM integration |

## 7. Next Steps
- Resolve Sonnet API key access (upgrade key tier or confirm model availability)
- Set up test framework before M2 (no tests exist yet)
- Begin M2 Intelligence: AI router (17 task types), context engine, system prompts
