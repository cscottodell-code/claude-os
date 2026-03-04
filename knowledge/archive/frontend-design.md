# Frontend Design

## Metadata
- Last updated: 2026-02-25
- Version: 1.0
- Applies to: Nuxt UI v4 + Tailwind CSS v4
- Changelog:
  - v1.0: Initial skill

## Overview
This skill teaches Claude Code how to implement design intent using Nuxt UI v4 and
Tailwind CSS v4, producing distinctive UI that avoids generic AI aesthetics. It covers
theming, design tokens, layout patterns, component composition, and anti-patterns.

**Relationship with Impeccable:** The Impeccable plugin (`/impeccable:*` commands) handles
design generation, critique, and iteration — it decides *what* to design and evaluates
quality. This file remains the Nuxt UI v4-specific technical reference — it covers *how*
to build designs using theming, tokens, layout patterns, and Figma integration. They
complement each other: Impeccable = what to design, this file = how to build it in Nuxt UI.

## Theming Nuxt UI v4

### Semantic colors (7 total)
Configure in `app.config.ts`:
```typescript
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'indigo',    // Main brand color (buttons, links, focus rings)
      secondary: 'violet',  // Secondary accent
      neutral: 'slate',     // Backgrounds, borders, text
      success: 'green',     // Success states
      info: 'blue',         // Info states
      warning: 'amber',     // Warning states
      error: 'red',         // Error states
    }
  }
})
```

### Custom design tokens via CSS
Tailwind CSS v4 uses CSS-first configuration. Define custom tokens in your CSS:

```css
/* app/assets/css/main.css */
@import "tailwindcss";
@import "@nuxt/ui";

@theme {
  /* Custom colors beyond Tailwind's defaults */
  --color-brand-50: #f0f4ff;
  --color-brand-500: #4f6df5;
  --color-brand-900: #1a2463;

  /* Custom spacing */
  --spacing-18: 4.5rem;

  /* Custom fonts */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: 'Cal Sans', 'Inter', system-ui, sans-serif;

  /* Custom border radius */
  --radius-xl: 1rem;
}

/* Override Nuxt UI CSS variables for fine-tuning */
:root {
  --ui-primary: var(--color-brand-500);
  --ui-radius: 0.5rem;
}

.dark {
  --ui-primary: var(--color-brand-400);
}
```

### Component defaults (global overrides)
Override how components look across the entire app:

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    button: {
      defaultVariants: {
        size: 'md',
        color: 'primary',
      },
      slots: {
        base: 'font-medium',
      }
    },
    card: {
      slots: {
        root: 'ring-0 shadow-xs',       // Remove border, subtle shadow
        header: 'p-5 font-semibold',
        body: 'p-5',
        footer: 'p-5 bg-muted',
      }
    },
    input: {
      defaultVariants: {
        size: 'md',
      }
    }
  }
})
```

### Per-instance overrides (`:ui` prop)
For one-off customizations:
```vue
<UButton label="Special" :ui="{ base: 'rounded-full px-8' }" />
<UCard :ui="{ root: 'bg-primary-50 dark:bg-primary-950' }">
  <!-- Tinted card -->
