# SurrealDB v3: Agent Application Layer (TypeScript)

> The TypeScript code between your SurrealQL patterns and a running agent.
> Complements `surrealdb-v3-ai-patterns.md` (database layer) with the application layer.

---

## Prerequisites

| Dependency | Version | Install |
|---|---|---|
| `surrealdb` | 2.0.1 | `pnpm add surrealdb@2.0.1` |
| `@anthropic-ai/sdk` | latest | `pnpm add @anthropic-ai/sdk` |
| `zod` | latest | `pnpm add zod` |

Connection setup: follow the Eleanor pattern in `SKILL.md` (WebSocket, `useNativeDates`, `valueDecodeVisitor`).

---

## Types

```typescript
// types/agent.ts
import { z } from 'zod'

// What the read step returns
export interface AgentContext {
  chunks: Array<{ id: string; content: string; dist: number }>
  entities: Array<{ id: string; name: string; type: string }>
  memory: Array<{ key: string; value: unknown }>
}

// What the LLM extracts for the write step
export const ExtractedEntitySchema = z.object({
  name: z.string(),
  type: z.enum(['person', 'company', 'concept', 'preference', 'fact']),
  relationship: z.string().optional(),
  relatedTo: z.string().optional(),
})

export type ExtractedEntity = z.infer<typeof ExtractedEntitySchema>

export interface AgentResponse {
  text: string
  entities: ExtractedEntity[]
}

export interface AgentConfig {
  agentId: string
  sessionId: string
  model: string
  systemPrompt: string
}
```

---

## Step 1: Read Context

One SurrealQL query assembles vector search + graph traversal + working memory. This replaces 3 separate database calls in a traditional stack.

```typescript
// agent/read-context.ts
import type Surreal from 'surrealdb'
import type { AgentContext } from '~/types/agent'

export async function readContext(
  db: Surreal,
  queryVec: number[],
  sessionId: string,
  agentId: string,
): Promise<AgentContext> {
  // All three queries run in a single round-trip
  const [result] = await db.query<[{
    chunks: AgentContext['chunks']
    entities: AgentContext['entities']
    memory: AgentContext['memory']
  }]>(`
    LET $chunks = SELECT id, content, vector::distance::knn() AS dist
      FROM chunk
      WHERE embedding <|5, 40|> $query_vec
      ORDER BY dist ASC;

    LET $entities = SELECT
      ->mentions->entity.{ id, name, type } AS entities
    FROM $chunks;

    LET $memory = SELECT key, value FROM working_memory
      WHERE session_id = $session_id
      AND agent_id = $agent_id;

    RETURN {
      chunks: $chunks,
      entities: $entities,
      memory: $memory
    };
  `, {
    query_vec: queryVec,
    session_id: sessionId,
    agent_id: agentId,
  })

  return {
    chunks: result?.chunks ?? [],
    entities: result?.entities?.flatMap(e => e.entities) ?? [],
    memory: result?.memory ?? [],
  }
}
```

---

## Step 2: Call the LLM

Pass the assembled context to Claude. Use adaptive thinking for complex reasoning. Use streaming for any request that may produce long output.

```typescript
// agent/reason.ts
import Anthropic from '@anthropic-ai/sdk'
import type { AgentContext, AgentConfig } from '~/types/agent'

const client = new Anthropic()

export async function reason(
  context: AgentContext,
  userMessage: string,
  config: AgentConfig,
): Promise<string> {
  // Build the context section from the read step
  const contextBlock = [
    context.chunks.length
      ? `Relevant knowledge:\n${context.chunks.map(c => c.content).join('\n\n')}`
      : '',
    context.entities.length
      ? `Known entities: ${context.entities.map(e => `${e.name} (${e.type})`).join(', ')}`
      : '',
    context.memory.length
      ? `Session context:\n${context.memory.map(m => `${m.key}: ${JSON.stringify(m.value)}`).join('\n')}`
      : '',
  ].filter(Boolean).join('\n\n')

  const stream = client.messages.stream({
    model: config.model,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: `${config.systemPrompt}\n\n${contextBlock}`,
    messages: [{ role: 'user', content: userMessage }],
  })

  const message = await stream.finalMessage()

  // Extract only the text response (skip thinking blocks)
  const textBlock = message.content.find(
    (b): b is Anthropic.TextBlock => b.type === 'text',
  )
  return textBlock?.text ?? ''
}
```

