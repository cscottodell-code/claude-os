# D2D Payroll — View Patterns & Data Model

## Table of Contents
- [View Hierarchy](#view-hierarchy)
- [Scope Filter by View Level](#scope-filter-by-view-level)
- [Payment Data Model](#payment-data-model)
- [Breakdown Cards by View](#breakdown-cards-by-view)
- [Scope Filter Implementation](#scope-filter-implementation)
- [Dropdown Indent Levels](#dropdown-indent-levels)
- [Expanded Row Detail Columns](#expanded-row-detail-columns)
- [Rep Badge Logic](#rep-badge-logic)
- [Key Design Decisions](#key-design-decisions)

---

## View Hierarchy

Four role-based views, each adding a layer of scope:

```
Rep (simplest)
  └── Manager (adds: team scope, overrides, salary toggle)
        └── Regional (adds: region scope, multiple teams)
              └── Direct Seat (adds: division scope, multiple regions)
```

| View | Example Person | Avatar | Salary Toggle | Overrides | Scope Levels |
|------|---------------|--------|---------------|-----------|-------------|
| Rep | Any rep | — | No | No | None (personal only) |
| Manager | Danny Murphy (DM) | DM | Yes | Yes | All, Team, [reps...], Personal |
| Regional | Jonathan Gutierrez (JG) | JG | Yes | Yes | All, Region, Team1, [reps...], Team2, [reps...], Personal |
| Direct Seat | Brandon Cruz (BC) | BC | Yes | Yes | All, Division, Region1, Team1, [reps...], Team2, [reps...], Region2, Team3, [reps...], Team4, [reps...], Personal |

---

## Scope Filter by View Level

### Rep View
No scope filter dropdown. Only shows personal payments.

### Manager View
```
All              ← all payments
Team             ← all non-personal (team reps only)
  Brandon Cruz   ← individual rep (indented pl-9)
  Mike Santos
  Sarah Chen
─────────────────
Personal         ← manager's own deals
```

Active scope values: `'all'`, `'team'`, `'rep:Brandon Cruz'`, `'personal'`

### Regional View
```
All              ← everything
Region           ← all non-personal
─────────────────
Team 1 — Danny Murphy     ← team-level filter (font-medium)
  Danny Murphy             ← individual (pl-9, text-secondary)
  Brandon Cruz
  Mike Santos
─────────────────
Team 2 — Alex Rivera
  Alex Rivera
  Sarah Chen
  Tyler Brooks
─────────────────
Personal
```

Active scope values: `'all'`, `'region'`, `'team1'`, `'team2'`, `'rep:Name'`, `'personal'`

Config structure:
```javascript
const teams = {
    team1: { label: 'Team 1 — Danny Murphy', members: ['Danny Murphy', 'Brandon Cruz', 'Mike Santos'] },
    team2: { label: 'Team 2 — Alex Rivera', members: ['Alex Rivera', 'Sarah Chen', 'Tyler Brooks'] },
};
```

### Direct Seat View
```
All              ← everything
Division         ← all non-personal
─────────────────
Region 1 — Jonathan Gutierrez   ← region header (font-semibold, px-4)
  Team 1 — Danny Murphy          ← team header (font-medium, pl-7)
    Danny Murphy                   ← individual (pl-11, text-secondary)
    Jake Wilson
    Mike Santos
  Team 2 — Alex Rivera
    Alex Rivera
    Sarah Chen
─────────────────
Region 2 — Marcus Webb
  Team 3 — Lisa Tran
    Lisa Tran
    Carlos Mendez
  Team 4 — Nina Torres
    Nina Torres
    Derek Foster
─────────────────
Personal
```

Active scope values: `'all'`, `'division'`, `'region1'`, `'region2'`, `'team1'`-`'team4'`, `'rep:Name'`, `'personal'`

Config structure:
```javascript
const regions = {
    region1: {
        label: 'Region 1 — Jonathan Gutierrez',
        shortLabel: 'R1',
        teams: {
            team1: { label: 'Team 1 — Danny Murphy', shortLabel: 'T1', members: [...] },
            team2: { label: 'Team 2 — Alex Rivera', shortLabel: 'T2', members: [...] },
        }
    },
    region2: { ... }
};
```

Plus a pre-computed `memberLookup` hash for O(1) name-to-location resolution.

---

## Payment Data Model

Each payment object:
```javascript
{
    id: 1,
    type: 'frontend',          // 'frontend', 'backend', 'override', 'clawback'
    label: 'Frontend Commission',
    customer: 'Martinez Family',
    address: '4821 W Camelback Rd',
    amount: 200,               // negative for clawbacks
    signed: '2026-02-18',      // timeline: signed date
    lorSent: '2026-02-20',     // timeline: LOR sent date
    date: '2026-02-23',        // timeline: payment/applied date
    status: 'Paid',            // 'Paid' or 'Applied' (clawbacks)
    dealId: 'D-1042',          // used for Claimsforce link
    inWeek: true,              // period filter flag
    scope: 'personal',         // 'personal' or person's full name
}
```

### Type Colors
```javascript
const typeColors = {
    frontend: { bg: '#F0FDFA', dot: '#14B8A6', label: 'Frontend' },  // teal
    backend:  { bg: '#EFF6FF', dot: '#3B82F6', label: 'Backend' },   // blue
    override: { bg: '#F5F3FF', dot: '#7C3AED', label: 'Override' },  // violet
    clawback: { bg: '#FDF2F8', dot: '#EC4899', label: 'Clawback' },  // pink
};
```

### Claim Links
Expanded row shows Claimsforce link: `sa.claimsforce.net/claim/${dealId}`

### Timeline
Always 3 dots in order: Signed (purple) -> LOR Sent (blue) -> Paid (green)

---

## Breakdown Cards by View

| View | Cards |
|------|-------|
| Rep | Frontends, Backends, Clawbacks, Total |
| Manager | Frontends, Backends, Overrides, Clawbacks, [Salary], Total |
| Regional | Frontends, Backends, Overrides, Clawbacks, [Salary], Total |
| Direct Seat | Frontends, Backends, Overrides, Clawbacks, [Salary], Total |

**Salary card** appears only when toggle is ON. Grid adjusts dynamically.

Salary values scale with seniority:
| Role | Weekly | Monthly | YTD |
|------|--------|---------|-----|
| Manager | $1,250 | $5,000 | $10,000 |
| Regional | $1,500 | $6,000 | $12,000 |
| Direct Seat | $1,750 | $7,000 | $14,000 |

**Total** = sum of all commission types + salary (if enabled). Computed dynamically
from filtered payment data via `computeBreakdown()`.

---

## Scope Filter Implementation

The `getFiltered()` function handles all scope levels:

```javascript
function getFiltered() {
    return payments.filter(p => {
        if (activePeriod === 'week' && !p.inWeek) return false;
        if (activeScope === 'all') return true;
        if (activeScope === 'personal') return p.scope === 'personal';
        if (activeScope === 'division') return p.scope !== 'personal';
        if (activeScope === 'region') return p.scope !== 'personal';
        // Region-level (direct seat only)
        if (activeScope === 'region1' || activeScope === 'region2') {
            return getRegionMembers(activeScope).includes(p.scope);
        }
        // Team-level
        if (activeScope === 'team' || activeScope.startsWith('team')) {
            // For manager: team = all non-personal
            // For regional/direct: look up team members
        }
        // Individual rep
        if (activeScope.startsWith('rep:')) {
            return p.scope === activeScope.replace('rep:', '');
        }
        return true;
    });
}
```

**Breakdown is always computed from filtered data** — never hardcoded per-period amounts.

---

## Dropdown Indent Levels

Three visual hierarchy levels for the scope dropdown:

| Level | Padding | Font | Use |
|-------|---------|------|-----|
| Top-level | `px-4` | `font-semibold` or normal | All, Division, Region headers, Personal |
| Team | `pl-7` | `font-medium` | Team headers (e.g., "Team 1 — Danny Murphy") |
| Individual | `pl-11` | normal, `text-crm-text-secondary` | Individual rep names |

Dividers (`border-t border-gray-100`) separate logical groups.

The scope dropdown gets `max-h-[420px] overflow-y-auto custom-scroll` at the Direct Seat
level to handle the long list.

---

## Expanded Row Detail Columns

Grid columns increase with view scope:

| View | Columns | Fields |
|------|---------|--------|
| Rep | 4 | Customer, Claim Link, Status, Timeline row below |
| Manager | 4 | Customer, Claim Link, Status, Rep |
| Regional | 5 | Customer, Claim Link, Status, Rep, Team |
| Direct Seat | 6 | Customer, Claim Link, Status, Rep, Team, Region |

Below the grid: Timeline (3 dots) + "Report Error" button.

---

## Rep Badge Logic

Badges on payment rows adapt to the current scope:

| Current Scope | Badge Shows |
|---------------|------------|
| All / Division | Full path: "R1 . T1 . Name" (direct seat), "T1 . Name" (regional), "Name" (manager) |
| Region | Team + name: "T1 . Danny Murphy" |
| Team | Just name: "Danny Murphy" |
| Individual rep | No badge (already filtered) |
| Personal | "You" badge in purple |

Personal payments always show "You" badge (purple) unless scope IS personal.

---

## Key Design Decisions

These were explicitly requested by Scott during prototyping:

1. **No List Panel** for Insights pages — full-width layout only
2. **No Aux Panel** for detail — use expandable rows instead
3. **No colored dots** on payment row items
4. **Address is primary text**, payment type label is secondary (gray)
5. **"Payments"** header (not "Recent Payments"), count shown as icon + number
6. **"Claim Link"** (not "Deal ID") with Claimsforce URL
7. **Reps don't see Overrides** — only Manager, Regional, and Direct Seat do
8. **Salary toggle** in top bar, not in the cards section
9. **Modal forms** for Request/Error/Missing (not side panels)
10. **Scope dropdown** uses checkmark on active item, not highlight background
11. **Team sub-filters** are always visible (not collapsible) under team headers
