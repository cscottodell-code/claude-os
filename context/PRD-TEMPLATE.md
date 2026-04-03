# Product Requirements Document (PRD)

## Metadata
- Last updated: YYYY-MM-DD
- Version: 1.0
- Changelog:
  - v1.0: Initial PRD

<!--
WHAT THIS IS: This is the single most important document for any project. Fill it out
BEFORE Claude Code touches any code. It forces you to think through what you're building,
who it's for, and how it should work. Every section has guidance to help you think it through.

WHY IT MATTERS: Without a PRD, Claude Code guesses. It builds what it thinks you want,
which is often not what you actually want. The result: wasted time rebuilding. A good PRD
saves you 10x the time it takes to write.

HOW TO USE: Work through this with Claude Code using the new-project workflow skill.
Claude Code will ask you questions for each section and draft the content. You approve
each section before moving on.
-->

---

## 1. Project Overview

<!--
WHAT THIS IS: The elevator pitch. If someone asks "what are you building?", this is
your answer.

PROMPTING QUESTIONS:
- What's the name of this project?
- In one paragraph, what is it and who is it for?
- Is this for Global, Advosy, Bresco, or personal?
- Will this be a desktop app (Tauri), web app, or both?

EXAMPLE:
  - Project name: Claimsforce Tracker
  - Description: A desktop app for Select Adjusters' field adjusters to track claim
    assignments, log site visits, and submit reports. Replaces the current spreadsheet-
    based tracking system.
  - Project type: Advosy
  - Deployment target: Desktop (Tauri)

COMMON MISTAKES:
- Being too vague ("an app that helps with stuff")
- Trying to describe every feature here (save that for section 3)
- Not specifying desktop vs web (this changes the entire architecture)
-->

- **Project name:** [name]
- **Description:** [one paragraph - what is this, who is it for, why does it matter]
- **Project type:** Global / Personal / Advosy / Bresco
- **Deployment target:** Desktop (Tauri) / Web / Both

---

## 2. Problem Statement

<!--
WHAT THIS IS: Why this project needs to exist. What pain point are you solving?

WHY IT MATTERS: If you can't clearly state the problem, the solution will be unfocused.
Claude Code needs to understand the "why" to make good decisions about the "how".

PROMPTING QUESTIONS:
- What problem does this solve?
- Who has this problem? (Be specific - "field adjusters" not "people")
- How is this currently solved (or not solved)?
- What does success look like? How would you know this project worked?

EXAMPLE:
  - Problem: Field adjusters currently track their claim assignments in a shared
    Google Sheet. This leads to version conflicts, no offline access, and no way
    to attach photos or documents.
  - Who: 15 field adjusters at Select Adjusters
  - Current solution: Google Sheets + email attachments
  - Success: Adjusters can manage claims offline, sync when connected, and submit
    complete reports from one app.

COMMON MISTAKES:
- Describing a solution instead of a problem ("we need a database" is not a problem)
- Being too broad ("our processes are inefficient")
-->

