# Nuxt UI v4

## Metadata
- Last updated: 2026-02-25
- Version: 1.0
- Applies to: Nuxt UI v4.3.0
- Changelog:
  - v1.0: Initial skill

## Overview

Nuxt UI v4 is the component library for Nuxt 4 apps in Scott's stack. The big change from v3: Pro was merged into the free package. There is now one `@nuxt/ui` package with 125+ components, all MIT licensed. This means dashboard layouts, marketing components, the TipTap editor, and everything else ship in a single install. No separate `@nuxt/ui-pro` package.

## Key Concepts

- **Single package** -- Everything is in `@nuxt/ui`. No Pro license, no separate install. 125+ components total.
- **Tailwind v4 integration** -- Nuxt UI v4 uses Tailwind CSS v4's CSS-first config. You import it in CSS, not in a config file.
- **Semantic color system** -- 7 built-in semantic colors: `primary`, `secondary`, `success`, `info`, `warning`, `error`, `neutral`. Set them in `app.config.ts` and they cascade everywhere.
- **Dark mode built-in** -- Ships with `@nuxtjs/color-mode`. Components adapt automatically. Use `UColorModeButton` or `UColorModeSwitch` to let users toggle.
- **Form validation** -- First-class Zod, Yup, and Valibot support. Pass a schema to `<UForm>` and it handles validation, error display, and submit gating.
- **TanStack Table** -- The `<UTable>` component is powered by TanStack Table, giving you sorting, filtering, and pagination out of the box.
- **TipTap Editor (v4.3)** -- Rich text editing via `<UEditor>` with toolbar, slash commands, mentions, and emoji support. Added in v4.3.0.

## Component Categories

### Layout
Build page structure and dashboard shells.

| Component | Purpose |
|-----------|---------|
| `UApp` | Root wrapper (required for toasts, modals) |
| `UContainer` | Centered max-width container |
| `UHeader` | App header with logo, nav, actions |
| `UFooter` | App footer |
| `UPage` | Page-level layout wrapper |
| `UDashboardGroup` | Groups sidebar + panel together |
| `UDashboardSidebar` | Collapsible sidebar navigation |
| `UDashboardPanel` | Main content area next to sidebar |
| `UDashboardNavbar` | Top bar inside a dashboard panel |

### Form
All form inputs and the validation wrapper.

| Component | Purpose |
|-----------|---------|
| `UForm` | Form wrapper with schema validation |
| `UFormField` | Label + error wrapper for any input |
| `UInput` | Text input |
| `UInputNumber` | Numeric input with increment/decrement |
| `UInputDate` | Date picker input |
| `UInputTime` | Time picker input |
| `UInputTags` | Tag/chip input |
| `USelect` | Single-select dropdown |
| `USelectMenu` | Searchable multi-select dropdown |
| `USwitch` | Toggle switch (was `UToggle` in v3) |
| `UCheckbox` | Checkbox |
| `URadioGroup` | Radio button group |
| `USlider` | Range slider |
| `UPinInput` | PIN/OTP code input |
| `UColorPicker` | Color selection |
| `UFileUpload` | File upload with drag-and-drop |
| `UTextarea` | Multi-line text input |

### Data Display
Show data in structured formats.

| Component | Purpose |
|-----------|---------|
| `UTable` | TanStack-powered data table |
| `UAccordion` | Expandable content sections |
| `UCarousel` | Image/content slider |
| `UCalendar` | Calendar display |
| `UTimeline` | Vertical timeline |
| `UTree` | Hierarchical tree view |
| `UProgress` | Progress bar |

### Navigation
Help users move around the app.

| Component | Purpose |
|-----------|---------|
| `UBreadcrumb` | Breadcrumb trail |
| `UCommandPalette` | Cmd+K search/command palette |
| `UNavigationMenu` | Multi-level navigation menu |
| `UTabs` | Tab navigation |
| `UStepper` | Multi-step wizard |
| `UPagination` | Page number navigation |

### Overlays
Floating UI that appears on top of the page.

| Component | Purpose |
|-----------|---------|
| `UModal` | Centered dialog |
| `USlideover` | Slide-in panel from edge |
| `UDrawer` | Bottom sheet / drawer |
| `UPopover` | Click-triggered floating panel |
| `UTooltip` | Hover tooltip |
| `UContextMenu` | Right-click menu |
| `UDropdownMenu` | Click-triggered dropdown |
| `UToast` / `UToaster` | Notification toasts |

