/**
 * SurrealDB connection helper for the toolkit.
 * Uses namespace "toolkit", database "graph".
 * Connects to localhost:8000 with root credentials.
 */

import { Surreal } from "surrealdb";

let instance: Surreal | null = null;

/** Get a connected SurrealDB instance. Returns null if unavailable. */
export async function getDb(): Promise<Surreal | null> {
  if (instance) return instance;

  try {
    const db = new Surreal();
    await db.connect("http://localhost:8000");
    await db.signin({ username: "root", password: "root" });
    // Create ns/db via HTTP first (root level, no USE needed)
    await fetch("http://localhost:8000/sql", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "Accept": "application/json",
        "Authorization": "Basic " + btoa("root:root"),
      },
      body: "DEFINE NAMESPACE IF NOT EXISTS toolkit; DEFINE DATABASE IF NOT EXISTS graph;",
    });
    await db.use({ namespace: "toolkit", database: "graph" });
    instance = db;
    return db;
  } catch {
    return null;
  }
}

/** Close the DB connection */
export async function closeDb(): Promise<void> {
  if (instance) {
    await instance.close();
    instance = null;
  }
}

/** Run a query, returning null if DB is unavailable */
export async function query<T = unknown>(
  surql: string,
  vars?: Record<string, unknown>
): Promise<T[] | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const results = await db.query<T[][]>(surql, vars);
    // SurrealDB returns array of result sets, one per statement
    return results.flat() as T[];
  } catch (e) {
    console.error("SurrealDB query error:", e);
    return null;
  }
}
