# Tauri 2 + Nuxt 4

## Metadata
- Last updated: 2026-02-25
- Version: 1.0
- Applies to: Tauri 2.x, Nuxt 4.x
- Changelog:
  - v1.0: Initial skill

## Overview

Tauri 2 lets you build desktop (and mobile) apps using a web frontend with a Rust
backend. Instead of bundling a full Chromium like Electron, Tauri uses the OS's built-in
webview, so apps are much smaller (often under 10 MB). In Scott's stack, Nuxt 4 runs as
the frontend inside Tauri's webview, while Rust handles system-level work like file
access, database connections, and OS integration. Think of it like a spreadsheet where
the visible cells and formatting are Nuxt (the UI), but the macros and data connections
running behind the scenes are Rust (the backend).

## Key Concepts

- **IPC (Inter-Process Communication)** — How the TypeScript frontend talks to the Rust
  backend. You call `invoke('command_name', { args })` from TypeScript, and Tauri routes
  it to a matching Rust function. Like calling a spreadsheet function that runs a macro
  behind the scenes and returns a value.

- **Commands** — Rust functions decorated with `#[tauri::command]` that the frontend can
  call. They receive typed parameters, do work, and return a result. All data crosses the
  boundary as JSON.

- **Capabilities (v2 security model)** — Tauri 2 locks everything down by default. Your
  app cannot read files, access the network, or use any OS feature unless you explicitly
  grant permission in a capabilities config file. This is the opposite of Electron, where
  everything is allowed by default.

- **Events** — A push-based communication channel from Rust to TypeScript. While commands
  are "frontend asks, backend answers," events let the backend push updates to the
  frontend without being asked. Useful for progress bars, background task updates, or
  database change notifications.

- **Managed State** — Tauri's way of sharing long-lived objects (like a database
  connection) across all commands. You create the object once at startup and register it
  with `app.manage()`, then any command can access it via a `State<>` parameter.

- **SSG (Static Site Generation)** — Nuxt must run in SSG mode (`nuxi generate`) for
  Tauri. There is no Node.js server inside a Tauri app, so server-side rendering is not
  an option. `nuxi generate` pre-renders all pages to static HTML/JS/CSS files that the
  webview loads directly.

## Patterns & Best Practices

### Project File Structure

```
my-app/
├── app/                    # Nuxt 4 app directory
│   ├── components/
│   ├── composables/
│   │   └── useTauri.ts     # Invoke wrapper composable
│   ├── layouts/
│   └── pages/
├── public/
├── src-tauri/              # Rust backend (Tauri manages this)
│   ├── capabilities/
│   │   └── default.json    # Permission grants
│   ├── src/
│   │   ├── lib.rs          # Commands and setup
│   │   └── main.rs         # Entry point (don't edit much)
│   ├── Cargo.toml
│   └── tauri.conf.json     # Tauri configuration
├── nuxt.config.ts
├── package.json
└── tsconfig.json
```

The `src-tauri/` folder lives alongside your Nuxt project, not inside it. Nuxt should
ignore this folder entirely (configured in nuxt.config.ts).