### Streaming to the client

If you need to stream tokens to a UI instead of collecting the full response:

```typescript
// agent/reason-streaming.ts
import Anthropic from '@anthropic-ai/sdk'
import type { AgentContext, AgentConfig } from '~/types/agent'

const client = new Anthropic()

export async function* reasonStreaming(
  context: AgentContext,
  userMessage: string,
  config: AgentConfig,
): AsyncGenerator<string> {
  const contextBlock = buildContextBlock(context) // same as above

  const stream = client.messages.stream({
    model: config.model,
    max_tokens: 64000,
    thinking: { type: 'adaptive' },
    system: `${config.systemPrompt}\n\n${contextBlock}`,
    messages: [{ role: 'user', content: userMessage }],
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta'
      && event.delta.type === 'text_delta'
    ) {
      yield event.delta.text
    }
  }
}
```

---

## Step 3: Extract Entities from the Response

Parse the LLM output to find new entities and relationships. Use a structured output call so the extraction is reliable.

```typescript
// agent/extract.ts
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { ExtractedEntitySchema, type ExtractedEntity } from '~/types/agent'

const client = new Anthropic()

const ExtractionResultSchema = z.object({
  entities: z.array(ExtractedEntitySchema),
})

export async function extractEntities(
  responseText: string,
): Promise<ExtractedEntity[]> {
  const result = await client.messages.parse({
    model: 'claude-haiku-4-5', // cheap model for extraction
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Extract named entities and their relationships from this text. Only extract entities that are clearly stated, not implied.\n\n${responseText}`,
    }],
    output_config: {
      format: zodOutputFormat(ExtractionResultSchema),
    },
  })

  return result.parsed_output?.entities ?? []
}
```

---

## Step 4: Write Results

Atomically write the agent's response, extracted entities, and memory updates in one transaction. This is the database side of the Context Layer Loop.

```typescript
// agent/write-results.ts
import type Surreal from 'surrealdb'
import type { ExtractedEntity, AgentConfig } from '~/types/agent'

interface WriteParams {
  config: AgentConfig
  conversationId: string
  responseText: string
  responseTokens: number
  entities: ExtractedEntity[]
  memoryUpdates: Record<string, unknown>
}

export async function writeResults(
  db: Surreal,
  params: WriteParams,
): Promise<void> {
  const { config, conversationId, responseText, responseTokens, entities, memoryUpdates } = params

  // Save the message
  await db.query(`
    BEGIN TRANSACTION;

    CREATE message SET
      conversation = type::record($conversation_id),
      role = 'assistant',
      content = $response,
      token_count = $tokens,
      created_at = time::now();

    COMMIT TRANSACTION;
  `, {
    conversation_id: conversationId,
    response: responseText,
    tokens: responseTokens,
  })

  // Create entities and relations (outside the message transaction
  // because entity creation is best-effort, not critical path)
  for (const entity of entities) {
    await db.query(`
      LET $existing = SELECT * FROM entity WHERE name = $name LIMIT 1;

      IF array::len($existing) = 0 {
        CREATE entity SET
          name = $name,
          type = $type,
          mention_count = 1;
      } ELSE {
        UPDATE entity SET mention_count += 1
          WHERE name = $name;
      };
    `, {
      name: entity.name,
      type: entity.type,
    })

    // Create relation if specified
    if (entity.relatedTo) {
      await db.query(`
        LET $from = SELECT id FROM entity WHERE name = $from_name LIMIT 1;
        LET $to = SELECT id FROM entity WHERE name = $to_name LIMIT 1;

        IF array::len($from) > 0 AND array::len($to) > 0 {
          RELATE $from[0].id->related_to->$to[0].id SET
            relationship = $rel,
            confidence = 0.7,
            discovered_at = time::now();
        };
      `, {
        from_name: entity.name,
        to_name: entity.relatedTo,
        rel: entity.relationship ?? 'related',
      })
    }
  }

  // Update working memory
  for (const [key, value] of Object.entries(memoryUpdates)) {
    await db.query(`
      UPSERT working_memory SET
        agent_id = $agent_id,
        session_id = $session_id,
        key = $key,
        value = $value
      WHERE agent_id = $agent_id
        AND session_id = $session_id
        AND key = $key;
    `, {
      agent_id: config.agentId,
      session_id: config.sessionId,
      key,
      value,
    })
  }
}
```

---

## Step 5: The Agent Loop

Tie all four steps together into the context layer loop: read, reason, extract, write.

```typescript
// agent/loop.ts
import type Surreal from 'surrealdb'
import type { AgentConfig } from '~/types/agent'
import { readContext } from './read-context'
import { reason } from './reason'
import { extractEntities } from './extract'
import { writeResults } from './write-results'