</UCard>
```

## Color Palette Generation

When Scott provides a single brand color, generate a full palette:

1. Use the color as `primary` in `app.config.ts`
2. Pick a `neutral` that complements it (warm colors → `stone`/`zinc`, cool → `slate`/`gray`)
3. Keep `success`, `error`, `warning`, `info` as sensible defaults (green, red, amber, blue)

### Utility classes for text and backgrounds
| Class | Light Mode | Dark Mode | Use For |
|-------|-----------|-----------|---------|
| `text-default` | neutral-700 | neutral-200 | Body text |
| `text-muted` | neutral-500 | neutral-400 | Secondary text |
| `text-dimmed` | neutral-400 | neutral-500 | Tertiary/hint text |
| `text-highlighted` | neutral-900 | neutral-50 | Headings, emphasis |
| `bg-default` | white | neutral-900 | Page background |
| `bg-muted` | neutral-50 | neutral-800 | Subtle sections |
| `bg-elevated` | white | neutral-800 | Cards, modals |
| `bg-accented` | neutral-100 | neutral-700 | Active/hover states |

## Layout Patterns

### Dashboard (sidebar + content)
The most common pattern for data-focused apps:

```vue
<!-- layouts/dashboard.vue -->
<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible>
      <template #header>
        <div class="flex items-center gap-2 p-4">
          <UAvatar src="/logo.svg" size="sm" />
          <span class="font-bold text-highlighted">App Name</span>
        </div>
      </template>

      <template #body>
        <UNavigationMenu :items="navItems" orientation="vertical" />
      </template>

      <template #footer>
        <div class="p-4 border-t border-default">
          <UUser name="Scott" description="Admin" />
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
```

### Data-heavy (table + filters + toolbar)
```vue
<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Claims">
        <template #right>
          <UInput v-model="search" placeholder="Search..." icon="i-lucide-search" class="w-64" />
          <UButton label="New Claim" icon="i-lucide-plus" />
        </template>
      </UDashboardNavbar>
      <UDashboardToolbar>
        <USelect v-model="statusFilter" :items="statuses" placeholder="All statuses" class="w-40" />
        <USelect v-model="sortBy" :items="sortOptions" placeholder="Sort by" class="w-40" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <UTable :data="filteredClaims" :columns="columns" />
    </template>

    <template #footer>
      <UPagination v-model:page="page" :total="totalClaims" :items-per-page="20" />
    </template>
  </UDashboardPanel>
</template>
```

### Form-heavy (centered, stepped)
```vue
<template>
  <UContainer class="max-w-2xl py-12">
    <UCard>
      <template #header>
        <h1 class="text-xl font-bold text-highlighted">New Claim</h1>
        <p class="text-muted mt-1">Fill out the details below.</p>
      </template>

      <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
        <UFormField label="Claim Number" name="number">
          <UInput v-model="state.number" placeholder="CLM-2026-001" />
        </UFormField>

        <!-- More fields... -->

        <div class="flex justify-end gap-3">
          <UButton variant="outline" color="neutral" label="Cancel" />
          <UButton type="submit" label="Create Claim" />
        </div>
      </UForm>
    </UCard>
  </UContainer>