### Editor (v4.3+)
Rich text editing powered by TipTap.

| Component | Purpose |
|-----------|---------|
| `UEditor` | Rich text editor |
| `UEditorToolbar` | Formatting toolbar |
| `UEditorSuggestionMenu` | Slash command menu |
| `UEditorMentionMenu` | @mention picker |
| `UEditorEmojiMenu` | Emoji picker |

### Marketing / Content
Pre-built components for landing pages and content.

| Component | Purpose |
|-----------|---------|
| `UPricingPlan` | Single pricing card |
| `UPricingPlans` | Side-by-side pricing cards |
| `UPricingTable` | Feature comparison table |
| `UAuthForm` | Login/register form |
| `UBlogPost` | Single blog post card |
| `UBlogPosts` | Blog post grid |
| `UBanner` | Top-of-page announcement |
| `UAlert` | Inline alert message |
| `UCallout` | Highlighted callout box |

## Patterns & Best Practices

### Installation

```bash
npm install @nuxt/ui tailwindcss
```

In your main CSS file (e.g., `assets/css/main.css`):

```css
@import "tailwindcss";
@import "@nuxt/ui";
```

In `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui']
})
```

### Always wrap your app with UApp

`<UApp>` must be the root wrapper in your `app.vue`. Without it, toasts and modals will not work.

```vue
<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
```

### Form validation with Zod

This is the recommended pattern. The `name` prop on `UFormField` must match the field name in the Zod schema exactly. The `@submit` event only fires when validation passes.

```vue
<script setup lang="ts">
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  email: '',
  password: ''
})

async function onSubmit() {
  // This only runs if validation passes
  console.log('Valid form data:', state)
}
</script>

<template>
  <UForm :schema="schema" :state="state" @submit="onSubmit">
    <UFormField label="Email" name="email">
      <UInput v-model="state.email" />
    </UFormField>

    <UFormField label="Password" name="password">
      <UInput v-model="state.password" type="password" />
    </UFormField>

    <UButton type="submit" label="Sign In" />
  </UForm>
</template>
```

### Table with sorting and pagination

`UTable` uses TanStack Table under the hood. Define columns with `accessorKey` (which field to show), `header` (column label), and optionally `cell` (custom render function using `h()`).

```vue
<script setup lang="ts">
import { h, resolveComponent } from 'vue'

const columns = [
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      // Custom cell rendering with h() -- think of it like building
      // HTML in JavaScript. h(component, props, children)
      return h(resolveComponent('UBadge'), {
        color: row.original.status === 'active' ? 'success' : 'error',
        label: row.original.status
      })
    }
  }
]

const data = ref([
  { name: 'John', email: 'john@example.com', status: 'active' },
  { name: 'Jane', email: 'jane@example.com', status: 'inactive' }
])

const sorting = ref([])
const page = ref(1)
const pageSize = 10
</script>

<template>
  <UTable :columns="columns" :data="data" v-model:sorting="sorting" />
  <UPagination v-model="page" :total="data.length" :items-per-page="pageSize" />
</template>
```

### Dashboard layout

This pattern creates a sidebar + main content layout. The sidebar collapses on mobile automatically.

```vue
<template>
  <UDashboardGroup>
    <UDashboardSidebar>
      <UNavigationMenu :items="sidebarItems" />
    </UDashboardSidebar>

    <UDashboardPanel>
      <UDashboardNavbar title="Dashboard">
        <template #right>
          <UColorModeButton />
        </template>
      </UDashboardNavbar>

      <UContainer>
        <NuxtPage />
      </UContainer>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
```

### Theming and colors

Set your app-wide colors in `app.config.ts`. These cascade to every component automatically.

```ts
// app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      secondary: 'slate',
      success: 'green',
      info: 'sky',
      warning: 'amber',
      error: 'red',
      neutral: 'zinc'
    }
  }
})
```

Use the built-in utility classes for consistent theming:

| Class | What it does |
|-------|-------------|
| `text-dimmed` | Lightest text (hints, captions) |
| `text-muted` | Secondary text |
| `text-default` | Normal body text |
| `text-highlighted` | Emphasized text |
| `bg-elevated` | Raised surface (cards, panels) |
| `bg-default` | Default page background |

You can also override styles per-component instance:

```vue
<!-- Override a specific button's look -->
<UButton color="success" variant="soft" label="Approve" />
```

### Toast notifications

Toasts require `<UApp>` as a wrapper (which you should already have). Use the `useToast()` composable from anywhere.

