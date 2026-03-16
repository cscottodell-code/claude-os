---
name: advosy:crm
description: |
  Advosy CRM (advosy.app) design system, layout patterns, and mockup-building context.
  Use when prototyping CRM pages, building HTML mockups for Gary, working on advosy.app
  features, or referencing the CRM design system. Also use when the user mentions CRM
  mockups, panel layouts, Insights pages, D2D Payroll views, or "build a page like the CRM."
  This skill knows the exact colors, spacing, component patterns, and panel terminology
  Gary uses, so mockups match the real app pixel-for-pixel.
user_invocable: true
invocation_hint: /advosy-crm - CRM design system, mockup patterns, and page prototyping context
---

# Advosy CRM — Design System & Mockup Patterns

## What This Is

Gary Fenn built a custom CRM at **advosy.app** using Nuxt 4 + Nuxt UI + SurrealDB. Scott
prototypes new pages as standalone HTML mockups that match Gary's design exactly, so Gary
can reference them when building in the real app.

**Key files:**
- Context doc: `~/Sites/Advosy/advosy-context/crm/CONTEXT.md`
- Screenshots: `~/Sites/Advosy/advosy-context/crm/screenshots/` (01 through 16)
- Mockups: `~/Sites/Advosy/advosy-context/crm/mockups/`

## Mockup Tech Stack

Every mockup is a single HTML file with:
- **Tailwind CSS v4 CDN** (`<script src="https://cdn.tailwindcss.com">`) with custom config
- **Vanilla JavaScript** for interactivity (no framework)
- **Hardcoded sample data** (no API calls)
- **Inline styles** only where Tailwind can't reach (transitions, scrollbar customization)

## Panel System (Gary's Terminology)

| Panel | Width | Description |
|-------|-------|-------------|
| **Menu Rail** | 60px | Icon-only global nav, far left |
| **List Panel** | ~380px | Scrollable record list (not all pages use this) |
| **Details Panel** | fills remaining | Main content area |
| **Aux Panel** | ~280px | Context sidebar (only Inbox uses this) |

**Layout patterns by page type:**
- **Insights/Dashboard** — Menu Rail + full-width content (no List Panel)
- **Master-detail** — Menu Rail + List Panel + Details Panel (Leads, Sales, KB)
- **3-panel** — Menu Rail + List Panel + Details Panel + Aux Panel (Inbox)

## Design Tokens

Use these in Tailwind config's `theme.extend.colors.crm`:

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                crm: {
                    primary: '#7C3AED',        // violet-600
                    'primary-light': '#F5F3FF', // violet-50
                    surface: '#FFFFFF',
                    page: '#F9FAFB',            // gray-50
                    border: '#E5E7EB',          // gray-200
                    'text-primary': '#111827',   // gray-900
                    'text-secondary': '#6B7280', // gray-500
                    'text-muted': '#9CA3AF',     // gray-400
                    frontend: '#14B8A6',         // teal-500
                    backend: '#3B82F6',          // blue-500
                    override: '#7C3AED',         // violet-600
                    clawback: '#EC4899',         // pink-500
                }
            }
        }
    }
}
```

| Constant | Value |
|----------|-------|
| Card border radius | 8px (`rounded-lg`) |
| Card padding | 16-24px (`p-4` to `p-6`) |
| Font | `system-ui, -apple-system, sans-serif` |
| Menu Rail width | 60px |
| Section labels | UPPERCASE, `text-[10px]`, `font-semibold`, `text-crm-text-muted`, `tracking-wider` |

## Component Patterns

### Menu Rail
- White bg, right border, flex column, icons centered
- Active icon: `bg-violet-50 ring-2 ring-crm-primary` with purple stroke
- Inactive icons: `stroke="#6B7280"`, hover `bg-gray-100`
- Tooltip on hover: CSS `::after` pseudo-element, dark bg, appears to the right

### Cards (Summary Tiles)
- White bg, `border border-gray-200`, `rounded-lg`, `p-4`
- Icon in colored circle (28px) + uppercase label
- Large dollar amount below
- Dynamic grid: `grid-cols-${items.length}` adjusts based on card count

### Expandable Rows
- `max-height: 0` to `max-height: 300px` with CSS transition (no JS animation)
- Active row: purple left border (`border-left-color: #7C3AED`) + lavender bg (`#F5F3FF`)
- Chevron rotates 180deg on expand
- Expanded detail: gray-50 bg, grid layout with labeled fields

