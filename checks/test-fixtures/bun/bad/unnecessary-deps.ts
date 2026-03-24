// Bad Bun patterns — should trigger warnings/errors

// WARNING: Bun has built-in fetch
import fetch from 'node-fetch';

// WARNING: Bun reads .env natively
import dotenv from 'dotenv';
dotenv.config();

// ERROR: db.create() fails under Bun
await db.create('messages', { conversation: convId, role: 'user', content: msg });
