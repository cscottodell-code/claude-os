/**
 * SurrealDB Integration Test Template
 * Copy this to your project's tests/integration/db-setup.ts
 *
 * Connects to a live SurrealDB v3 instance, creates a throwaway test database,
 * runs all migrations, and tears down after tests complete.
 *
 * Prerequisites:
 *   - SurrealDB running on localhost:8000 (start with: ~/Sites/Global/scott-toolkit/start-surreal.sh)
 *   - Migrations in server/migrations/*.surql
 *   - vitest.config.ts must route tests/integration/** to node environment:
 *
 *     // vitest.config.ts — add to test config:
 *     test: {
 *       environmentMatchGlobs: [
 *         ['tests/integration/**', 'node'],
 *       ],
 *     }
 *
 * Usage in test files:
 *
 *   import { setup, cleanup, getDB } from './db-setup'
 *   import { surql } from 'surrealdb'
 *
 *   describe('My table', () => {
 *     beforeAll(async () => { await setup() }, 30000)
 *     afterAll(async () => { await cleanup() })
 *
 *     it('creates a record', async () => {
 *       const db = getDB()
 *       const [result] = await db.query<[Array<{ id: string }>]>(surql`
 *         CREATE my_table SET name = 'test' RETURN *
 *       `)
 *       expect(result![0].name).toBe('test')
 *     })
 *   })
 */

import { Surreal, RecordId } from 'surrealdb'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const TEST_NS = 'test_ns'
const TEST_DB = `test_${Date.now()}`

let db: Surreal | null = null

export async function setup(): Promise<Surreal> {
  db = new Surreal({
    codecOptions: {
      useNativeDates: true,
      valueDecodeVisitor(value: unknown) {
        if (value instanceof RecordId) return String(value)
        return value
      },
    },
  })

  await db.connect('ws://127.0.0.1:8000', {
    namespace: TEST_NS,
    database: TEST_DB,
    authentication: () => ({
      username: process.env.SURREAL_USER ?? 'root',
      password: process.env.SURREAL_PASS ?? 'root',
    }),
  })

  // Run all migrations in order
  const migrationsDir = join(process.cwd(), 'server', 'migrations')
  const migrationFiles = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.surql'))
    .sort()

  for (const file of migrationFiles) {
    let sql = readFileSync(join(migrationsDir, file), 'utf-8')

    // Strip DEFINE EVENT blocks — they contain embedded semicolons inside
    // curly braces that break SDK parsing, and they call http::post to
    // localhost which isn't running during tests.
    sql = sql.replace(/DEFINE EVENT OVERWRITE[\s\S]*?THEN\s*\{[\s\S]*?\};\s*/g, '')

    try {
      await db.query(sql)
    } catch {
      // If the full migration fails, try statement-by-statement
      // (handles known issues like multi-field FULLTEXT in older migrations)
      const statements = sql
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
      for (const stmt of statements) {
        try {
          await db.query(stmt)
        } catch {
          // Skip individual failing statements
        }
      }
    }
  }

  return db
}

export async function cleanup(): Promise<void> {
  if (!db) return
  await db.query(`REMOVE DATABASE ${TEST_DB}`)
  await db.close()
  db = null
}

export function getDB(): Surreal {
  if (!db) throw new Error('Call setup() before getDB()')
  return db
}