### Nuxt Configuration for Tauri

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // SSR must be off. Tauri loads static files from disk, not from a Node server.
  // This is like saving a spreadsheet as a PDF — it's a snapshot, not a live file.
  ssr: false,

  // Bind to all network interfaces so Tauri's dev process can reach the dev server.
  // '0' is shorthand for '0.0.0.0'. Without this, the dev server only listens on
  // localhost, which can cause connection issues on some systems.
  devServer: { host: '0' },

  vite: {
    // Prevents Vite from clearing the terminal, so you can still see Tauri's Rust
    // compiler output alongside the frontend logs.
    clearScreen: false,

    // Expose environment variables starting with VITE_ or TAURI_ to the frontend.
    // Tauri sets variables like TAURI_ENV_DEBUG that your app can read.
    envPrefix: ['VITE_', 'TAURI_'],

    server: {
      // If port 3000 is taken, Vite normally picks another port. strictPort makes it
      // fail instead, because tauri.conf.json is hardcoded to port 3000. If they
      // disagree, the app shows a blank screen.
      strictPort: true,
    },
  },

  // Tell Nuxt to skip everything in the Rust project folder. Without this, Nuxt's
  // file watcher tries to process .rs files and Cargo.toml, which causes errors.
  ignore: ['**/src-tauri/**'],
})
```

### Tauri Configuration

```json
// src-tauri/tauri.conf.json (build section)
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run generate",
    "devUrl": "http://localhost:3000",
    "frontendDist": "../dist"
  }
}
```

Key points:
- **beforeDevCommand** — Tauri starts `npm run dev` (the Nuxt dev server) automatically
  when you run `tauri dev`. You don't need two terminal tabs.
- **beforeBuildCommand** — Uses `npm run generate`, NOT `npm run build`. This is critical.
  `nuxi build` creates a Node.js server bundle; `nuxi generate` creates static files.
  Tauri needs static files. Using `build` here will produce a broken app.
- **devUrl** — Where Tauri looks for the frontend during development. Must match the port
  in Nuxt's dev server (and why `strictPort: true` matters).
- **frontendDist** — Where Tauri finds the built static files for production. `../dist` is
  relative to the `src-tauri/` folder, pointing to the Nuxt output directory.

### package.json Scripts

```json
{
  "scripts": {
    "dev": "nuxi dev",
    "build": "nuxi build",
    "generate": "nuxi generate",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

- Use `npm run tauri:dev` during development (starts both Nuxt and Tauri).
- Use `npm run tauri:build` for production (runs `nuxi generate`, then `cargo build
  --release`, then creates platform-specific installers like .dmg, .msi, or .deb).

### Writing Tauri Commands (Rust Side)

```rust
// src-tauri/src/lib.rs

// Commands must NOT be pub. Tauri's macro system handles visibility internally.
// Making them pub causes a compilation error.
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Commands that can fail should return Result with a String error.
// Raw error types (like std::io::Error) don't implement serde::Serialize,
// so you must convert them to strings.
#[tauri::command]
fn read_config(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

// Async commands work too. Add 'async' and Tauri runs them off the main thread.
#[tauri::command]
async fn fetch_data(url: String) -> Result<String, String> {
    reqwest::get(&url)
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())
}

// Register ALL commands in one place. generate_handler! must be called exactly once.
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            read_config,
            fetch_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Calling Commands (TypeScript Side)

```typescript
// app/composables/useTauri.ts
import { invoke } from '@tauri-apps/api/core'

export function useTauri() {
  /**
   * Generic invoke wrapper with error handling.
   * T is the return type you expect from the Rust command.
   */
  async function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
    try {
      return await invoke<T>(command, args)
    } catch (error) {
      // Tauri command errors come back as strings (from .map_err(|e| e.to_string()))
      const message = typeof error === 'string' ? error : String(error)
      console.error(`Tauri command "${command}" failed:`, message)
      throw new Error(message)
    }
  }

  return { call }
}
```

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
const { call } = useTauri()

const greeting = ref('')
const name = ref('Scott')

async function greet() {
  // Parameter names must match the Rust function signature EXACTLY.
  // Rust has fn greet(name: &str), so the key here must be "name".
  greeting.value = await call<string>('greet', { name: name.value })
}
</script>

<template>
  <div>
    <UInput v-model="name" placeholder="Enter your name" />
    <UButton @click="greet" label="Greet" />
    <p>{{ greeting }}</p>
  </div>
</template>
```

### Event System (Rust Pushes to TypeScript)

Use events when the backend needs to send updates without the frontend asking.

```rust
// Rust side: emitting events
use tauri::Emitter;

#[tauri::command]
async fn long_task(app: tauri::AppHandle) -> Result<String, String> {
    for i in 0..100 {
        // Emit progress updates to the frontend
        app.emit("task-progress", i).map_err(|e| e.to_string())?;
        std::thread::sleep(std::time::Duration::from_millis(50));
    }
    Ok("Done!".to_string())
}
```

```typescript
// TypeScript side: listening for events
import { listen } from '@tauri-apps/api/event'

const progress = ref(0)

// listen() returns an unlisten function. Always clean up in onUnmounted.
let unlisten: (() => void) | undefined

onMounted(async () => {
  unlisten = await listen<number>('task-progress', (event) => {
    progress.value = event.payload
  })
})

onUnmounted(() => {
  unlisten?.()
})
```

### Capabilities (Security Permissions)

Tauri 2 uses an allowlist-based security model. Nothing works unless you grant it.

```json
// src-tauri/capabilities/default.json
{
  "identifier": "default",
  "description": "Default permissions for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:default",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    {
      "identifier": "fs:scope",
      "allow": [
        { "path": "$APPDATA/**" },
        { "path": "$DOCUMENT/**" }
      ]
    },
    "shell:allow-open",
    "dialog:default"
  ]
}
```

Scope variables you can use:
| Variable | Points to | Example (macOS) |
|----------|-----------|-----------------|
| `$APPDATA` | App-specific data folder | `~/Library/Application Support/com.app.name` |
| `$DOCUMENT` | User's Documents folder | `~/Documents` |
| `$DOWNLOAD` | User's Downloads folder | `~/Downloads` |
| `$HOME` | User's home directory | `~` |
| `$DESKTOP` | User's Desktop folder | `~/Desktop` |
| `$TEMP` | Temporary files folder | `/tmp` |

Rules:
- **Deny takes precedence over allow.** If you allow `$DOCUMENT/**` but deny
  `$DOCUMENT/secrets/**`, the secrets folder is blocked even though it's inside Documents.
- Start with minimal permissions and add more as needed.
- Each plugin (fs, shell, dialog, etc.) has its own permission namespace.

### SurrealDB Embedded in Tauri

Use SurrealKV (pure Rust storage engine) for desktop apps. No separate database server
needed -- the database lives inside the app.

```rust
// src-tauri/src/lib.rs
use std::sync::Arc;
use surrealdb::Surreal;
use surrealdb::engine::local::SurrealKV;
use tauri::Manager;

// Store the DB connection as managed state so all commands can access it.
struct AppState {
    db: Surreal<surrealdb::engine::local::Db>,
}

#[tauri::command]
async fn get_records(
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<Vec<serde_json::Value>, String> {
    let records: Vec<serde_json::Value> = state
        .db
        .select("my_table")
        .await
        .map_err(|e| e.to_string())?;
    Ok(records)
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Get the app data directory for storing the database
            let app_data = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_data).expect("failed to create app data dir");

            let db_path = app_data.join("data.surrealkv");

            // Use tauri::async_runtime to run async code inside setup()
            let db = tauri::async_runtime::block_on(async {
                let db = Surreal::new::<SurrealKV>(db_path.to_str().unwrap())
                    .await
                    .expect("failed to create database");
                db.use_ns("app").use_db("main")
                    .await
                    .expect("failed to set namespace and database");
                db
            });

            // Register the database as managed state
            app.manage(Arc::new(AppState { db }));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_records])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Key points:
- **SurrealKV over RocksDB** — SurrealKV is pure Rust, so it cross-compiles easily to
  macOS, Windows, and Linux without needing C++ toolchains. RocksDB requires cmake and
  a C++ compiler, which complicates builds.
- **Arc wrapping** — The state must be wrapped in `Arc` (atomic reference counting) because
  multiple commands may access the database concurrently from different threads.
- **Setup hook** — Database initialization goes in `.setup()` because it runs once at app
  start, before any commands are handled. Like an `onMounted` that runs before the
  template is ready.

## Common Gotchas

### Blank screen on `tauri:dev`
**Symptom:** The app window opens but shows nothing.
**Cause:** Port mismatch. Nuxt started on a different port than `devUrl` in tauri.conf.json,
usually because port 3000 was already in use.
**Fix:** Make sure `strictPort: true` is set in nuxt.config.ts and that nothing else is
using port 3000. Kill stale processes with `lsof -ti:3000 | xargs kill`.

### Production build loads blank page
**Symptom:** `tauri:build` succeeds, app opens, but the page is white.
**Cause:** `beforeBuildCommand` is set to `npm run build` instead of `npm run generate`.
`nuxi build` produces a Node server bundle, not static files. Tauri can't serve Node.
**Fix:** Change `beforeBuildCommand` to `npm run generate` in tauri.conf.json.

### Command parameter name mismatch
**Symptom:** `invoke` call throws an error like "invalid args for command".
**Cause:** The JavaScript object keys don't match the Rust function parameter names.
Tauri matches by name, not by position.
**Fix:** If Rust has `fn save(file_path: String, content: String)`, the JS call must be
`invoke('save', { file_path: '...', content: '...' })`. Use snake_case to match Rust.

### Raw errors don't serialize
**Symptom:** Compile error: "the trait `Serialize` is not implemented for `std::io::Error`".
**Cause:** Tauri commands must return types that implement `serde::Serialize`. Most Rust
error types don't.
**Fix:** Always use `.map_err(|e| e.to_string())` to convert errors to strings.

### u64 values corrupt in JavaScript
**Symptom:** Large numbers from Rust come through as wrong values in TypeScript.
**Cause:** JavaScript `Number` maxes out at 2^53 (`Number.MAX_SAFE_INTEGER` = 9007199254740991).
Rust `u64` goes up to 2^64. Values above 2^53 lose precision when deserialized as
JSON numbers.
**Fix:** Use `String` instead of `u64`/`i64` in the Rust return type for large numbers,
then parse in TypeScript if needed.

### Commands marked as `pub` don't compile
**Symptom:** Compilation error related to visibility or duplicate symbols.
**Cause:** The `#[tauri::command]` macro handles function visibility internally. Adding
`pub` conflicts with it.
**Fix:** Remove `pub` from all `#[tauri::command]` functions.

### generate_handler! called multiple times
**Symptom:** Only some commands work, or strange runtime errors.
**Cause:** `generate_handler!` must be called exactly once with ALL commands listed.
Calling it multiple times or splitting commands across calls doesn't work.
**Fix:** List every command in a single `generate_handler![]` macro invocation.

### Capability not granted
**Symptom:** Runtime error: "not allowed" or "permission denied" from a Tauri API.
**Cause:** Tauri 2 denies everything by default. You must explicitly grant each capability.
**Fix:** Add the required permission to `src-tauri/capabilities/default.json`. Check the
Tauri v2 docs for the exact permission identifier for each API.

### Nuxt file watcher processing Rust files
**Symptom:** Strange errors on file save, or Nuxt restarting when you edit Rust code.
**Cause:** Nuxt's watcher picks up changes in `src-tauri/`.
**Fix:** Add `ignore: ['**/src-tauri/**']` to nuxt.config.ts.

## Examples

### Full command round-trip: save and load a note

**Rust:**
```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct Note {
    title: String,
    body: String,
}

#[tauri::command]
fn save_note(title: String, body: String) -> Result<(), String> {
    let note = Note { title, body };
    let json = serde_json::to_string(&note).map_err(|e| e.to_string())?;
    std::fs::write("note.json", json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_note() -> Result<Note, String> {
    let json = std::fs::read_to_string("note.json").map_err(|e| e.to_string())?;
    serde_json::from_str(&json).map_err(|e| e.to_string())
}
```

**TypeScript:**
```typescript
interface Note {
  title: string
  body: string
}

const { call } = useTauri()

// Save
await call<void>('save_note', { title: 'My Note', body: 'Hello world' })

// Load
const note = await call<Note>('load_note')
```

### Returning binary data from Rust

```rust
use tauri::ipc::Response;

#[tauri::command]
fn get_image(path: String) -> Result<Response, String> {
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    // Response wraps raw bytes. TypeScript receives an ArrayBuffer.
    Ok(Response::new(bytes))
}
```

```typescript
const buffer = await call<ArrayBuffer>('get_image', { path: '/path/to/image.png' })
const blob = new Blob([buffer])
const url = URL.createObjectURL(blob)
```

### Composable with loading and error state

```typescript
// app/composables/useTauriCommand.ts
export function useTauriCommand<T>(command: string) {
  const { call } = useTauri()
  const data = ref<T | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function execute(args?: Record<string, unknown>) {
    loading.value = true
    error.value = null
    try {
      data.value = await call<T>(command, args)
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, execute }
}
```

```vue
<script setup lang="ts">
const { data: notes, loading, execute: loadNotes } = useTauriCommand<Note[]>('get_notes')

onMounted(() => loadNotes())
</script>
```

## Integration Points

- **Nuxt UI v4** — Works normally inside Tauri. All 125+ components render in the
  webview. No special configuration needed. Toast notifications, modals, and forms
  all work as expected.

- **SurrealDB** — Embed SurrealKV directly in the Tauri backend (see pattern above).
  The frontend calls Tauri commands which query the database. This replaces the
  typical web pattern of HTTP requests to a SurrealDB server.

- **Pinia** — Use Pinia stores on the frontend as normal. Pinia actions can call
  `useTauri().call()` to fetch data from the Rust backend, keeping the same store
  pattern you'd use in a web app.

- **Tailwind CSS v4** — Works normally. Use CSS-first config (`@import "tailwindcss"`)
  as usual. The Tauri webview supports all modern CSS features.

- **n8n** — For desktop apps that need cloud sync or automation, the Tauri app can
  make HTTP requests to n8n webhooks. Use Tauri's HTTP plugin (with capability
  granted) or route through a Tauri command that uses `reqwest` in Rust.

## Resources

- Tauri v2 official docs: https://v2.tauri.app
- Tauri v2 command guide: https://v2.tauri.app/develop/calling-rust/
- Tauri v2 security capabilities: https://v2.tauri.app/security/capabilities/
- Tauri + Nuxt community template: https://github.com/nicepkg/tauri-nuxt
- SurrealDB Rust SDK: https://docs.surrealdb.com/sdk/rust
- Nuxt SSG (generate): https://nuxt.com/docs/getting-started/deployment#static-hosting
