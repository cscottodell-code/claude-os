# ADR-001: Zod-to-SurrealDB Schema Bridge

**Status:** Proposed | **Date:** March 22, 2026 | **Author:** Scott (via Claude) | **Applies to:** All projects

---

## The Problem

Right now, when you build a feature, you define the data shape in two separate places:

- **SurrealDB schema:** `DEFINE TABLE` and `DEFINE FIELD` statements that tell the database what shape the data should be.
- **Zod schema:** TypeScript validation objects that tell your app what shape the data should be.

Think of it like maintaining two copies of the same spreadsheet template. When you change a column in one, you have to remember to change it in the other. Eventually, they drift apart and bugs happen.

> **Real example of what goes wrong:** You add an `is_active` boolean to the SurrealDB user table but forget to add it to the Zod schema. Your API silently drops that field on every response. Or worse, your form validation accepts data that the database rejects.

## Decision: Single Source of Truth with Code Generation

Define your schemas in one place, generate everything else. After evaluating the tooling landscape, here is the recommended approach:

### Recommended Architecture

- **Source of truth:** SurrealDB schema (.surql files)
- **Generated outputs:** Zod schemas + TypeScript types
- **Generator tool:** `@sebastianwessel/surql-gen` (surrealdb-client-generator)
- **Secondary tool:** `surreal-codegen` for query-level type safety

Why SurrealDB as the source of truth (not Zod)?

- SurrealDB is your north star. The database defines what data actually exists.
- SurrealDB schemas include permissions, indexes, and events that Zod cannot express.
- `surql-gen` connects to your running database, reads the schema, and generates Zod v4 schemas automatically.

## Folder Structure

```
project-root/
  db/
    schemas/            # Your .surql schema definitions (source of truth)
      users.surql
      products.surql
      orders.surql
    migrations/         # Versioned changes (see ADR-002)
    queries/            # Reusable .surql query files
      get-user.surql
      list-products.surql
  generated/            # AUTO-GENERATED, do not edit
    schemas/            # Zod schemas from surql-gen
      users.ts
      products.ts
      orders.ts
    queries/            # Typed query functions from surreal-codegen
      get-user.ts
      list-products.ts
    index.ts            # Barrel export
  server/
    api/                # Nitro API routes import from generated/
  app/
    composables/        # Vue composables import from generated/
```

## How It Works (Step by Step)

### Step 1: Write your SurrealDB schema

```sql
-- db/schemas/users.surql
DEFINE TABLE users SCHEMAFULL;

DEFINE FIELD name       ON TABLE users TYPE string;
DEFINE FIELD email      ON TABLE users TYPE string
  ASSERT string::is::email($value);
DEFINE FIELD role       ON TABLE users TYPE string
  ASSERT $value IN ['admin', 'manager', 'rep'];
DEFINE FIELD is_active  ON TABLE users TYPE bool
  DEFAULT true;
DEFINE FIELD created_at ON TABLE users TYPE datetime
  DEFAULT time::now();

DEFINE INDEX idx_email ON TABLE users FIELDS email UNIQUE;
```

### Step 2: Apply schema to your dev database

```bash
# This runs all .surql files against your local SurrealDB
surreal import --conn http://localhost:8000 \
  --user root --pass root \
  --ns dev --db myapp \
  db/schemas/users.surql
```

### Step 3: Generate Zod schemas + types

```bash
# surql-gen connects to the running DB, reads the schema, outputs Zod
pnpm surql-gen \
  --url http://localhost:8000 \
  --user root \
  --pass root \
  --ns dev \
  --db myapp \
  --outputDir ./generated/schemas
```

This produces something like:

```typescript
// generated/schemas/users.ts (AUTO-GENERATED)
import { z } from 'zod/v4'

export const UsersSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'rep']),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
})

export type Users = z.infer<typeof UsersSchema>

export const UsersCreateSchema = UsersSchema.omit({ id: true, created_at: true })
export type UsersCreate = z.infer<typeof UsersCreateSchema>
```

### Step 4: Use generated schemas everywhere

```typescript
// server/api/users.post.ts
import { UsersCreateSchema } from '~/generated/schemas/users'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validated = UsersCreateSchema.parse(body)  // Zod validation

  const result = await db.create('users', validated) // SurrealDB insert
  return result
})
```

### Step 5: Automate with a pnpm script

```jsonc
// package.json
{
  "scripts": {
    "db:generate": "surql-gen --url $SURREAL_URL --outputDir ./generated/schemas",
    "db:codegen": "surreal-codegen --schema db/schemas --queries db/queries --output generated/queries",
    "db:sync": "pnpm db:generate && pnpm db:codegen",
    "dev": "pnpm db:sync && nuxt dev"
  }
}
```

> **Spreadsheet analogy:** Think of `db:sync` like refreshing a pivot table. Your source data (SurrealDB schema) is the raw sheet. The generated files are the pivot table that auto-updates when the source changes. You never edit the pivot table directly.

## Tooling Options Evaluated

| Tool | What It Does | Maturity | Our Use |
|------|-------------|----------|---------|
| `surql-gen` | Reads live DB schema, generates Zod schemas + CRUD client | v2, Active | Primary: schema-to-Zod generation |
| `surreal-codegen` | Reads .surql query files, generates typed query functions | WIP, Used in prod at Siteforge | Secondary: query-level type safety |
| `surreal-ts` | Simple TS type definitions from live DB | v3 | Fallback if surql-gen has issues |
| Cirql | ORM with Zod validation built in | Early dev | Watch. Could replace manual queries long term. |
| Surqlize | Official experimental ORM, zero codegen | Experimental | Watch. Official SurrealDB direction for TS type safety. |

## Risks and Mitigations

- **surql-gen requires a running database.** The generator connects to a live SurrealDB instance to read the schema. Mitigation: Use a local dev instance or a CI-specific instance. Add `db:sync` to your CI pipeline.
- **Generated code may need manual tweaks.** Complex SurrealDB types (record links, nested objects) may not map perfectly to Zod. Mitigation: Create a `generated/overrides/` directory for manual type patches that get merged during generation.
- **surreal-codegen requires Rust toolchain.** Installed via `cargo install`. Mitigation: Only use if you have Rust installed (which you do, for Tauri/Eleanor). Otherwise, rely on surql-gen alone and manually type queries.

## Implementation Checklist for Claude Code

Hand this ADR to Claude Code in the terminal:

- [ ] Install `@sebastianwessel/surql-gen` as a dev dependency via pnpm
- [ ] Create `db/schemas/` directory with initial .surql files
- [ ] Create `generated/` directory, add it to `.gitignore` (or commit it, your call)
- [ ] Add `db:generate` and `db:sync` scripts to `package.json`
- [ ] Wire `db:sync` into the dev command so schemas stay fresh
- [ ] Optionally: install `surreal-codegen` via cargo for query-level types
- [ ] Test the full flow: change a .surql file, run `db:sync`, verify generated Zod schema updates
