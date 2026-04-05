# SurrealDB v3: Vector Search & Embeddings

> Extracted from `surrealdb-v3-master-reference.md` (sections 7, 9, and related).
> This file is self-contained. For the full reference, see the master file.

---

## HNSW Indexes

SurrealDB v3 uses HNSW (Hierarchical Navigable Small World) indexes for vector similarity search. MTREE indexes from v2 are removed in v3. Use HNSW for all vector work.

### Setup

```surql
DEFINE TABLE knowledge SCHEMAFULL;
DEFINE FIELD content ON knowledge TYPE string;
DEFINE FIELD embedding ON knowledge TYPE array;

DEFINE INDEX knowledge_vec ON knowledge FIELDS embedding
  HNSW DIMENSION 1536 TYPE F32 DIST COSINE;
```

### HNSW Parameters

| Param | Required | Default | Description |
|---|---|---|---|
| `DIMENSION` | Yes | - | Must match embedding size (1536 for OpenAI, 1024 for Cohere, etc.) |
| `TYPE` | No | F64 | Storage: F32, F64, I16, I32, I64 (F32 recommended for embeddings) |
| `DIST` | No | EUCLIDEAN | COSINE (text), EUCLIDEAN (spatial), MANHATTAN |
| `EFC` | No | 150 | Build exploration factor (higher = better index, slower build) |
| `M` | No | 12 | Max connections per node (higher = better accuracy, more memory) |

**Choosing DIST:** Use COSINE for text/document embeddings (direction matters more than magnitude). Use EUCLIDEAN for spatial data (actual distance matters). MANHATTAN is rarely needed.

**Choosing DIMENSION:** Must match your embedding model exactly:
- OpenAI `text-embedding-3-small`: 1536
- OpenAI `text-embedding-3-large`: 3072
- Cohere `embed-english-v3.0`: 1024
- Anthropic (via Voyage): 1024

---

## KNN Search Syntax

```surql
-- <|K, EF|> operator: K = results, EF = search breadth
-- K: how many results you want
-- EF: how wide to search (higher = more accurate, slower)
SELECT content, vector::distance::knn() AS dist
FROM knowledge
WHERE embedding <|5, 40|> $query_vector
ORDER BY dist ASC;
```

**What K and EF mean (spreadsheet analogy):**
- K is like saying "show me the top 5 rows"
- EF is like saying "but check 40 rows before picking the top 5" (higher EF = more thorough search)

### Alternative Syntax

```surql
SELECT *, vector::similarity::cosine(embedding, $search_vec) AS similarity
FROM knowledge
WHERE embedding <~5:COSINE:>$search_vec;
```

---

## Vector Functions

| Function | Purpose | Example |
|---|---|---|
| `vector::distance::knn()` | Distance from KNN search result | Use with `<\|K,EF\|>` operator |
| `vector::distance::cosine()` | Cosine distance between two vectors | `vector::distance::cosine($a, $b)` |
| `vector::distance::euclidean()` | Euclidean distance | `vector::distance::euclidean($a, $b)` |
| `vector::distance::manhattan()` | Manhattan distance | `vector::distance::manhattan($a, $b)` |
| `vector::similarity::cosine()` | Cosine similarity (1 = identical) | `vector::similarity::cosine($a, $b)` |
| `vector::normalize()` | Normalize to unit vector | `vector::normalize($vec)` |
| `vector::magnitude()` | Vector length | `vector::magnitude($vec)` |

---

## Graph + Vector Combo (Killer Feature)

This is what makes SurrealDB unique for AI: combine graph traversal with vector similarity in a single query. No other database does this natively.

```surql
-- "Find products similar to what this customer last purchased"
LET $last = (SELECT ->purchased->product FROM customer:scott ORDER BY at DESC LIMIT 1)[0];

SELECT *, vector::similarity::cosine($last.embedding, embedding) AS similarity
FROM product
WHERE embedding <|5, 40|> $last.embedding
ORDER BY similarity DESC;
```

### More Graph + Vector Patterns

```surql
-- "Find knowledge related to topics this user has explored"
LET $topics = SELECT ->explored->topic.embedding FROM user:scott;
FOR $topic_vec IN $topics {
  SELECT content, vector::similarity::cosine($topic_vec, embedding) AS relevance
  FROM knowledge
  WHERE embedding <|3, 40|> $topic_vec
  ORDER BY relevance DESC;
};

-- "Find similar items, excluding ones already seen"
LET $seen = SELECT ->viewed->item.id FROM user:scott;
SELECT * FROM item
WHERE embedding <|10, 50|> $query_vec
AND id NOT IN $seen
ORDER BY vector::distance::knn() ASC;
```

---

## Embedding Patterns for RAG

### Schema for a Knowledge Base

```surql
DEFINE TABLE knowledge SCHEMAFULL;
DEFINE FIELD content ON knowledge TYPE string;
DEFINE FIELD source ON knowledge TYPE string;
DEFINE FIELD chunk_index ON knowledge TYPE int;
DEFINE FIELD embedding ON knowledge TYPE array;
DEFINE FIELD metadata ON knowledge TYPE object FLEXIBLE;
DEFINE FIELD created_at ON knowledge TYPE datetime DEFAULT time::now() READONLY;

DEFINE INDEX knowledge_vec ON knowledge FIELDS embedding
  HNSW DIMENSION 1536 TYPE F32 DIST COSINE;

DEFINE INDEX knowledge_source ON knowledge FIELDS source;
```

### Inserting Embeddings (from JS SDK)

```typescript
import { Surreal, Table } from 'surrealdb';

// After generating embeddings via OpenAI/Voyage/Cohere
const chunks = documents.map((doc, i) => ({
  content: doc.text,
  source: doc.url,
  chunk_index: i,
  embedding: doc.embedding, // float array from embedding API
  metadata: { title: doc.title, section: doc.section }
}));

await db.insert(new Table('knowledge'), chunks);
```

### Querying (RAG retrieval step)

```typescript
// 1. Get query embedding from your embedding API
const queryEmbedding = await getEmbedding(userQuestion);

// 2. Search SurrealDB
const [results] = await db.query<[Knowledge[]]>(
  `SELECT content, source, vector::distance::knn() AS dist
   FROM knowledge
   WHERE embedding <|5, 40|> $vec
   ORDER BY dist ASC`,
  { vec: queryEmbedding }
);

// 3. Feed results to LLM as context
const context = results.map(r => r.content).join('\n\n');
```

---

## Performance Tips

1. **Use F32, not F64** for embeddings. Half the memory, negligible accuracy loss.
2. **REBUILD INDEX** after heavy write loads on HNSW indexes.
3. **EF tradeoff:** Start with EF = 40. Increase to 100+ for precision-critical use cases.
4. **EFC tradeoff:** Higher EFC = better index quality but slower builds. 150 (default) is fine for most cases.
5. **M tradeoff:** Higher M = better accuracy but more memory. 12 (default) works well up to ~1M vectors.
6. **Batch inserts:** Use `INSERT INTO knowledge [...]` for bulk loading, then `REBUILD INDEX`.
7. **Filter before vector search:** SurrealDB can combine WHERE clauses with vector search, narrowing the search space.

---

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| Dimension mismatch | Embedding size doesn't match DIMENSION in index | Check your embedding model's output size |
| MTREE not found | Using v2 syntax | MTREE removed in v3. Use HNSW |
| Slow vector search | EF too high or index needs rebuilding | Lower EF or run `REBUILD INDEX` |
| Empty results | Embeddings not stored as arrays | Ensure embedding field is `TYPE array` |