### Dropdowns
- CSS `opacity`/`transform` transition (fade + slide down)
- `.dropdown-menu.open` class toggles visibility
- Close on outside click via document listener
- Active option: purple text + checkmark SVG, others: gray text

### Modals
- Fixed overlay with `bg-black/40`
- Box: `scale(0.95)` to `scale(1)` transition
- Close on overlay click, escape key
- Form fields: `border border-crm-border rounded-lg`, focus ring matches form type color

### Status Badges
- Paid: `bg-green-50 text-green-700`
- Applied (clawback): `bg-pink-50 text-pink-700`
- Small rounded pills: `text-[11px] font-medium px-2 py-0.5 rounded-full`

### Rep Badges (on payment rows)
- Personal: `bg-violet-50 text-crm-primary` showing "You"
- Team member: `bg-gray-100 text-crm-text-secondary` showing name
- Context-aware: shows more detail at broader scopes (e.g., "R1 . T1 . Name" at All)

## Insights Page Header Pattern

All Insights sub-pages (Payroll, Sales, Claims) share this header:

```
[Bar chart icon] Insights [chevron]    [Scope filter]  |  [Calendar] Date Range [chevron]  [+]
```

- Left: Insights dropdown (Payroll/Sales/Claims with checkmark on active)
- Right: Scope filter + date range + purple plus button
- Plus button dropdown: Request, Error, Missing — each opens a modal form

## D2D Payroll View Patterns

Read `references/d2d-payroll.md` for the complete breakdown of:
- View hierarchy (Rep, Manager, Regional, Direct Seat)
- Scope filter logic per view level
- Payment data model and type colors
- Breakdown card configurations
- Which views have Overrides, Salary toggle, etc.

## Existing Mockups

| File | View | Person | Key Features |
|------|------|--------|-------------|
| `rep-view.html` | Rep | Any rep | 4 cards (no overrides), no scope filter |
| `manager-view.html` | Manager | Danny Murphy (DM) | Overrides, salary toggle, scope: All/Team/Personal with rep sub-filter |
| `regional-view.html` | Regional | Jonathan Gutierrez (JG) | 2 teams, scope: All/Region/Team1/Team2/Personal with rep sub-filters |
| `direct-seat-view.html` | Direct Seat | Brandon Cruz (BC) | 2 regions, 4 teams, scope: All/Division/Region/Team/Rep/Personal |

## Quick Reference: CRM Pages

| Route | Page | Layout |
|-------|------|--------|
| `/` | Plate (dashboard) | Full width |
| `/leads` | Leads | Master-detail |
| `/sales` | Sales | Master-detail |
| `/insights` | Insights | Full width |
| `/inbox` | Inbox | 3-panel |
| `/kb` | Knowledge Base | Master-detail |
| `/admin` | Admin settings | Full width grid |

## Building a New Mockup

When Scott asks for a new CRM page mockup:

1. **Read the context doc** (`~/Sites/Advosy/advosy-context/crm/CONTEXT.md`) for page-specific details
2. **Check screenshots** in `~/Sites/Advosy/advosy-context/crm/screenshots/` for visual reference
3. **Start from the closest existing mockup** — copy the HTML shell (Menu Rail, top bar, sub-header)
4. **Use the Tailwind config** from this skill — never deviate from the CRM token palette
5. **Match interaction patterns**: dropdowns, expandable rows, modals as documented above
6. **Save to** `~/Sites/Advosy/advosy-context/crm/mockups/` as a single HTML file
