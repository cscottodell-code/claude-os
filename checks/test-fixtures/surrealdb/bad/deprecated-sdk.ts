// Bad SurrealDB SDK patterns — should trigger warnings/errors

// WARNING: StringRecordId is deprecated
import { StringRecordId } from 'surrealdb';
const id = new StringRecordId(String(record.id));

// WARNING: as any[] instead of typed generics
const results = await db.query('SELECT * FROM people') as any[];
