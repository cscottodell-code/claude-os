# ADR-002: SurrealDB Versioned Migration System

**Status:** Proposed | **Date:** March 22, 2026 | **Author:** Scott (via Claude) | **Applies to:** All projects

---

## The Problem

SurrealDB has no built-in migration system. When you change a table (add a field, rename something, change a type), you need a reliable way to:

- Track what changes have been applied to which environment
- Apply changes in order, without skipping or duplicating
- Roll back if something goes wrong
- Keep your dev, staging, and production databases in sync

> **Spreadsheet analogy:** Imagine you have a shared Google Sheet with a specific column layout. Every time you need to add or rename a column, you write down the change on a numbered sticky note. Anyone who opens the sheet checks the sticky notes and applies any they have not done yet, in order. That is what a migration system does for your database.

## Decision: Build vs Buy

### Community Tools Evaluated

| Tool | Approach | Language | Maturity | Verdict |
|------|----------|----------|----------|---------|
| `surrealdb-migrations` | CLI + Rust library, checksum tracking | Rust | Most established, not prod-ready per author | Best external option |
| `smig` | Define schema in TypeScript, auto-generate .surql migrations | TypeScript | Newest, innovative approach | Watch. TS-first is appealing but very new. |
| `surrealdb-migrate` | CLI, timestamp-based tracking | Rust | Active | Simpler alternative |
| `surrealdb_migration_engine` | Up/down numbered directories | Rust | Simple | Too basic for production |

### Recommendation: Use `surrealdb-migrations` (Odonno)

It is the most battle-tested option. It tracks migrations in a `script_migration` table, uses checksums to detect modified files, and supports both CLI and programmatic usage. If it does not meet your needs, the fallback is to build a lightweight custom runner in TypeScript.

## Architecture

### Folder Structure

```
project-root/
  db/
    schemas/                  # Current state of all tables (source of truth)
      users.surql
      products.surql
    migrations/               # Versioned, ordered changes
      0001_initial_schema.surql
      0002_add_user_role.surql
      0003_add_product_price_index.surql
      0004_rename_user_name_to_full_name.surql
    seeds/                    # Test/dev data
      dev-users.surql
      dev-products.surql
    .surrealdb                # Config for surrealdb-migrations CLI
```

### Migration File Conventions

- **Naming:** `NNNN_description_in_snake_case.surql`
- **Numbering:** Sequential, zero-padded to 4 digits. Start at 0001.
- **Rule:** Once committed to git, NEVER modify a migration file. If you need to fix something, create a new migration.
- **Each migration should be atomic:** It either fully succeeds or fully fails. Do not put unrelated changes in the same file.

### Migration File Examples

**0001: Initial schema (creating tables)**

```sql
-- 0001_initial_schema.surql
-- Creates the core users table

DEFINE TABLE users SCHEMAFULL;

DEFINE FIELD name       ON TABLE users TYPE string;
DEFINE FIELD email      ON TABLE users TYPE string
  ASSERT string::is::email($value);
DEFINE FIELD is_active  ON TABLE users TYPE bool DEFAULT true;
DEFINE FIELD created_at ON TABLE users TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_users_email ON TABLE users FIELDS email UNIQUE;
```

**0002: Adding a field**

```sql
-- 0002_add_user_role.surql
-- Adds role field with default value for existing records

DEFINE FIELD role ON TABLE users TYPE string
  ASSERT $value IN ['admin', 'manager', 'rep']
  DEFAULT 'rep';

-- Backfill existing records
UPDATE users SET role = 'rep' WHERE role = NONE;
```

**0003: Adding an index**

```sql
-- 0003_add_product_price_index.surql
-- Index on product price for faster range queries

DEFINE INDEX idx_products_price ON TABLE products FIELDS price;
```

**0004: Renaming a field**

```sql
-- 0004_rename_user_name_to_full_name.surql
-- Rename 'name' to 'full_name' on users table
-- SurrealDB does not have ALTER FIELD RENAME, so we copy + remove

DEFINE FIELD full_name ON TABLE users TYPE string;
UPDATE users SET full_name = name;
REMOVE FIELD name ON TABLE users;
```

**0005: Removing a field**

```sql
-- 0005_remove_user_legacy_field.surql
-- Remove deprecated 'old_status' field

REMOVE FIELD old_status ON TABLE users;
-- IMPORTANT: REMOVE FIELD only removes the schema definition.
-- The data stays unless you explicitly clear it:
UPDATE users SET old_status = NONE;
```

## How Migrations Run

### Using surrealdb-migrations CLI

```bash
# Apply all pending migrations
surrealdb-migrations apply \
  --url http://localhost:8000 \
  --ns dev --db myapp \
  --username root --password root

# Check status (which migrations have been applied)
surrealdb-migrations list \
  --url http://localhost:8000 \
  --ns dev --db myapp
```