```ts
const toast = useToast()

// Success toast
toast.add({
  title: 'Saved!',
  description: 'Your changes have been saved.',
  color: 'success'
})

// Error toast
toast.add({
  title: 'Error',
  description: 'Something went wrong. Please try again.',
  color: 'error'
})
```

Always wrap mutations (saves, deletes, updates) in try/catch with toast feedback:

```ts
async function handleSave() {
  try {
    await saveData()
    toast.add({ title: 'Saved!', color: 'success' })
  } catch (err) {
    toast.add({
      title: 'Save failed',
      description: err instanceof Error ? err.message : 'Unknown error',
      color: 'error'
    })
  }
}
```

### Dark mode

Dark mode works out of the box with `@nuxtjs/color-mode` (included with Nuxt UI). Add a toggle button anywhere:

```vue
<!-- Simple icon button that toggles light/dark -->
<UColorModeButton />

<!-- Or a labeled switch -->
<UColorModeSwitch />
```

### Editor (v4.3)

The rich text editor uses TipTap under the hood. Basic setup:

```vue
<script setup lang="ts">
const content = ref('<p>Start typing...</p>')
</script>

<template>
  <UEditor v-model="content">
    <UEditorToolbar />
  </UEditor>
</template>
```

For slash commands and mentions:

```vue
<template>
  <UEditor v-model="content">
    <UEditorToolbar />
    <UEditorSuggestionMenu />
    <UEditorMentionMenu :items="users" />
    <UEditorEmojiMenu />
  </UEditor>
</template>
```

## Common Gotchas

### UToggle was renamed to USwitch
- **Symptom:** `UToggle` component not found or not rendering.
- **Cause:** Renamed in v4.
- **Fix:** Replace `<UToggle>` with `<USwitch>` everywhere.

### USelect uses :items, not :options
- **Symptom:** Dropdown renders but shows no items.
- **Cause:** The prop was renamed from `:options` (v3) to `:items` (v4).
- **Fix:** Change `:options="myOptions"` to `:items="myItems"`.

### UFormField :error="" (empty string) is truthy
- **Symptom:** A form field shows an error state even though there is no error.
- **Cause:** Passing an empty string `""` to the `:error` prop is treated as truthy.
- **Fix:** Use `undefined` to clear the error, not an empty string.

```vue
<!-- WRONG: empty string shows error state -->
<UFormField :error="errorMessage || ''">

<!-- RIGHT: undefined clears the error -->
<UFormField :error="errorMessage || undefined">
```

### v-model.nullify was renamed to v-model.nullable
- **Symptom:** `v-model.nullify` has no effect or throws a warning.
- **Cause:** Renamed in v4.
- **Fix:** Use `v-model.nullable` instead.

### Missing UApp wrapper breaks toasts and modals
- **Symptom:** `useToast().add()` does nothing. Modals do not appear.
- **Cause:** `<UApp>` is not wrapping your application.
- **Fix:** Make sure `app.vue` has `<UApp>` as the outermost wrapper around `<NuxtPage />`.

### Component auto-import fails with subdirectories
- **Symptom:** Components in subdirectories (like `components/dashboard/Sidebar.vue`) are not auto-imported.
- **Cause:** Nuxt UI's auto-import uses path prefixing by default.
- **Fix:** Set `pathPrefix: false` in `nuxt.config.ts` if you organize components in subdirectories:

```ts
export default defineNuxtConfig({
  components: [
    { path: '~/components', pathPrefix: false }
  ]
})
```

### Custom :ui prop overrides conflict with v4 theming
- **Symptom:** Component looks broken or ignores your `:ui` prop styles.
- **Cause:** v4 changed how the `:ui` prop works internally. Old v3-style overrides often conflict.
- **Fix:** Remove custom `:ui` overrides first. Try using the `color`, `variant`, and `size` props instead. Only reach for `:ui` if the built-in props do not cover your case.

## Examples

### Complete login page

```vue
<script setup lang="ts">
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

const state = reactive({
  email: '',
  password: ''
})

const toast = useToast()

async function onSubmit() {
  try {
    await $fetch('/api/login', { method: 'POST', body: state })
    toast.add({ title: 'Welcome back!', color: 'success' })
    navigateTo('/dashboard')
  } catch {
    toast.add({ title: 'Login failed', description: 'Check your credentials.', color: 'error' })
  }
}
</script>

<template>
  <UContainer class="flex items-center justify-center min-h-screen">
    <UCard class="w-full max-w-sm">
      <UForm :schema="schema" :state="state" @submit="onSubmit">
        <UFormField label="Email" name="email" class="mb-4">
          <UInput v-model="state.email" placeholder="you@example.com" />
        </UFormField>

        <UFormField label="Password" name="password" class="mb-6">
          <UInput v-model="state.password" type="password" />
        </UFormField>

        <UButton type="submit" label="Sign In" block />
      </UForm>
    </UCard>
  </UContainer>
</template>
```