</template>
```

## Anti-Patterns (What Makes AI Output Look Generic)

### AVOID these patterns:

1. **Gradient backgrounds for no reason**
   - Bad: `bg-gradient-to-r from-blue-500 to-purple-600` on everything
   - Better: Solid colors with subtle depth via shadows or background tints

2. **Perfectly symmetrical card grids when content varies**
   - Bad: 3 cards in a row, each exactly the same height with the same layout
   - Better: Let content dictate card size. Use `grid-rows-subgrid` or varied layouts.

3. **Generic stock-photo hero sections**
   - Bad: Full-width hero with gradient overlay on a stock photo
   - Better: Content-first heroes with clear typography and purpose

4. **Every section having the same padding/structure**
   - Bad: Every section is `py-24 px-8` with centered content
   - Better: Vary section rhythms — some tight, some spacious

5. **Overly rounded everything**
   - Bad: `rounded-3xl` on cards, buttons, inputs, everything
   - Better: Pick one radius and use it consistently. Default Nuxt UI radius is fine.

6. **Too many shadows/effects**
   - Bad: `shadow-2xl` on every card
   - Better: Use shadows sparingly to create hierarchy. One level of elevation is usually enough.

### INSTEAD, do this:

1. **Vary section rhythms** — Different layouts for different content types
2. **Use asymmetry intentionally** — Not everything needs to be centered
3. **Let content dictate layout** — A 3-item section shouldn't look like a 6-item section
4. **Earn visual weight** — Only make things bold/large/shadowed if they're important
5. **Use negative space** — White space is a design choice, not wasted space
6. **Layer backgrounds** — Use `bg-default` → `bg-muted` → `bg-elevated` for depth

## Elevation and Depth

Create visual hierarchy without making everything bold:

| Layer | Background | Use For |
|-------|-----------|---------|
| Background | `bg-default` | Page background |
| Surface | `bg-muted` or `bg-elevated` | Cards, sections |
| Elevated | Card with `shadow-xs` | Modals, dropdowns, popovers |
| Overlay | `bg-elevated` + `shadow-sm` | Overlay panels, drawers |

### When to use shadows vs borders vs background shifts
- **Shadows:** For elements that "float" above the page (modals, dropdowns)
- **Borders:** For separating adjacent content (table rows, list items)
- **Background shifts:** For subtle grouping (alternating sections, sidebar)

## Design Proof Workflow

When starting a new project's Design Proof phase:

1. **Run `/impeccable:teach-impeccable`** — One-time setup that scans the codebase, asks about
   brand and aesthetic direction, and writes design context to CLAUDE.md
2. **Read the Design Intent document** — Extract colors, typography, layout preferences
3. **If reference screenshots/URLs were provided:**
   - Analyze them for patterns: color palette, spacing rhythm, typography scale
   - Note the grid system, card styles, navigation patterns
   - Extract what makes it distinctive (not just "looks nice")
4. **Generate design tokens:**
   - Set `primary`, `secondary`, `neutral` colors in `app.config.ts`
   - Configure typography via Tailwind CSS `@theme`
   - Set component defaults in `app.config.ts`
5. **Build ONE representative page using `/impeccable:frontend-design`:**
   - Usually the main list/dashboard view
   - Include real-looking sample data (not "Lorem ipsum")
   - Apply all design tokens and component overrides
6. **Run `/impeccable:critique`** — Get UX feedback on visual hierarchy, information
   architecture, and overall design quality
7. **Iterate with Scott** — Use `/impeccable:bolder`, `/impeccable:quieter`, or
   `/impeccable:colorize` as adjustment tools based on feedback
8. **Present to Scott** — Get final approval, then apply the design system everywhere

## Figma Integration

If Scott provides Figma wireframes:

1. Use the Figma MCP integration to read the file:
   - `get_design_context` for component code and screenshot
   - `get_screenshot` for visual reference
2. Extract layout structure and component choices
3. Map Figma components to Nuxt UI equivalents
4. Don't copy pixel-perfect — adapt to Nuxt UI's component system
5. Use Figma's design tokens if available; otherwise, extract colors and spacing

## Component Composition

Combine Nuxt UI primitives into distinctive interfaces:

### Stat card
```vue
<UCard :ui="{ root: 'ring-0', body: 'p-5' }">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-dimmed text-sm">Total Claims</p>
      <p class="text-3xl font-bold text-highlighted mt-1">1,247</p>
      <p class="text-sm text-success mt-1">+12% from last month</p>
    </div>
    <div class="size-12 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center">
      <UIcon name="i-lucide-file-text" class="size-6 text-primary" />
    </div>
  </div>
</UCard>
```

### User row with actions
```vue
<div class="flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors">
  <div class="flex items-center gap-3">
    <UAvatar :src="user.avatar" :alt="user.name" size="md" />
    <div>
      <p class="font-medium text-highlighted">{{ user.name }}</p>
      <p class="text-sm text-muted">{{ user.email }}</p>
    </div>
  </div>
  <UDropdownMenu :items="actionItems">
    <UButton icon="i-lucide-ellipsis" variant="ghost" color="neutral" />
  </UDropdownMenu>
</div>
```

## Common Gotchas

1. **Don't fight Nuxt UI defaults** — Removing `:ui` overrides often looks better
   than adding them. Start with defaults, customize only what the Design Intent specifies.

2. **Dark mode is automatic** — Don't manually set dark colors unless the Design Intent
   says to. Nuxt UI handles dark mode via CSS variables.

3. **Tailwind v4 breaking changes** — `shadow-sm` → `shadow-xs`, `shadow` → `shadow-sm`,
   `ring` → `ring-3 ring-blue-500`. Check memory notes for the full list.

4. **Use Nuxt UI components before custom HTML** — Need a dropdown? Use `UDropdownMenu`.
   Need a dialog? Use `UModal`. Don't build custom versions of existing components.

## Resources
- Nuxt UI components: https://ui.nuxt.com
- Tailwind CSS v4: https://tailwindcss.com
- Nuxt UI Figma Kit: Available free with Nuxt UI v4
