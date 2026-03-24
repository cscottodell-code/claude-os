// Good SurrealDB SDK patterns — all should PASS
import { Surreal, RecordId } from 'surrealdb';
import { surql } from 'surrealdb';

const db = new Surreal();

// Correct: typed query
const [people] = await db.query<[Person[]]>('SELECT * FROM people');

// Correct: surql template tag
await db.query(surql`SELECT * FROM messages WHERE conversation = ${convId}`);

// Correct: db.query() for updates (Bun-safe)
await db.query(`UPDATE type::record($id) SET name = $name`, { id: `people:${slug}`, name });
