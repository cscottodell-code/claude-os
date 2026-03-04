# Rust Tauri Commands

## Metadata
- Last updated: 2026-02-25
- Version: 1.0
- Applies to: Tauri 2.x
- Changelog:
  - v1.0: Initial skill

## Overview
Tauri commands are Rust functions that the frontend (TypeScript/Vue) can call via
IPC (Inter-Process Communication). They're the bridge between your Nuxt UI and
the native Rust backend. Think of them like API endpoints, but instead of HTTP
requests, they use Tauri's fast IPC channel.

Every desktop app in Scott's stack uses Tauri commands for data operations,
file access, system info, and anything that needs native capabilities.

## Key Concepts

- **Command:** A Rust function decorated with `#[tauri::command]` that the frontend can call
- **invoke():** The TypeScript function that calls a Rust command
- **IPC:** The communication channel between frontend and backend (uses JSON serialization)
- **State:** Shared data (like a database connection) that commands can access
- **serde:** The Rust library that converts Rust types to/from JSON for IPC

## Defining a Command in Rust

### Basic command
```rust
// src-tauri/src/lib.rs (or a separate commands/ file)

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

### Command with multiple parameters
```rust
#[derive(serde::Serialize, serde::Deserialize)]
struct User {
    name: String,
    email: String,
    age: u32,
}

#[tauri::command]
fn create_user(name: String, email: String, age: u32) -> User {
    User { name, email, age }
}
```

### Async command (most common — use for all database operations)
```rust
#[tauri::command]
async fn get_claims(db: tauri::State<'_, Db>) -> Result<Vec<serde_json::Value>, String> {
    let mut result = db
        .query("SELECT * FROM claim ORDER BY created_at DESC")
        .await
        .map_err(|e| e.to_string())?;

    let claims: Vec<serde_json::Value> = result
        .take(0)
        .map_err(|e| e.to_string())?;

    Ok(claims)
}
```

### Command with error handling (recommended pattern)
```rust
// ALWAYS return Result<T, String> for commands that can fail.
// The String error becomes a rejected Promise on the TypeScript side.

#[tauri::command]
async fn save_claim(
    db: tauri::State<'_, Db>,
    name: String,
    address: String,
) -> Result<serde_json::Value, String> {
    let mut result = db
        .query("CREATE claim SET name = $name, address = $address, created_at = time::now()")
        .bind(("name", &name))
        .bind(("address", &address))
        .await
        .map_err(|e| e.to_string())?;

    let claim: Option<serde_json::Value> = result
        .take(0)
        .map_err(|e| e.to_string())?;

    claim.ok_or_else(|| "Failed to create claim".to_string())
}
```

## Registering Commands

All commands must be registered in a single `generate_handler!` call:

```rust
// src-tauri/src/lib.rs

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Database setup here (see State Management below)
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            create_user,
            get_claims,
            save_claim,
            update_claim,
            delete_claim,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Important rules:**
