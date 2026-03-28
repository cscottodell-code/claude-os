# Autonomous Toolkit Research

**Date:** 2026-03-27
**Status:** Research complete with verified findings. Multiple assumptions invalidated. Ready for revised design.
**Purpose:** Comprehensive research into making the scott-toolkit support autonomous, unattended project execution with notifications.
**Research scope:** 21 subagent research runs, 7 verification runs, 3 local tests. ~28 total agents.

## Scott's Vision

1. Plan ALL phases of a project upfront (interactive, with Scott)
2. Approve the full plan
3. Autonomous execution of all phases (unattended, in background)
4. Each phase as a fresh session (prevents context degradation)
5. Notifications for progress and failures (originally iMessage, see constraints)
6. Bidirectional control from phone (reply to give instructions)
7. All toolkit features retained (TDD, code review, phase closeout, stack checks)
8. Come back later to see results with per-phase summaries

## Scott's Plan: Max ($100 or $200/month)

### Verified Available on Max
- Claude Code CLI (full access, shared usage pool with web)
- Opus 4.6 / Sonnet 4.6 / Haiku 4.5 (priority access)
- Channels (iMessage plugin, research preview)
- Permission relay via iMessage (untested on macOS 26 Tahoe)
- Agent Teams (experimental, must enable in settings)
- Scheduled Tasks (Desktop: 1-min intervals, Cloud: 1-hour intervals)
- Remote Control (research preview, manage sessions from phone)
- All hooks, skills, plugins, MCP servers

### NOT Available on Max
- Auto mode (--permission-mode auto) -- Team plan only
- Agent SDK usage -- separate API billing, not included in Max

## Verified Environment (2026-03-27)

| Component | Status | Value |
|-----------|--------|-------|
| Bun | Installed | v1.3.11 |
| Claude Code | Sufficient | v2.1.86 (exceeds v2.1.80 min for Channels) |
| macOS | **Risk** | 26.3.1 (Tahoe) -- newer than any tested version |
| chat.db | Exists | ~/Library/Messages/chat.db |
| osascript to Messages | Works | Returns contact list |
| `-p` headless mode | Works | Returns JSON with session_id |
| `--continue` chaining | Works | Same session ID carried forward |
| Auth method | claude.ai | Subscription-based, no API key set |

---

## INVALIDATED ASSUMPTIONS (Architecture-Breaking)

### 1. osascript Cannot Send iMessages to Yourself
**Assumed:** `osascript -e 'tell application "Messages" to send "Phase done" to buddy "Scott"'` works for self-messaging.
**Reality:** Apple explicitly blocks self-messaging: "Can't send a message to yourself." Additionally, macOS 26 Tahoe introduced error -1700 due to a service type change ("any" prefix vs "iMessage" prefix).
**Impact:** The entire proactive notification layer was built on this. Need alternative.
**Alternative:** Telegram via `/scott:remind` (already working), macOS Notification Center, or iMessage to a different contact.

### 2. --channels Does NOT Work with -p Mode
**Assumed:** `claude -p "prompt" --channels plugin:imessage@...` combines headless execution with iMessage.
**Reality:** Channels require an interactive session that stays running. `-p` exits after one response. Architecturally incompatible.
**Impact:** Cannot have both headless execution AND bidirectional iMessage in one process.
**Alternative:** Split into two processes (execution wrapper + interactive control session), or use single interactive session with nonstop/Stop hook pattern.

### 3. Context Fills at ~197K Tokens, NOT 1M
**Assumed:** Opus 4.6 with 1M context gives plenty of room for long sessions.
**Reality:** Known bug (GitHub #34158) -- practical enforcement is ~197K tokens regardless of model. Session deadlocks when full: can't continue, can't even compact.
**Impact:** Cannot chain many `-p --continue` calls. Must design for fresh sessions per phase.
**Alternative:** Don't use `--continue`. Start fresh each phase with progress.txt as cross-session context (Anthropic's Initializer Pattern).

### 4. --allowedTools Does NOT Persist Across --continue Calls
**Assumed:** Set tool permissions once, carry forward.
**Reality:** CLI flags reset on each invocation. Must re-specify every time.
**Impact:** Wrapper script must pass `--allowedTools` on every call, OR save to settings.json.
**Alternative:** Save tool permissions to `.claude/settings.json` or `.claude/settings.local.json` instead of CLI flags.

### 5. No Auto-Compact-and-Continue
**Assumed:** Context management handles itself.
**Reality:** When context fills, session deadlocks. No built-in auto-compact for `-p` mode. GitHub issue #23966 requests this feature.
**Impact:** Must proactively manage context. Can't let sessions run indefinitely.
**Alternative:** Fresh sessions per phase (no accumulated context). Use progress.txt for continuity.