export async function agentLoop(
  db: Surreal,
  userMessage: string,
  queryVec: number[],
  conversationId: string,
  config: AgentConfig,
): Promise<string> {
  // 1. Read: vector search + graph + memory in one query
  const context = await readContext(db, queryVec, config.sessionId, config.agentId)

  // 2. Reason: pass context to Claude
  const responseText = await reason(context, userMessage, config)

  // 3. Extract: pull entities from the response (fire-and-forget is OK here)
  const entities = await extractEntities(responseText).catch(() => [])

  // 4. Write: save response + entities + memory atomically
  await writeResults(db, {
    config,
    conversationId,
    responseText,
    responseTokens: responseText.length / 4, // rough estimate; use actual from API
    entities,
    memoryUpdates: {
      last_query: userMessage,
      last_response_summary: responseText.slice(0, 200),
    },
  })

  return responseText
}
```

---

## Nuxt Integration

### As an API route

```typescript
// server/api/agent/chat.post.ts
import { z } from 'zod'
import { useSurreal } from '~/server/plugins/surreal'
import { agentLoop } from '~/agent/loop'
import { getEmbedding } from '~/agent/embedding' // your embedding function

const BodySchema = z.object({
  message: z.string().min(1),
  conversationId: z.string(),
  sessionId: z.string(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, BodySchema.parse)
  const db = useSurreal()

  const queryVec = await getEmbedding(body.message)

  const response = await agentLoop(db, body.message, queryVec, body.conversationId, {
    agentId: 'eleanor',
    sessionId: body.sessionId,
    model: 'claude-opus-4-6',
    systemPrompt: 'You are Eleanor, Scott\'s AI assistant. Be helpful, direct, and concise.',
  })

  return { response }
})
```

### Embedding function (placeholder)

You need an embedding function to convert text to vectors. This calls OpenAI's embedding API (or any provider that returns 1536-dim vectors for the HNSW indexes).

```typescript
// agent/embedding.ts
export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })

  const data = await response.json()
  return data.data[0].embedding // number[1536]
}
```

---

## Error Handling

Use Anthropic SDK typed exceptions. Never string-match error messages.

```typescript
import Anthropic from '@anthropic-ai/sdk'

try {
  const response = await reason(context, userMessage, config)
} catch (error) {
  if (error instanceof Anthropic.RateLimitError) {
    // Back off and retry
  } else if (error instanceof Anthropic.BadRequestError) {
    // Check message format, token count
  } else if (error instanceof Anthropic.APIError) {
    console.error(`Claude API error ${error.status}: ${error.message}`)
  }
}
```

---

## What This Does NOT Cover

- **Embedding model selection**: The placeholder uses OpenAI's `text-embedding-3-small`. Evaluate alternatives based on your accuracy and cost needs.
- **Conversation management**: Creating/listing/deleting conversations. Build this in your Nuxt API routes.
- **Authentication**: Protecting the agent API endpoint. Use Nuxt middleware or SurrealDB's DEFINE ACCESS.
- **Rate limiting**: Throttling requests to the Claude API. Use the SDK's built-in retry (default 2 retries with backoff) or add your own.
- **Multi-agent coordination**: See `surrealdb-v3-realtime.md` for LIVE SELECT patterns between agents.
- **Spectron memory lifecycle**: See `surrealdb-v3-spectron.md` for working/semantic/episodic/procedural/preference memory schemas and patterns.

---

## Companion Files

- `surrealdb-v3-ai-patterns.md` - Context Layer Loop (SurrealQL), Hybrid RAG, Graph+Vector
- `surrealdb-v3-spectron.md` - Spectron memory schemas, bi-temporal versioning, multi-agent
- `surrealdb-v3-realtime.md` - LIVE SELECT agent coordination, task queues, reactive pipelines
- `../../docs/training-surrealdb-agents.md` - Hands-on walkthrough of the database patterns