- Only ONE `invoke_handler` call — the last one wins
- Commands must NOT be `pub` (Tauri's macro generates glue code that requires private functions)
- Command names used in `invoke()` on the TypeScript side must match the Rust function name exactly

## Calling Commands from TypeScript

```typescript
// IMPORTANT: In Tauri v2, invoke is in @tauri-apps/api/core
import { invoke } from '@tauri-apps/api/core'

// Basic call
const greeting = await invoke<string>('greet', { name: 'Scott' })

// Call with typed response
interface User {
  name: string
  email: string
  age: number
}
const user = await invoke<User>('create_user', {
  name: 'Scott',
  email: 'scott@example.com',
  age: 35,
})

// Error handling — Rust Result::Err becomes a rejected Promise
try {
  const claims = await invoke<any[]>('get_claims')
} catch (error) {
  // error is the String from Rust's Err variant
  console.error('Failed to get claims:', error)
}
```

### Vue composable wrapper (recommended)
```typescript
// composables/useDatabase.ts
import { invoke } from '@tauri-apps/api/core'

export function useDatabase() {
  async function getClaims() {
    return await invoke<Claim[]>('get_claims')
  }

  async function saveClaim(name: string, address: string) {
    return await invoke<Claim>('save_claim', { name, address })
  }

  async function updateClaim(id: string, data: Partial<Claim>) {
    return await invoke<Claim>('update_claim', { id, ...data })
  }

  async function deleteClaim(id: string) {
    return await invoke<void>('delete_claim', { id })
  }

  return { getClaims, saveClaim, updateClaim, deleteClaim }
}
```

## Serialization Between Rust and TypeScript

Everything crosses the IPC bridge as JSON (via serde).

### What works
| Rust Type | JSON/TypeScript Type |
|-----------|---------------------|
| `String`, `&str` | `string` |
| `u8`, `u16`, `u32`, `i32`, `f32`, `f64` | `number` |
| `bool` | `boolean` |
| `Vec<T>` | `T[]` |
| `HashMap<String, T>` | `{ [key: string]: T }` |
| `Option<T>` | `T \| null` |
| `()` (unit) | `null` |
| Struct with `#[derive(Serialize)]` | `object` |

### What doesn't work (or needs workarounds)
| Rust Type | Problem | Fix |
|-----------|---------|-----|
| `u64`, `i64` | Exceeds JS `Number.MAX_SAFE_INTEGER` | Use `String` |
| `std::io::Error` | Doesn't implement `Serialize` | `.map_err(\|e\| e.to_string())` |
| Large `Vec<u8>` | Slow JSON encoding | Use `tauri::ipc::Response` |
| Recursive types | serde can't handle them | Flatten or use IDs |

### Binary data (files, images)
```rust
use tauri::ipc::Response;

#[tauri::command]
fn read_file(path: String) -> Result<Response, String> {
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    Ok(Response::new(bytes))  // Sent as ArrayBuffer to JS
}
```

## State Management

Use Tauri's managed state to share data (like database connections) across commands.

```rust
use surrealdb::Surreal;
use surrealdb::engine::local::SurrealKV;
use std::sync::Arc;
use tauri::Manager;

// Type alias for the database state
type Db = Arc<Surreal<surrealdb::engine::local::Db>>;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data = app.path().app_data_dir()
                .expect("failed to get app data dir");
            std::fs::create_dir_all(&app_data)
                .expect("failed to create app data dir");
            let db_path = app_data.join("app.db");

            tauri::async_runtime::block_on(async {
                let db = Surreal::new::<SurrealKV>(db_path)
                    .await
                    .expect("failed to start SurrealDB");
                db.use_ns("app").use_db("main")
                    .await
                    .expect("failed to select ns/db");

                // Make the DB available to all commands
                app.manage(Arc::new(db));
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![/* commands */])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Access state in any command via tauri::State<'_, T>
#[tauri::command]
async fn my_command(db: tauri::State<'_, Db>) -> Result<String, String> {
    // Use db here...
    Ok("done".into())
}
```

## Error Handling Across the IPC Boundary

```rust
// Pattern: Result<T, String> for all fallible commands
// The String becomes the error message in the rejected Promise

#[tauri::command]
async fn risky_operation(db: tauri::State<'_, Db>) -> Result<String, String> {
    // Convert any error to String with map_err
    let result = db.query("SELECT * FROM user")
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    // Use ok_or for Option -> Result conversion
    let first = result.take::<Option<serde_json::Value>>(0)
        .map_err(|e| e.to_string())?
        .ok_or("No results found")?;

    Ok(serde_json::to_string(&first).map_err(|e| e.to_string())?)
}
```

TypeScript side:
```typescript
try {
  const result = await invoke<string>('risky_operation')
} catch (error) {
  // error is the String from Rust
  toast.add({
    title: 'Error',
    description: String(error),
    color: 'error'
  })
}
```

## Events (Rust → TypeScript Push)

For push-style communication (progress updates, real-time data, notifications):

```rust
// Rust: emit event to frontend
use tauri::Emitter;

#[tauri::command]
async fn long_process(app: tauri::AppHandle) -> Result<(), String> {
    for i in 0..100 {
        app.emit("progress", i).map_err(|e| e.to_string())?;
        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    }
    Ok(())
}
```

```typescript
// TypeScript: listen for events
import { listen } from '@tauri-apps/api/event'

const unlisten = await listen<number>('progress', (event) => {
  console.log('Progress:', event.payload, '%')
})

// Clean up when done
unlisten()
```

## Common Command Patterns

### CRUD operations for a table
```rust
#[tauri::command]
async fn list_claims(db: tauri::State<'_, Db>) -> Result<Vec<serde_json::Value>, String> {
    let mut result = db.query("SELECT * FROM claim ORDER BY created_at DESC")
        .await.map_err(|e| e.to_string())?;
    result.take(0).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_claim(db: tauri::State<'_, Db>, id: String) -> Result<serde_json::Value, String> {
    let mut result = db.query("SELECT * FROM type::record($id)")
        .bind(("id", &id))
        .await.map_err(|e| e.to_string())?;
    let claim: Option<serde_json::Value> = result.take(0).map_err(|e| e.to_string())?;
    claim.ok_or_else(|| "Claim not found".into())
}

#[tauri::command]
async fn create_claim(
    db: tauri::State<'_, Db>,
    name: String,
    address: String,
) -> Result<serde_json::Value, String> {
    let mut result = db
        .query("CREATE claim SET name = $name, address = $address, status = 'new', created_at = time::now()")
        .bind(("name", &name))
        .bind(("address", &address))
        .await.map_err(|e| e.to_string())?;
    let claim: Option<serde_json::Value> = result.take(0).map_err(|e| e.to_string())?;
    claim.ok_or_else(|| "Failed to create claim".into())
}

#[tauri::command]
async fn delete_claim(db: tauri::State<'_, Db>, id: String) -> Result<(), String> {
    db.query("DELETE type::record($id)")
        .bind(("id", &id))
        .await.map_err(|e| e.to_string())?;
    Ok(())
}
```

### File system operations
```rust
#[tauri::command]
async fn get_app_data_path(app: tauri::AppHandle) -> Result<String, String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}
```

## Common Gotchas

1. **Commands must NOT be `pub`** — Tauri's macro generates private glue code.
   Adding `pub` causes compilation errors.

2. **Only one invoke_handler** — If you call `.invoke_handler()` twice, only the
   last one is used. Put ALL commands in one `generate_handler![]`.

3. **Parameter names must match exactly** — The keys in the TypeScript `invoke()`
   object must match the Rust function parameter names. `{ userName: 'Scott' }`
   won't work if the Rust parameter is `name`.

4. **Import from @tauri-apps/api/core** — In Tauri v2, `invoke` moved from
   `@tauri-apps/api/tauri` to `@tauri-apps/api/core`. The old import won't work.

5. **Async commands need `async`** — If your command does any I/O (database, file,
   network), make it `async`. Sync commands block the main thread.

6. **Map all errors to String** — Rust errors don't implement `Serialize`. Always
   use `.map_err(|e| e.to_string())` to convert to a serializable String.

## Resources
- Tauri commands: https://v2.tauri.app/develop/calling-rust/
- State management: https://v2.tauri.app/develop/state-management/
- Events: https://v2.tauri.app/develop/calling-frontend/
- IPC: https://v2.tauri.app/concept/inter-process-communication/