- **Problem:** [what pain point does this solve]
- **Who has this problem:** [specific people/roles]
- **Current solution:** [how is it handled today, or "not solved"]
- **Success looks like:** [how you'd know this project worked]

---

## 3. Core Features (v1)

<!--
WHAT THIS IS: The numbered list of must-have features for the FIRST version.

WHY IT MATTERS: Scope creep is the #1 project killer. This list is your contract with
yourself about what v1 includes. Anything not on this list is v2 (or later).

PROMPTING QUESTIONS:
- What are the absolute must-have features? (Things it can't ship without)
- What would be nice to have but isn't critical?
- What are you explicitly NOT building in v1?

FORMAT: Each feature gets a name, one-sentence description, and priority.
- Must: Can't ship without this
- Should: Important but could ship without in a pinch
- Nice: Would be great but clearly v2 material

EXAMPLE:
  1. Claim list view (must) - See all assigned claims with status, date, and address
  2. Claim detail page (must) - View and edit all fields for a single claim
  3. Photo attachment (must) - Attach photos to a claim from camera or file picker
  4. Offline mode (should) - Full functionality without internet connection
  5. Report export (nice) - Generate a PDF report for a claim

NOT IN SCOPE FOR V1:
- Multi-user sync (adjusters work independently)
- Admin dashboard
- Automated claim assignment

COMMON MISTAKES:
- Listing 20+ must-have features (if everything is must-have, nothing is)
- Not explicitly stating what's out of scope (Claude Code will try to build everything)
- Features that are too vague ("good UI" is not a feature)
-->

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | [name] | [one sentence] | Must / Should / Nice |
| 2 | [name] | [one sentence] | Must / Should / Nice |
| 3 | [name] | [one sentence] | Must / Should / Nice |

**NOT in scope for v1:**
- [thing you're explicitly not building yet]
- [another thing]

---

## 4. User Flows

<!--
WHAT THIS IS: Step-by-step walkthroughs of how a user actually uses the app.

WHY IT MATTERS: This is where vague ideas become concrete. Walking through the app
as a user reveals gaps, contradictions, and missing features that you wouldn't catch
from a feature list alone.

PROMPTING QUESTIONS:
- Walk me through the 2-3 most important things a user does in this app
- What's the very first thing they see when they open it?
- What happens when there's no data yet? (Empty state)
- What happens when something goes wrong? (Error state)

FORMAT: Write it like you're narrating a screencast:
"I open the app. I see X. I click Y. Z happens."

EXAMPLE:
  Flow 1: Viewing my claims
  1. I open the app
  2. I see a list of my assigned claims, sorted by date (newest first)
  3. Each row shows: claim number, address, status (New/In Progress/Complete)
  4. If I have no claims, I see "No claims assigned yet" with a refresh button
  5. I can search by claim number or address using the search bar at the top

  Flow 2: Submitting a claim report
  1. I tap on a claim from the list
  2. I see the claim details: address, policyholder, damage type, notes
  3. I tap "Add Photos" and select photos from my camera roll
  4. I fill in the damage assessment fields
  5. I tap "Submit Report"
  6. If offline, I see "Report saved. Will submit when connected."
  7. If online, I see "Report submitted successfully."

COMMON MISTAKES:
- Skipping empty states (the app will look broken on first use)
- Not thinking about errors (what if the save fails?)
- Only describing the happy path
-->

### Flow 1: [Name]
1. [step]
2. [step]
3. [step]

### Flow 2: [Name]
1. [step]
2. [step]
3. [step]

### Empty State
- [what the user sees when there's no data]

### Error States
- [what happens when X fails]

---

## 5. Data Model

<!--
WHAT THIS IS: The "things" your app manages and how they relate to each other.
Think of it like designing a spreadsheet: what are the sheets (tables) and what
are the columns (fields)?

WHY IT MATTERS: The data model is the foundation. Get it wrong and everything
built on top wobbles. Claude Code needs this to write correct SurrealDB schemas
and queries.

PROMPTING QUESTIONS:
- What are the main "things" in this app? (Each becomes a SurrealDB table)
- What information does each thing have? (Each becomes a field)
- How do things relate to each other? (This becomes graph edges or record links)
- Do any things need unique IDs beyond the auto-generated ones?

FORMAT: Use SurrealDB record ID format (table:id).

EXAMPLE:
  claim:abc123
  ├── number: string (unique, e.g., "CLM-2026-001")
  ├── address: string
  ├── policyholder: string
  ├── status: "new" | "in_progress" | "complete"
  ├── damage_type: string
  ├── notes: string (optional)
  ├── created_at: datetime
  └── updated_at: datetime

  photo:def456
  ├── url: string
  ├── caption: string (optional)
  └── taken_at: datetime

  Relationships:
  claim:abc123 ->has_photo-> photo:def456

COMMON MISTAKES:
- Forgetting timestamps (created_at, updated_at)
- Not thinking about optional vs required fields
- Making IDs too complex (SurrealDB auto-generates good IDs)
- Forgetting about the relationships between tables
-->

### Tables

**[table_name]**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| [field] | [type] | Yes/No | [notes] |

### Relationships
- `[table_a] ->[edge_name]-> [table_b]` - [description]

---

## 6. Tech Stack & Constraints

<!--
WHAT THIS IS: The technologies this project uses. Pre-filled with Scott's standard
stack. Only customize if this project needs something different.

WHY IT MATTERS: Prevents Claude Code from introducing random technologies. Also
documents any project-specific additions.
-->

**Standard stack (do not change unless needed):**
- Frontend: Nuxt 4 + Nuxt UI v4 + Tailwind CSS v4
- Language: TypeScript
- State: Pinia
- Database: SurrealDB v3
- Query language: SurrealQL

**Deployment target specifics:**
- [ ] Web: SurrealDB server mode (WebSocket/HTTP connection)
- [ ] Desktop (Tauri): SurrealDB embedded mode, ssr: false
- [ ] Both: Adapter pattern (useDatabase.ts with tauri-adapter.ts / web-adapter.ts)

**Project-specific additions:**
- [any extra libraries, APIs, or tools needed]

**External integrations:**
- [n8n webhooks, third-party APIs, etc., or "none"]

---

## 7. Authentication & Permissions

<!--
WHAT THIS IS: Who can access what. Skip this section if it's a single-user app.

PROMPTING QUESTIONS:
- Does this app have user accounts?
- Are there different roles (admin, user, viewer)?
- Should SurrealDB handle auth, or is there an external auth provider?
- Does any data need to be restricted by user? (Row-level permissions)
-->

- **Auth needed:** Yes / No / Later
- **Auth method:** [SurrealDB built-in / external / none]
- **Roles:** [list roles or "single user"]
- **Row-level permissions:** [describe or "not needed"]

---

## 8. Milestones

<!--
WHAT THIS IS: Breaking the project into 3-5 buildable phases. Each milestone
is a working version of the app with increasing functionality.

WHY IT MATTERS: Big projects fail when you try to build everything at once.
Milestones let you build, test, and get feedback incrementally.

RULES:
- Milestone 1 is ALWAYS: data model + basic CRUD
- Last milestone is ALWAYS: polish + error handling + edge cases
- Each milestone should produce something you can actually use and test

EXAMPLE:
  Milestone 1: Data Foundation
  - Set up SurrealDB schema for claims and photos
  - Build claim list page and claim detail page
  - Basic CRUD operations (create, read, update, delete claims)
  - Done when: Can create a claim, view it in the list, edit it, and delete it

  Milestone 2: Photos & Reports
  - Photo upload and attachment to claims
  - Report generation with claim data + photos
  - Done when: Can attach photos to a claim and generate a report

  Milestone 3: Polish & Edge Cases
  - Empty states for all pages
  - Error handling for all operations
  - Loading states
  - Search and filter on claim list
  - Done when: App handles all edge cases gracefully
-->

### Milestone 1: [Name]
- [what's included]
- **Done when:** [definition of done]

### Milestone 2: [Name]
- [what's included]
- **Done when:** [definition of done]

### Milestone 3: [Name]
- [what's included]
- **Done when:** [definition of done]

---

## 9. Design Intent

<!--
WHAT THIS IS: A reference to the project's Design Intent document. The Design Intent
captures the visual direction: what the app should look and feel like.

HOW TO USE:
1. Create a separate Design Intent document using the DESIGN-INTENT-TEMPLATE.md
   from the toolkit (/context/DESIGN-INTENT-TEMPLATE.md)
2. Fill it out (reference examples, colors, typography, layout preferences)
3. Link it here

The Design Intent is used by Claude Code during the Design Proof phase of the
new-project workflow. It ensures the app looks intentional, not like generic AI output.
-->

- **Design Intent document:** [link to design-intent.md in project repo, or "pending"]

---

## 10. Handoff Notes

<!--
WHAT THIS IS: Information Gary (or another production developer) needs to take
this prototype to production. Skip if this won't be handed off.

PROMPTING QUESTIONS:
- Will Gary productionize this?
- What does Gary need to know that isn't obvious from the code?
- Any hosting, scaling, or monitoring requirements?
-->

- **Handoff to Gary:** Yes / No / Maybe later
- **Key notes for Gary:**
  - [anything non-obvious about the architecture]
  - [any technical debt or shortcuts taken in the prototype]
- **Production requirements:**
  - [hosting, scaling, monitoring, etc.]

---

## 11. Open Questions

<!--
WHAT THIS IS: Things you're not sure about yet. It's better to list uncertainties
than to pretend you have all the answers.

PROMPTING QUESTIONS:
- What decisions need input from Brett, Gary, or others?
- What technical unknowns might you hit during the build?
- What are you least sure about in this PRD?
-->

- [ ] [question or uncertainty]
- [ ] [another one]