### 6. GSD execute-phase Uses AskUserQuestion
**Assumed:** GSD phases can run fully headless.
**Reality:** execute-phase lists `AskUserQuestion` in allowed-tools. If Claude calls it in `-p` mode, session may stall.
**Impact:** Must ensure phase plans are complete enough that Claude never needs to ask, OR strip AskUserQuestion from allowed tools.
**Alternative:** Thorough upfront planning. Remove AskUserQuestion from the headless invocation's allowed tools.

---

## VERIFIED FINDINGS (Architecture-Supporting)

### Toolkit Hooks: All Safe in -p Mode
All 9 toolkit hooks verified headless-compatible:
- guard-destructive.sh -- blocks via exit 2, no interactive dependency
- guard-git-push.sh -- blocks via exit 2, deterministic
- guard-phase-completion.sh -- checks .post-execution-complete marker file
- guard-npm-install.sh -- checks stack-lock.json, deterministic
- auto-format.sh -- runs prettier, non-interactive
- context-reminders.sh -- file-based state tracking
- session-start.sh -- informational only
- pre-compact.sh -- writes .context-snapshot.md
- offload-large-output.sh -- writes to overflow directory

### GSD Hooks: Advisory Only
- gsd-workflow-guard.js -- soft guard, always exit 0
- gsd-prompt-guard.js -- advisory warning, always exit 0

### Stop Hook Pattern (Nonstop): Well-Documented
- `stop_hook_active` field prevents infinite loops
- Exit 2 blocks stopping; stderr feeds reason to Claude
- `decision: "block"` with `reason` field directs Claude's next action
- Default 5 nudge limit (NONSTOP_MAX env var, 0 = unlimited)
- Can call osascript for macOS Notification Center (not iMessage to self)
- Can read files (progress.txt) to decide whether to continue

### --allowedTools Syntax: Verified
- Format: `"Read,Write,Edit,Bash(git *)"` -- comma or space separated
- Bash wildcards: `Bash(npm run *)`, `Bash(git *)` work correctly
- MCP wildcards: BROKEN (`mcp__surrealdb__*` fails silently). Must list full tool names.
- `--disallowedTools` always takes precedence over --allowedTools
- Save to settings.json for persistence across sessions

### GSD Autonomous: Already Has Key Features
- `workflow.skip_discuss=true` auto-generates CONTEXT.md from ROADMAP
- Smart discuss has `--auto` flag for non-interactive operation
- Verification routing: passed/human_needed/gaps_found with 1-retry limit
- Dynamic phase discovery re-reads ROADMAP.md after each phase

