# Design Intent

## Metadata
- Last updated: YYYY-MM-DD
- Version: 1.0
- Changelog:
  - v1.0: Initial design intent

<!--
WHAT THIS IS: A separate document that captures the visual direction for your project.
Everything about how the app should LOOK and FEEL goes here. This is referenced by the
PRD (section 9) and used by Claude Code during the Design Proof phase.

WHY IT MATTERS: Without design direction, Claude Code produces generic-looking AI output.
Every app looks the same: gradient backgrounds, perfectly symmetrical card grids, stock
photo hero sections. This document gives Claude Code specific visual direction so your
app looks intentional and distinctive.

HOW TO USE: Fill this out before building any features. Claude Code uses it during the
Design Proof phase to generate design tokens (colors, typography, spacing) and build
a representative page for your approval. Once approved, these design choices apply to
every page in the app.

NOTE: This template is pending detailed specification. Scott will flesh it out in a
follow-up session. Use the high-level scope below as a starting guide.
-->

> **Interactive alternative:** Instead of filling this out manually, run
> `/impeccable:teach-impeccable` in your project. It scans your codebase,
> asks about brand and aesthetic direction, and writes design context directly
> to CLAUDE.md. Use this template for a standalone document; use teach-impeccable
> for a faster conversational approach.

---

## 1. Reference Examples

<!--
WHAT THIS IS: Existing apps, websites, or designs that match the look you want.
These give Claude Code concrete visual targets instead of vague adjectives.

PROMPTING QUESTIONS:
- What apps or websites have a look you like?
- What specifically do you like about them? (Layout? Colors? Typography? Spacing?)
- Are there any screenshots you can share?

HOW TO PROVIDE REFERENCES:
- URLs to live websites or apps
- Screenshots saved in the project repo
- Figma file URLs (Claude Code can read these via the Figma MCP integration)

EXAMPLE:
  - Linear (linear.app) - Clean, minimal, great use of whitespace
  - Notion - Sidebar navigation pattern, content-first layout
  - Stripe Dashboard - Data visualization, professional feel
-->

| Reference | What I Like About It |
|-----------|---------------------|
| [URL or app name] | [specific things: layout, colors, typography, spacing] |
| [URL or app name] | [specific things] |

**Figma wireframes:** [URL or "none"]
**Screenshots:** [path in repo or "none"]

---

## 2. Personality & Mood

<!--
WHAT THIS IS: The emotional tone of the app. Is it playful? Professional? Minimal?
Dense with information? This shapes everything from color choices to spacing.

PROMPTING QUESTIONS:
- If this app were a person, how would they dress?
- Pick 3-5 adjectives that describe the feel you want
- What mood should someone be in when using this app?

EXAMPLES:
  - "Professional but approachable, like a well-organized workspace"
  - "Minimal and focused, like a high-end note-taking app"
  - "Dense and data-rich, like a trading terminal"
  - "Warm and inviting, like a personal dashboard"
-->

**Personality (3-5 adjectives):**
- [adjective]
- [adjective]
- [adjective]

**Mood:** [one sentence describing the feeling]

---

## 3. Brand Anchors

<!--
WHAT THIS IS: The core visual building blocks — colors, typography, and any
existing brand assets (logos, icons, etc.)

PROMPTING QUESTIONS:
- Do you have specific colors in mind? (Even just "blue-ish" helps)
- Any existing brand colors that must be used?
- Typography preference: modern/clean (sans-serif) or traditional (serif)?
- Do you have a logo or icon to incorporate?

NOTE: You don't need to pick exact hex codes. Claude Code can generate a full
color palette from a single primary color or a mood description.
-->

**Primary color:** [hex code, color name, or "pick one that feels [adjective]"]
**Color mood:** [e.g., "warm neutrals", "cool blues", "earthy tones", "vibrant"]
**Typography:** [e.g., "clean sans-serif", "modern geometric", "let Claude Code pick"]
**Existing assets:** [logo path, icon set, or "none"]

---

## 4. Layout Patterns

<!--
WHAT THIS IS: How content is arranged on the screen. The overall page structure.

PROMPTING QUESTIONS:
- Sidebar navigation or top navigation?
- How dense should the information be? (Lots of whitespace vs compact?)
- Single column content or multi-column dashboard?
- Fixed header or scrolling?

COMMON PATTERNS:
- Dashboard: Sidebar + top bar + content area (like Linear, Notion)
- Marketing: Full-width sections, hero area, scrolling (like landing pages)
- Data-heavy: Sidebar + tables + filters (like admin panels)
- Form-heavy: Centered content, stepped forms (like setup wizards)
-->

**Primary layout:** [dashboard / marketing / data-heavy / form-heavy / other]
**Navigation:** [sidebar / top bar / both / minimal]
**Density:** [spacious / balanced / compact]
**Other preferences:** [anything specific about layout]

---

## 5. Component Style Overrides

<!--
WHAT THIS IS: How Nuxt UI components should be customized from their defaults.
Nuxt UI v4 has good defaults, but you might want buttons to be rounder, cards
to have more shadow, etc.

NOTE: Only override what matters. Nuxt UI defaults are well-designed.
Claude Code will implement these as Tailwind CSS theme customizations
and Nuxt UI theme config (app.config.ts).

EXAMPLES:
  - Buttons: Rounded-full instead of default radius, medium size as default
  - Cards: Subtle shadow, no border, slight background tint
  - Tables: Compact rows, alternating row colors
  - Forms: Floating labels instead of stacked labels
-->

**Buttons:** [style preferences or "default"]
**Cards:** [style preferences or "default"]
**Tables:** [style preferences or "default"]
**Forms:** [style preferences or "default"]
**Other components:** [any specific overrides]

---

## 6. Anti-Patterns (What to Avoid)

<!--
WHAT THIS IS: Explicit guidance on what NOT to do. This is often more useful
than saying what you want, because it prevents the most common AI design mistakes.

THE USUAL SUSPECTS (things that make AI output look generic):
- Gradient backgrounds for no reason
- Perfectly symmetrical card grids when content varies
- Generic stock-photo hero sections
- Every section having the same padding/structure
- Overly rounded everything
- Too many shadows/effects
- Gratuitous animations

INSTEAD:
- Vary section rhythms (different layouts for different content)
- Use asymmetry intentionally
- Let content dictate layout (a 3-item section shouldn't look like a 6-item section)
- Earn visual weight (only make things bold/large/shadowed if they're important)
-->

**Avoid:**
- [specific thing to avoid]
- [another thing]

**Instead:**
- [what to do instead]
- [another approach]

---

## 7. Dark Mode

<!--
WHAT THIS IS: Whether and how the app supports dark mode.

OPTIONS:
- Light only
- Dark only
- Both (user toggle)
- Both (system preference)
-->

**Dark mode:** [light only / dark only / both with toggle / both with system preference]
**Default:** [light / dark / system]
