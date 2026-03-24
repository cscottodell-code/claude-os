// Good Bun patterns — all should PASS

// Correct: using built-in fetch
const response = await fetch('https://api.example.com/data');

// Correct: using built-in env
const apiKey = Bun.env.API_KEY;

// Correct: db.query() for SurrealDB operations in Bun
await db.query(`CREATE type::record($id) SET name = $name`, { id: 'people:scott', name: 'Scott' });
await db.query(`UPDATE type::record($id) SET nickname = $nick`, { id: 'people:scott', nick: 'Scotty' });
