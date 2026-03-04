# Error Handling

## Metadata
- Last updated: 2026-02-25
- Version: 1.0
- Applies to: Full stack (Nuxt 4, Tauri 2, SurrealDB v3)
- Changelog:
  - v1.0: Initial skill

## Overview
Error handling patterns for every layer of Scott's stack. The goal: users always
see helpful, plain-English messages. Developers always see enough detail to debug.
Nothing fails silently.

## The Golden Rule
**Every user-facing mutation gets a try/catch with a toast.** No exceptions.

```typescript
const toast = useToast()

async function saveClaim() {
  try {
    await db.saveClaim(claimData)
    toast.add({ title: 'Claim saved', color: 'success' })
  } catch (error) {
    toast.add({
      title: 'Failed to save claim',
      description: String(error),
      color: 'error'
    })
  }
}
```

## Frontend Error Handling (Nuxt)

### Page-level errors
Nuxt has built-in error handling for page navigation errors:

```vue
<!-- app/error.vue — shown when a page throws an error -->
<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message: string } }>()

function handleClear() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <h1 class="text-4xl font-bold">{{ error.statusCode }}</h1>
    <p class="text-muted mt-2">{{ error.message }}</p>
    <UButton class="mt-4" label="Go Home" @click="handleClear" />
  </div>
</template>
```

### Component-level errors
Use `try/catch` in composables and show errors via toast:

```typescript
// composables/useDatabase.ts
export function useDatabase() {
  const toast = useToast()
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function execute<T>(fn: () => Promise<T>, errorMessage: string): Promise<T | null> {
    loading.value = true
    error.value = null
    try {
      const result = await fn()
      return result
    } catch (e) {
      error.value = String(e)
      toast.add({
        title: errorMessage,
        description: String(e),
        color: 'error'
      })
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, error, execute }
}
```

### Loading states
Always show loading state during async operations:

```vue
<script setup lang="ts">
const loading = ref(false)
const claims = ref<Claim[]>([])

async function loadClaims() {
  loading.value = true
  try {
    claims.value = await db.getClaims()
  } catch (error) {
    toast.add({ title: 'Failed to load claims', description: String(error), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Loading skeleton -->
  <USkeleton v-if="loading" class="h-64 w-full" />

  <!-- Empty state -->
  <UEmpty v-else-if="claims.length === 0" title="No claims yet" />

  <!-- Data -->
  <UTable v-else :data="claims" :columns="columns" />
</template>
```

## SurrealQL Error Handling

### v3: Non-existing tables throw errors
In v2, querying a non-existing table returned `[]`. In v3, it throws an error.

```sql
-- This will ERROR if the 'user' table doesn't exist:
SELECT * FROM user;

-- Fix: Always DEFINE TABLE first, or handle the error in your app code
```

### Handle gracefully in your app:
```typescript
async function getClaims(): Promise<Claim[]> {
  try {
    const result = await db.query('SELECT * FROM claim ORDER BY created_at DESC')
    return result[0] ?? []
  } catch (error) {
    // Table might not exist yet (first run)
    if (String(error).includes('table') && String(error).includes('not found')) {
      return []
    }
    throw error  // Re-throw unexpected errors
  }
}
```

### Validation errors
Use ASSERT on fields to catch bad data at the database level:

```sql
DEFINE FIELD email ON user TYPE string
    ASSERT string::is::email($value);

DEFINE FIELD status ON claim TYPE string
    ASSERT $value IN ['new', 'in_progress', 'complete'];
```

When validation fails, SurrealDB returns an error message that includes the
assertion. Catch these and show user-friendly messages:

```typescript
try {
  await db.query('CREATE user SET email = $email', { email: 'not-an-email' })
} catch (error) {
  const msg = String(error)
  if (msg.includes('string::is::email')) {
    toast.add({ title: 'Invalid email address', color: 'error' })
  } else {
    toast.add({ title: 'Failed to create user', description: msg, color: 'error' })
  }
}
```

## Tauri Command Error Handling

### Rust side: Always return Result<T, String>
```rust
#[tauri::command]
async fn save_data(db: tauri::State<'_, Db>, data: String) -> Result<String, String> {
    // Convert any error to String
    let result = db.query("CREATE record SET data = $data")
        .bind(("data", &data))
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    Ok("Saved".into())
}
```

### TypeScript side: Catch the rejected Promise
```typescript
try {
  await invoke('save_data', { data: 'hello' })
} catch (error) {
  // error is the String from Rust's Err variant
  toast.add({
    title: 'Save failed',
    description: String(error),
    color: 'error'
  })
}
```

### Common Tauri errors and what they mean
| Error | Likely Cause | Fix |
|-------|-------------|-----|
| "command not found" | Command not in `generate_handler![]` | Add it to the handler list |
| "invalid args" | Parameter names don't match | Check Rust fn params match JS object keys |
| "failed to serialize" | Return type doesn't implement Serialize | Add `#[derive(Serialize)]` |
| "Database error" | SurrealDB query failed | Check the query syntax and bindings |

## User-Facing Error Messages

### Rules for error messages
1. **Plain English** — "Couldn't save your changes" not "WRITE_FAILED_ERR_0x42"
2. **Actionable** — Tell the user what to do next: "Try again" or "Check your connection"
3. **Specific** — "Email address is invalid" not "Validation error"
4. **Don't blame the user** — "We couldn't connect" not "You have no internet"

### Toast patterns
```typescript
const toast = useToast()

// Success
toast.add({ title: 'Saved', description: 'Your changes were saved.', color: 'success' })

// Error with description
toast.add({
  title: 'Couldn\'t save',
  description: 'Check your connection and try again.',
  color: 'error'
})

// Warning
toast.add({
  title: 'Almost full',
  description: 'You\'re approaching the storage limit.',
  color: 'warning'
})

// Info
toast.add({ title: 'Syncing...', description: 'Your data is being synced.', color: 'info' })
```

## Logging Patterns

### Frontend (browser console)
```typescript
// Development only — these get stripped in production builds
if (import.meta.dev) {
  console.log('[DB] Query:', query)
  console.error('[DB] Error:', error)
}
```

### Tauri (Rust)
```rust
use log::{info, warn, error};

#[tauri::command]
async fn risky_operation(db: tauri::State<'_, Db>) -> Result<String, String> {
    info!("Starting risky operation");

    match db.query("SELECT * FROM user").await {
        Ok(result) => {
            info!("Operation succeeded");
            Ok("done".into())
        }
        Err(e) => {
            error!("Operation failed: {}", e);
            Err(format!("Operation failed: {}", e))
        }
    }
}
```

## Common Gotchas

1. **Don't swallow errors** — `catch (e) {}` with an empty block hides bugs.
   Always log or display the error.

2. **Don't show raw error messages to users** — `error.stack` or database error
   strings are confusing. Translate to plain English.

3. **Handle the "first run" case** — When the database is empty, queries return
   empty results (not errors). Show empty states, not broken UIs.

4. **Loading states prevent double-clicks** — Set `loading = true` before async
   operations. Disable buttons while loading to prevent duplicate submissions.

5. **v3 table errors** — Remember that v3 throws on non-existing tables. Initialize
   your schema before querying.

## Integration Points
- **Frontend → Toast:** Use `useToast()` for all user-facing errors
- **Frontend → Nuxt error page:** `app/error.vue` for navigation/page errors
- **Tauri → Result<T, String>:** All commands return Result, errors become rejected Promises
- **SurrealDB → ASSERT:** Field-level validation at the database layer
- **SurrealDB → PERMISSIONS:** Access control errors when unauthorized
