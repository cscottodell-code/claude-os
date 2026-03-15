# Bresco Business Context

## Metadata
- Last updated: 2026-03-14
- Version: 3.0

## About Bresco

Bresco is an automation consulting side business co-owned by Scott O'Dell and
Brett Arrington. Separate from Advosy — uses Telegram instead of Slack to keep
communications distinct.

**Focus:** n8n workflows, SurrealDB, custom automations for small businesses.
**Revenue model:** Monthly fees + setup fees.
**First client:** An event center.

## Key People

| Person | Role |
|--------|------|
| **Scott O'Dell** | Architecture, specification, quality evaluation |
| **Brett Arrington** | Vibe coder, VRZA Operations at Advosy |

## BreSco Platform (automation-business)

| Detail | Value |
|--------|-------|
| **Location** | ~/Sites/Bresco/automation-business/ |
| **GitHub** | cscottodell-code/automation-business |
| **Status** | v1.1 complete |
| **Deployed** | Vercel (migrating to Coolify) |
| **Has CLAUDE.md** | Yes |

The BreSco Platform is the client-facing automation business website/app.

## Other Bresco Projects

| Project | Location | Purpose |
|---------|----------|---------|
| Background Ops | ~/Sites/Bresco/Background Ops/ | Reference PDFs (Sebastian Marshall methodology) |
| BOPS Guides | ~/Sites/Bresco/bops-guides/ | Complete documentation for Background Ops |
| Brett Setup | ~/Sites/Bresco/brett-setup/ | Ready-to-use setup package for Brett |

## Project Context for Bresco Work

When building tools for Bresco:
- **Both Scott and Brett** are users/developers
- **Brett** may use the toolkit in the future — keep instructions beginner-friendly
- **Personal/startup feel** is appropriate (less corporate than Advosy)
- Projects live in `~/Sites/Bresco/`
- Brett's n8n instance: https://banc-r.app.n8n.cloud/
- No need for Gary handoff — Bresco manages its own deployment

## Tech Stack
Follows the global stack: Nuxt 4 + Nuxt UI v4 + Tailwind CSS v4 | TypeScript | SurrealDB v3 (server, JS SDK surrealdb@2.0.1) | Rust (future)

## Infrastructure
- **Deploy target:** Coolify on Hetzner (primary). Apps and SurrealDB on the same network.
- **Vercel:** Marketing site only (automation-business). New client projects go to Coolify.
- **Why:** One bill, faster DB connections (local network), no vendor limits on bandwidth/functions.
- **Migration:** Move marketing site from Vercel to Coolify when convenient, not urgent.

## Technical Notes

- Brett has less technical knowledge — code should be well-commented
- Prototyping speed matters — get something working and iterate
