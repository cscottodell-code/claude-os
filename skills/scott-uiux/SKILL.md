---
name: scott-uiux
description: >-
  UI/UX design system combining usability rules with creative frontend design.
  This skill is for general UI/UX foundations (spacing, typography, color, layout,
  interaction cost) — not for Advosy CRM-specific design (use advosy-crm), not for
  creative frontend code generation from scratch (use impeccable:frontend-design).
  Use when building or reviewing UI components, frontend pages, forms, cards, modals,
  navigation, dashboards, or any user-facing interface. Also use when the user asks
  about spacing, shadows, typography, color choices, interaction cost, layout patterns,
  empty states, error pages, or mobile design. This skill should be consulted whenever
  writing HTML, CSS, or component templates that a user will see and interact with,
  even if the user doesn't explicitly ask for "design help." If you're generating
  frontend code, these rules apply.
section: reference
---

# UI/UX Design System

A two-step design process: **foundation first, then creative layer**. Every interface must be correct before it's distinctive. Based on "The UI/UX Playbook" by uxpeak (foundation) and production frontend design principles (creative layer).

## How to Use This Skill

**Step 1 — Foundation (non-negotiable).** Apply the core rules below. These govern typography, color, spacing, layout, and interaction cost. They ensure every interface is usable, accessible, and consistent. Never skip or override these.

**Step 2 — Creative Layer (within constraints).** Once the foundation is solid, apply the creative principles to make the interface distinctive and memorable. The creative layer operates *inside* the foundation rules, not instead of them.

For deeper detail on foundation rules, read the corresponding reference file:
- `references/layout-and-spacing.md` — White space, alignment, grids, proximity, padding
- `references/visual-depth.md` — Icons, shadows, borders, glassmorphism
- `references/color-and-typography.md` — Color usage, font rules, contrast, line height
- `references/interaction-cost.md` — Reducing clicks, cognitive load, UX laws
- `references/bonus-patterns.md` — Forms, modals, empty states, errors, navigation, mobile

---

## Step 1: Foundation Rules

These are specific, measurable, and mandatory. Apply to every UI.

### Layout & Spacing
- Use a consistent spacing scale: 4, 8, 16, 24, 32, 48px. No arbitrary values.
- Group related items close together, separate unrelated items with space (Law of Proximity).
- Left-align body text. Center alignment only for short headings/titles.
- Touch targets: minimum 44x44px (iOS) or 48x48px (Android/Material).
- Don't stretch forms/content to fill the whole screen. Constrain to a comfortable width (400-600px for forms, 800-1200px for content) with white space around it.
- Align all elements to a grid. Even small misalignments make a UI feel unpolished.
- Consistent padding: if a card has 16px padding on one screen, it has 16px on every screen.