### What Happens Under the Hood

1. The tool reads the `script_migration` table in SurrealDB to see which migrations have already run.
2. It compares that list to the .surql files in your `migrations/` folder.
3. Any files not yet recorded are applied, in order, one at a time.
4. After each successful migration, a record is written to `script_migration` with the filename and a checksum of the file contents.
5. If a file has been modified after being applied (checksum mismatch), the tool warns you.

> **Spreadsheet analogy:** The `script_migration` table is like a changelog tab in your spreadsheet. Each row records: "Migration #3 was applied on March 22 at 4:15 PM, and the checksum was abc123." Next time you run migrations, it checks this tab and only applies what is new.

## Workflow Integration

### pnpm Scripts

```jsonc
// package.json
{
  "scripts": {
    "db:migrate": "surrealdb-migrations apply --url $SURREAL_URL",
    "db:status": "surrealdb-migrations list --url $SURREAL_URL",
    "db:generate": "surql-gen --url $SURREAL_URL --outputDir ./generated/schemas",
    "db:sync": "pnpm db:migrate && pnpm db:generate",
    "db:new": "echo 'Create: db/migrations/NNNN_description.surql'",
    "dev": "pnpm db:sync && nuxt dev"
  }
}
```

### The Full Dev Workflow

1. **You need to change the database.** Create a new .surql file in `db/migrations/` with the next number.
2. **Run `pnpm db:sync`.** This applies the migration to your local SurrealDB, then regenerates Zod schemas (from ADR-001).
3. **Update the corresponding `db/schemas/` file** to reflect the current state of the table. This file is documentation, not executed. It shows "what does this table look like right now?"
4. **Commit all three files:** the migration, the updated schema, and the regenerated types.
5. **In CI/CD:** GitHub Actions runs `pnpm db:migrate` against staging/production before deploying the app.

## Schemas vs Migrations: What Goes Where

| File | Purpose | Executed? | When to Update |
|------|---------|-----------|----------------|
| `db/schemas/users.surql` | Current state of the users table. Documentation. | Only on fresh DB setup | After every migration that touches users |
| `db/migrations/0002_add_role.surql` | The specific change to apply | Yes, once per environment | Never. Once committed, do not modify. |
| `generated/schemas/users.ts` | Auto-generated Zod + TypeScript types | No (imported by app code) | Regenerated by `db:generate` |

## CI/CD Integration

```yaml
# .github/workflows/deploy.yml (simplified)
jobs:
  deploy:
    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4

      - name: Install dependencies
        run: pnpm install

      - name: Run migrations
        run: pnpm db:migrate
        env:
          SURREAL_URL: ${{ secrets.SURREAL_URL }}
          SURREAL_USER: ${{ secrets.SURREAL_USER }}
          SURREAL_PASS: ${{ secrets.SURREAL_PASS }}

      - name: Build and deploy
        run: pnpm build && pnpm deploy
```

## SurrealDB-Specific Gotchas

- **REMOVE FIELD does not remove data.** It only removes the schema definition. You must also run `UPDATE table SET field = NONE` to actually clear the stored values. Always include both in your migration.
- **No native RENAME FIELD.** SurrealDB does not have an ALTER FIELD ... RENAME statement. You must: define the new field, copy data, remove the old field. This is a 3-step migration.
- **DEFINE overwrites silently.** Running `DEFINE FIELD` on an existing field replaces the definition entirely. Use `ALTER FIELD` when you only want to change one property (like the type or default).
- **No transactional DDL.** Schema changes (DEFINE, ALTER, REMOVE) are not wrapped in the same transaction as data changes. If a migration fails halfway through, you may end up with a partial state. Keep migrations small and atomic.

## Rollback Strategy

- **For now: manual rollback migrations.** If migration 0005 breaks something, you write migration 0006 that undoes the change. This is the safest approach with SurrealDB's current tooling.
- **Backup before production migrations.** Run `surreal export` before applying migrations to production. Store the export in your backup bucket.
- **Future:** `smig` (the TypeScript migration tool) supports automatic down-migration generation. Worth revisiting when it matures.

## Implementation Checklist for Claude Code

Hand this ADR to Claude Code in the terminal:

- [ ] Install `surrealdb-migrations` CLI (cargo install or download binary)
- [ ] Create `db/migrations/`, `db/schemas/`, and `db/seeds/` directories
- [ ] Create `.surrealdb` config file with connection defaults
- [ ] Write `0001_initial_schema.surql` based on your current tables
- [ ] Add `db:migrate`, `db:status`, and `db:sync` scripts to package.json
- [ ] Wire `db:sync` into the `dev` script
- [ ] Test: create a test migration, run it, verify the `script_migration` table records it
- [ ] Add migration step to GitHub Actions deploy workflow