### Data table with actions column

```vue
<script setup lang="ts">
import { h, resolveComponent } from 'vue'

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
  {
    accessorKey: 'actions',
    header: '',
    cell: ({ row }) => {
      return h(resolveComponent('UDropdownMenu'), {
        items: [
          [
            { label: 'Edit', icon: 'i-lucide-pencil', click: () => editUser(row.original) },
            { label: 'Delete', icon: 'i-lucide-trash', color: 'error', click: () => deleteUser(row.original.id) }
          ]
        ]
      }, () => h(resolveComponent('UButton'), {
        icon: 'i-lucide-ellipsis-vertical',
        variant: 'ghost',
        color: 'neutral'
      }))
    }
  }
]

const users = ref([
  { id: '1', name: 'Alice', role: 'Admin' },
  { id: '2', name: 'Bob', role: 'Editor' }
])

function editUser(user: any) {
  console.log('Edit', user)
}

function deleteUser(id: string) {
  console.log('Delete', id)
}
</script>

<template>
  <UTable :columns="columns" :data="users" />
</template>
```

### Command palette (Cmd+K search)

```vue
<script setup lang="ts">
const isOpen = ref(false)

const groups = [
  {
    id: 'pages',
    label: 'Pages',
    items: [
      { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/dashboard' },
      { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' }
    ]
  },
  {
    id: 'actions',
    label: 'Actions',
    items: [
      { label: 'New project', icon: 'i-lucide-plus', click: () => createProject() }
    ]
  }
]

// Open with Cmd+K
defineShortcuts({
  meta_k: () => { isOpen.value = true }
})
</script>

<template>
  <UCommandPalette v-model:open="isOpen" :groups="groups" placeholder="Search..." />
</template>
```

### Slideover for detail panels

```vue
<script setup lang="ts">
const isOpen = ref(false)
const selectedUser = ref(null)

function openDetail(user: any) {
  selectedUser.value = user
  isOpen.value = true
}
</script>

<template>
  <USlideover v-model:open="isOpen">
    <template #header>
      <h3 class="text-lg font-semibold">{{ selectedUser?.name }}</h3>
    </template>

    <div class="p-4">
      <p class="text-muted">{{ selectedUser?.email }}</p>
    </div>
  </USlideover>
</template>
```

## Integration Points

### With SurrealDB
Nuxt UI forms submit validated data that you pass to SurrealDB via your composables. Typical flow:
1. `<UForm>` validates with Zod schema
2. `@submit` handler calls a Pinia store action or `useDatabase()` composable
3. Store action runs SurrealDB query (CREATE, UPDATE, etc.)
4. `useToast()` shows success/error feedback

### With Tailwind v4
Nuxt UI v4 is built on Tailwind v4. Both are imported in CSS (not config files):
```css
@import "tailwindcss";
@import "@nuxt/ui";
```
All Tailwind utility classes work alongside Nuxt UI components. Remember the Tailwind v4 renames: `shadow-sm` is now `shadow-xs`, `shadow` is now `shadow-sm`, `ring` now needs explicit width and color (`ring-3 ring-blue-500`).

### With Nuxt 4
Nuxt UI v4 is a Nuxt module. Register it in `nuxt.config.ts` under `modules`. Components are auto-imported -- no manual import statements needed. Composables like `useToast()`, `useModal()`, and `defineShortcuts()` are also auto-imported.

### With Pinia
Use Pinia stores for state management and call them from Nuxt UI event handlers. For optimistic updates, let the store handle the state change and reload from the database -- do not flip a boolean in the component before the store confirms it.

## Resources

- [Nuxt UI v4 Docs](https://ui.nuxt.com)
- [Nuxt UI GitHub](https://github.com/nuxt/ui)
- [TanStack Table (powers UTable)](https://tanstack.com/table)
- [TipTap (powers UEditor)](https://tiptap.dev)
- [Zod (form validation)](https://zod.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- Context7 library ID for fast lookups: `/llmstxt/ui4_nuxt_llms_txt`
