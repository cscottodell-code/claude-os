---
paths:
  - "**/*.ts"
  - "**/*.vue"
  - "**/*.js"
---

# Code Style Rules

Standards for TypeScript, Vue, and JavaScript files.

## TypeScript
- Use TypeScript with strict mode
- Prefer interfaces over types for object shapes
- Use explicit return types for public functions
- Avoid `any` - use `unknown` if type is truly unknown

## Vue 3
- Use Composition API with `<script setup lang="ts">`
- Use Pinia for state management
- Keep components focused and small

## Styling (Tailwind CSS v4)
- Use Tailwind CSS classes (not custom CSS)
- Use semantic color names from design system
- Prefer utility classes over custom styles
- CSS-first config: use `@import "tailwindcss"` and `@theme` in CSS (not `tailwind.config.js`)
- v4 class renames: `shadow-sm` -> `shadow-xs`, `outline-none` -> `outline-hidden`, `ring` -> `ring-3`

## Code Quality
- Add comments only for complex logic
- Use async/await (not .then())
- Use descriptive variable names
- Keep functions under 50 lines
- Extract repeated logic into composables/utilities

## Formatting
- Run Prettier before committing
- Use 2-space indentation
- Single quotes for strings (except in JSON)