### Cost Model (Max Plan)
- Your auth is claude.ai (subscription-based), ANTHROPIC_API_KEY is NOT set
- `-p` calls with claude.ai auth appear to use subscription quota (not separate billing)
- WARNING: If ANTHROPIC_API_KEY is ever set in shell, `-p` switches to API billing
- The $1,800 incident (GitHub #37686): Max subscriber charged API rates from `-p` cron jobs because shell inherited API key
- Estimated 8-phase execution: $5-8 in API tokens if billed separately; included if on subscription
- 5-hour rolling window: Max 5x ~225 messages, Max 20x ~900 messages

### Anthropic's Recommended Patterns
1. **Initializer Pattern:** progress.txt + git commits as cross-session breadcrumbs
2. **Plan mode then execute:** Anthropic engineers plan first, then auto-accept edits
3. **Session resume by ID:** `--resume $session_id` for explicit session targeting
4. **Budget caps:** `--max-budget-usd` and `--max-turns` prevent runaway costs
5. **The 200/9800 principle:** Autonomous ops need ~200 lines logic, ~9,800 lines safety

---

## NOTIFICATION ALTERNATIVES

Since self-iMessage is broken, ranked by reliability:

| Method | Direction | Works on Tahoe | Already Setup | Notes |
|--------|-----------|---------------|---------------|-------|
| **Telegram `/scott:remind`** | One-way out | Yes (HTTP API) | Yes | Best option for proactive notifications |
| **macOS Notification Center** | One-way, local | Yes (built-in) | Yes | `display notification` via osascript |
| **iMessage to Brett/other** | One-way out | Risky (error -1700) | Partially | May fail on macOS 26 Tahoe |
| **Channels iMessage** | Bidirectional | Unknown | Not tested | Needs verification on Tahoe |
| **Email** | One-way out | Yes | Needs setup | Could use sendmail or API |

**Recommendation:** Use Telegram for proactive notifications (already working). Test Channels iMessage separately for bidirectional control.

---

## REVISED ARCHITECTURE (Post-Verification)

### Option A: Split Mode with Telegram Notifications

```
Process 1: EXECUTION (tmux, background)
  autonomous-build.sh
    For each phase (FRESH session, not --continue):
      claude -p "execute phase N per plan in .planning/" \
        --permission-mode acceptEdits \
        --max-turns 50 --output-format json
      Parse result JSON for session_id, status, cost
      Update progress.txt, commit
      On success: Telegram notification via /scott:remind
      On failure (3 retries): Telegram alert with details

Process 2: CONTROL (separate terminal, optional)
  claude --channels plugin:imessage@claude-plugins-official
    You text from phone: "what's the status?"
    Claude reads progress.txt, replies via iMessage
    You text: "skip phase 4"
    Claude writes skip marker
  (Only needed when you want to intervene)
```

### Option B: Single Nonstop Session with Telegram

```
Single Session (tmux, interactive)
  claude (normal interactive mode)
    Stop hook reads progress.txt, decides next phase
    Stop hook calls Telegram API for notifications
    On failure: Stop hook sends Telegram alert, allows stop
    On success: Stop hook blocks stop with "execute phase N+1"
    Nonstop pattern with NONSTOP_MAX limit
```

### Key Design Decisions Still Needed

1. **Fresh sessions vs --continue:** Research says fresh is safer (no context accumulation). But fresh means re-loading CLAUDE.md, hooks, skills each time (~56K tokens overhead per phase).
2. **Telegram vs Channels for notifications:** Telegram works now. Channels is untested on Tahoe.
3. **Permission handling without auto mode:** acceptEdits + settings.json allow rules, or Channels permission relay?
4. **GSD integration:** Invoke `/gsd:execute-phase` directly, or build a parallel execution path?
5. **Cost verification:** Does `-p` with claude.ai auth really use subscription quota? Needs explicit testing.

---

## OPEN QUESTIONS (Must Test Before Building)

1. Does the iMessage Channels plugin install and work on macOS 26 Tahoe?
2. Does `-p` with claude.ai auth (no API key) count against Max subscription or bill separately?
3. Can GSD execute-phase run without AskUserQuestion if we strip it from allowed tools?
4. What's the real token overhead of loading CLAUDE.md + hooks + skills per fresh `-p` session? (Test showed 56K cache creation tokens for a minimal prompt.)
5. Does the Telegram `/scott:remind` skill work from within a `-p` session or wrapper script?

---

## RESEARCH SOURCES

### Round 1 (Initial Research -- 4 agents)
1. Channels deep dive -- official docs, iMessage setup, session chaining
2. Headless/automation -- CLI flags, session management, exit codes
3. Hooks for automation -- lifecycle events, chaining sessions, notifications
4. GSD autonomous -- /gsd:autonomous, /gsd:manager, /gsd:thread capabilities

### Round 2 (Anthropic Deep Dive -- 5 agents)
5. Anthropic agentic patterns -- orchestrator-worker, initializer pattern, Agent SDK
6. CLI automation deep -- exact flags, output formats, permission modes
7. Scheduled tasks -- cloud vs desktop, chaining, persistence
8. Nonstop/auto patterns -- community solutions, auto mode, Stop hook tricks
9. Agent SDK -- programmatic control, session resume, subagents

### Round 3 (iMessage + Max Plan -- 5 agents)
10. iMessage deep dive -- chat.db polling, AppleScript, permission relay, proactive messaging
11. Anthropic product landscape -- every product and interconnections
12. Plugin ecosystem -- official plugins, custom API, headless compatibility
13. Max plan specifics -- features, limits, auto mode availability
14. Wrapper + iMessage patterns -- osascript, tmux, caffeinate, real-world examples

### Round 4 (Verification -- 7 agents + 3 local tests)
15. osascript iMessage on macOS 26 -- buddy syntax, self-messaging block, error -1700
16. --continue context behavior -- 197K limit bug, no auto-compact, session deadlock
17. Toolkit hooks in -p mode -- all 9 hooks verified headless-safe
18. GSD execute-phase in -p -- AskUserQuestion risk, subagent spawning
19. Cost and rate limits -- API vs subscription billing, $1,800 incident
20. Stop hook nonstop pattern -- exact implementation, nudge limits, osascript support
21. --allowedTools syntax -- wildcards, persistence, MCP bugs
22. Local test: Bun, Claude Code version, macOS version
23. Local test: osascript Messages access
24. Local test: `-p` headless + `--continue` chaining
