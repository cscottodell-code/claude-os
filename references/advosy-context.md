# Advosy Business Context

## Metadata
- Last updated: 2026-02-25
- Version: 2.0
- Sources: advosy-company-structure-for-brett.md, advosy-notion-migration-status.md

## About Advosy

Advosy is a home services company based in Arizona, operating under the EOS
(Entrepreneurial Operating System) framework. One leadership team oversees all
subsidiary companies. Scott is the Head of Sales.

**Core Principles:** Versatility, Growth, Win

## Corporate Structure

```
ADVOSY (Parent Company)
│
├── Select Adjusters ─────── Public Adjusting (CF CRM: sa.claimsforce.net)
├── VRZA ─────────────────── Roofing Construction (new branding)
│   └── Image Roofing ────── Specialty Roofs (under VRZA)
├── Everest Air ──────────── HVAC and Plumbing
├── Bloque Restoration ───── Restoration and Mitigation
├── Pestkee ──────────────── Pest Control (just launched)
├── Southwest Packout ────── Packout Services
│
└── Related but separate:
    └── Panda Promo ──────── Promotional products (Gary's side business)
```

## Advosy Leadership Team (EOS)

| Seat | Name | Notes |
|------|------|-------|
| **Visionary** | Brett Ray | Founder, majority owner |
| **Integrator** | Gary Fenn | Lead developer, branding, owns Panda Promo |
| **Finance** | Wesley Hathcock | Majority owner |
| **Sales** | Scott O'Dell | Head of Sales |
| **Marketing** | Chandler Ricks | GoHighLevel automations |
| **Operations** | Melissa Lunt | Gary's sister, often remote from UT |
| **HR** | Kris Davis | |

## Sales Leadership (Reports to Scott)

| Role | Name | Scope |
|------|------|-------|
| **Direct Sales** | Brandon Cruz | D2C for all companies |
| **B2B Sales** | Josh Williamson | Affiliate/referral partnerships |

## Key People for Tech Projects

| Person | Role | Relevance |
|--------|------|-----------|
| **Scott O'Dell** | Sales Seat | AI orchestrator, builds prototypes with Claude Code |
| **Brett Arrington** | VRZA Ops + Bresco co-founder | Vibe coder, builds prototypes with Scott |
| **Gary Fenn** | Integrator | Production developer, productionizes Scott's prototypes |
| **Jeramy Hubbard** | IT Support | Built Claimsforce & Homeforce (EspoCRM) |
| **Chandler Ricks** | Marketing | Manages GoHighLevel automations |

## Key Systems & Platforms

| System | Purpose | URL/Notes |
|--------|---------|-----------|
| **Claimsforce** | Claims CRM (Select Adjusters) | sa.claimsforce.net (EspoCRM) |
| **Homeforce** | Home services CRM | EspoCRM |
| **GoHighLevel** | Marketing automation | Managed by Chandler |
| **n8n (Gary)** | Production workflows | events.advosy.app |
| **n8n (Brett)** | Prototypes + Bresco | banc-r.app.n8n.cloud |
| **Spotio** | D2D field sales management | Replacing RepCard |
| **Advosy CRM** | Custom CRM (Gary's build) | advosy.app (Nuxt 4 + Nuxt UI + SurrealDB) |
| **RingCentral** | SMS/Phone | |

**Workflow pattern:** Prototype in Brett's n8n → Move to Gary's for production

## Notion Database IDs (Legacy - Migrating to SurrealDB)

| Resource | Notion ID |
|----------|-----------|
| Advosy EOS Page | `2ec4b348-1256-800f-98d2-efa913d2ee91` |
| People Database | `2ee4b348-1256-8149-9f6d-f5a1c9501301` (117 records) |
| Software Systems Database | `2ee4b348-1256-8129-8d7f-d1c4c0e7846f` (17 records) |
| Organizations Database | `2ee4b348-1256-81c6-833a-c68df44434b0` (7 records) |

**Note:** Notion was the source of truth but Scott is migrating data to SurrealDB. These IDs are kept for reference during the transition.

## Advosy Tech Projects

| Project | Location | Status | Purpose |
|---------|----------|--------|---------|
| D2D Payroll | ~/Sites/Advosy/d2d-payroll/ | ~90% complete | Payroll calculator for D2D reps |
| Spotio-CF | ~/Sites/Advosy/spotio-cf/ | Code complete | Spotio → Claimsforce integration |
| D2D Income Tool | ~/Sites/Advosy/d2d-income-tool/ | Prototype | Income calculator (Nuxt version) |
| D2D Apps | ~/Sites/Advosy/d2d-apps/ | Prototype | React D2D apps |
| CF Automations | ~/Sites/Advosy/automations/ | Active | n8n workflow automations |
| Membership Docs | ~/Sites/Advosy/membership-docs/ | Complete | Research docs |

## Project Context for Advosy Work

When building tools for Advosy:
- **Users** are typically internal employees (adjusters, sales reps, managers)
- **Data** is often related to claims, customers, scheduling, or training
- **Claimsforce (EspoCRM)** is the existing CRM — new tools may integrate with it
- **Gary** will productionize anything that goes live — keep handoff in mind
- **n8n workflows** exist for operations — check Brett's instance for existing automations
- **Notion** was the source of truth (migrating to SurrealDB)

## Claimsforce (CF) Integration Notes

- Built on EspoCRM platform
- URL: sa.claimsforce.net
- Has its own workflow system, placeholder syntax, and webhook capabilities
- See the /claimsforce skill for detailed patterns

## Terminology

| Term | Meaning |
|------|---------|
| **EOS** | Entrepreneurial Operating System |
| **Seat** | EOS role with specific accountability |
| **Supplementing** | Internal estimating (Select Adjusters) |
| **The Corridor** | Service area: Las Vegas to Tucson |
| **D2D** | Door-to-door sales |
| **D2C** | Direct to consumer |
| **B2B** | Business to business |
| **PA** | Public Adjuster/Adjusting |
| **AM** | Account Manager |
| **CF** | Claimsforce |
| **CM** | Construction Meeting |

## Two Bretts

| Name | Role | Context |
|------|------|---------|
| **Brett Ray** | Visionary | Advosy founder and majority owner |
| **Brett Arrington** | VRZA Ops | Scott's partner for Bresco side business |

## Communication Style
- Professional and business-appropriate
- UI should feel corporate but approachable
- Data accuracy is critical for insurance/claims work
- Gary expects clean, well-documented code for productionization