### Typography
- Body text: 16px, font-weight regular (400), line-height 1.5-1.6, color #4E4E4E (light) or #CACACA (dark).
- Headings: larger size (28-32px), bold/semibold weight (600-700), line-height 1.2-1.3, color #1A1A1A (light) or #F2F2F2 (dark).
- Never use pure black (#000000) on white or pure white (#FFFFFF) on dark. Use off-black/off-white.
- Max 2 fonts. Best practice: one versatile sans-serif (Inter, Gotham, Lato, Open Sans, San Francisco, Helvetica, Manrope, Roboto) with varied weights. For heading+body pairs: Playfair Display + Source Sans Pro, Raleway + Merriweather, Montserrat + Open Sans.
- Line length: 45-75 characters (desktop), 30-40 characters (mobile).
- Minimum contrast ratio: 4.5:1 (WCAG AA).
- Never go below 12px for any visible text. Below 10px: avoid entirely.
- Avoid extra-light font weights for body text (thin strokes blend into backgrounds).

### Color
- Use primary/brand color sparingly: CTAs, links, active states, interactive elements only. When everything is highlighted, nothing stands out.
- Neutral backgrounds (grey, beige, soft white) for content areas. Save colored backgrounds for splash screens and hero headers.
- Never rely on color alone to communicate state. Combine with icons and text labels (accessibility).
- Status colors are sacred: red = error/danger, green = success, yellow = warning, blue = info. Don't break these conventions. You may adjust the shade to match your brand, but the meaning stays fixed.
- Dark mode: reduce glare, minimize eye strain. Support both light and dark themes.

### Shadows & Depth
- Use soft shadows. Recommended: `box-shadow: 0 12px 48px rgba(0,0,0,0.08)`.
- Match shadow color to background. On colored backgrounds, tint the shadow to match (purple bg = purple-tinted shadow, not grey).
- Define 3 shadow levels: soft (cards/buttons), medium (modals/popovers), strong (dropdowns/alerts).
- Alternative depth: light grey background (#F5F5F5) with white cards creates natural layering without shadows.
- Borders: thin (1px) and light. Fewer borders = cleaner. Prefer white space and background color changes to separate sections.

### Icons
- Pick one icon style (outlined OR filled) and use it consistently across all screens.
- Exception: filled = active, outlined = inactive in navigation tabs.
- Use a single icon set (Heroicons, Lucide, Phosphor, etc.). Don't mix sets.

### Interaction Cost
- Keep related actions close (Fitts's Law). "Edit" button next to the thing it edits.
- Minimize choices. Highlight recommended/popular options (Hick's Law).
- Break information into chunks of ~7 items max (Miller's Law).
- Show options visually (color swatches) instead of hiding in dropdowns.
- Use +/- selectors for quantity instead of dropdown numbers.
- Prefer recognition over recall: familiar icons, logical layouts, "Continue where you left off" patterns.
- Streamline tasks: auto-fill, remember preferences, pre-select sensible defaults.

---

## Step 2: Creative Layer

Once the foundation is solid, make the interface distinctive. The creative layer adds personality, atmosphere, and memorability without breaking usability rules.

### Design Thinking (Before Coding)
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Commit to a clear aesthetic direction. Options include: brutally minimal, maximalist, retro-futuristic, organic/natural, luxury/refined, playful, editorial/magazine, brutalist/raw, art deco, soft/pastel, industrial/utilitarian, and many more. The key is intentionality, not intensity.
- **Differentiation**: What makes this unforgettable? What's the one thing someone will remember?

### Creative Typography (Within Foundation Constraints)
The foundation provides the sizing, weight, and spacing rules. The creative layer is about *which* fonts you choose from the approved options and how you pair them:
- Pick fonts with character that match the tone. A dashboard for a law firm wants different font personality than a fitness app.
- Use weight and size contrast creatively within the foundation rules to create dramatic hierarchy.
- Consider letterspacing for headings (slightly expanded tracking for uppercase labels, tighter tracking for large display text).

### Creative Color (Within Foundation Constraints)
The foundation says where to use color (CTAs, interactive elements) and where not to (don't break status conventions). The creative layer is about *which* colors and how they interact:
- Dominant color with sharp accents outperforms timid, evenly-distributed palettes.
- Use CSS variables for consistency across the design.
- Consider the emotional weight of your palette. Warm tones feel approachable, cool tones feel professional, high-contrast feels energetic.

### Atmosphere & Visual Details
Add depth and texture that match the aesthetic direction:
- Gradient meshes, noise textures, geometric patterns, layered transparencies
- Dramatic shadows (using the foundation's shadow system with creative values)
- Decorative borders, custom cursors, grain overlays
- Background treatments that create atmosphere rather than defaulting to solid colors
- Match visual complexity to the design's tone: maximalist designs get elaborate effects, minimal designs get precise subtle details

### Motion & Micro-interactions
- Use animations for key moments: page load reveals (staggered animation-delay), hover states, transitions between states.
- Prioritize CSS-only solutions for HTML. Use motion libraries when available in the framework.
- Focus on high-impact moments: one well-orchestrated page load creates more delight than scattered micro-interactions.
- Scroll-triggered animations and hover states that surprise.

### Spatial Composition (Within Grid Constraints)
The foundation requires consistent spacing scales and grid alignment. The creative layer is about how you *compose* within that system:
- Vary section rhythm: alternate between dense information blocks and breathing room.
- Use asymmetric layouts within the grid (2/3 + 1/3 splits, offset cards).
- Create visual flow through intentional element placement.
- Generous negative space is itself a creative choice.

### Avoid Generic AI Aesthetics
- Don't default to the same look every time. Vary between light/dark themes, different font pairings, different aesthetic directions.
- Avoid cliched patterns: purple gradients on white, cookie-cutter card grids, predictable layouts.
- Each interface should feel designed for its specific context, not generated from a template.

---

## Quick Checklists

### Before Shipping Any UI
- [ ] Spacing is consistent (using the defined scale, not arbitrary values)
- [ ] Text hierarchy is clear (headings visually distinct from body via size, weight, AND color)
- [ ] No pure black on white or pure white on black
- [ ] All interactive elements have sufficient touch targets (44px+)
- [ ] Color is not the only indicator of state (error/success has icons + text too)
- [ ] Line length within 45-75 chars (desktop), 30-40 chars (mobile)
- [ ] Contrast ratio meets WCAG AA (4.5:1 minimum)
- [ ] Icons from one consistent set/style
- [ ] Empty states provide guidance, not just "No items found"
- [ ] Error states explain what went wrong AND what to do next
- [ ] Design has a clear aesthetic direction (not generic/default)
- [ ] Motion and transitions are purposeful, not decorative

### Form Design Checklist
- [ ] Fields match expected input (short fields for CVC/zip, long for card number)
- [ ] Related fields grouped (expiry + CVC on same row)
- [ ] No "confirm password" field (use show/hide toggle instead)
- [ ] Inline validation as user types (don't wait for submit)
- [ ] Labels are above or beside inputs, not just placeholder text

### Modal/Dialog Checklist
- [ ] Destructive actions use red button color
- [ ] "Cancel" on left, primary action on right (LTR pattern)
- [ ] Always provide a way to go back/cancel
- [ ] Content is focused, no distractions from the task

### Mobile Checklist
- [ ] Key CTAs within thumb zone (bottom-center of screen)
- [ ] Line length adjusted to 30-40 characters
- [ ] Touch targets at least 48x48px
- [ ] Dark mode supported
