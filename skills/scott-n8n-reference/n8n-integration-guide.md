# n8n Integration

## Metadata
- Last updated: 2026-02-25
- Version: 1.0
- Applies to: n8n (current)
- Changelog:
  - v1.0: Initial skill

## Overview
n8n is a workflow automation tool. In Scott's stack, it's used ONLY when it's truly
the best option — meaning multi-system orchestration, scheduled tasks, or receiving
webhooks from external services. It is NOT the default choice for app logic.

**Rule of thumb:** If SurrealDB events, Tauri, or simple HTTP calls can handle it,
don't use n8n. Use n8n when you need to connect multiple external systems or run
scheduled background jobs.

## When to Use n8n

| Use Case | Example | Why n8n? |
|----------|---------|----------|
| Multi-system orchestration | "When a claim is approved, update CRM, send email, and create invoice" | Connects 3+ systems |
| Scheduled tasks | "Every Monday at 8am, send a summary email" | Cron scheduling |
| Webhook receivers | "When Stripe sends a payment webhook, update our database" | External service integration |
| Data sync | "Sync contacts between Google Sheets and our app" | Cross-system data flow |

## When NOT to Use n8n

| Use Case | Better Alternative | Why? |
|----------|-------------------|------|
| Database triggers | SurrealDB DEFINE EVENT | Stays in the database layer, no network hop |
| File operations | Tauri commands (Rust) | Native, fast, no external dependency |
| Simple HTTP calls | Nuxt server routes or Tauri HTTP client | Simpler, fewer moving parts |
| Real-time updates | SurrealDB LIVE SELECT | Built-in, no middleware needed |
| Form submissions | Nuxt server API routes | Direct, no orchestration needed |

## n8n Instances

| Instance | URL | Owner | Purpose |
|----------|-----|-------|---------|
| Prototyping | https://banc-r.app.n8n.cloud/ | Brett | Building and testing workflows |
| Production | https://events.advosy.app/ | Gary | Live Advosy workflows |

**Important:** Build and test on Brett's instance. Only move to Gary's instance when
the workflow is production-ready and has been handed off.

## Calling n8n Webhooks from Tauri Apps

When a desktop app needs to trigger an n8n workflow:

```rust
// src-tauri/src/commands/webhooks.rs
use reqwest;

#[tauri::command]
async fn trigger_workflow(data: serde_json::Value) -> Result<String, String> {
    let client = reqwest::Client::new();
    let response = client
        .post("https://banc-r.app.n8n.cloud/webhook/your-webhook-id")
        .json(&data)
        .send()
        .await
        .map_err(|e| format!("Webhook failed: {}", e))?;

    let body = response.text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    Ok(body)
}
```

TypeScript side:
```typescript
const { trigger } = useDatabase() // or a dedicated composable

try {
  await invoke('trigger_workflow', {
    data: { claimId: 'claim:abc123', action: 'approve' }
  })
  toast.add({ title: 'Workflow triggered', color: 'success' })
} catch (error) {
  toast.add({ title: 'Failed to trigger workflow', description: String(error), color: 'error' })
}
```

## Calling n8n Webhooks from Nuxt Server Routes

When a web app needs to trigger an n8n workflow:

```typescript
// server/api/trigger-workflow.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const response = await $fetch('https://banc-r.app.n8n.cloud/webhook/your-webhook-id', {
    method: 'POST',
    body: {
      ...body,
      source: 'web-app',
      timestamp: new Date().toISOString()
    }
  })

  return response
})
```

Component:
```typescript
async function triggerWorkflow(claimId: string) {
  try {
    await $fetch('/api/trigger-workflow', {
      method: 'POST',
      body: { claimId, action: 'approve' }
    })
    toast.add({ title: 'Workflow triggered', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Failed', description: String(error), color: 'error' })
  }
}
```

## Webhook Patterns

### Receiving data from n8n into your app
n8n can call your app's API endpoints when a workflow completes:

```typescript
// server/api/webhook/claim-updated.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate the webhook (check a shared secret)
  const secret = event.headers.get('x-webhook-secret')
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Process the data
  // e.g., update SurrealDB, send a notification, etc.

  return { received: true }
})
```

### Webhook security
Always validate incoming webhooks:
1. Use a shared secret in headers
2. Validate the request body structure
3. Log webhook events for debugging

## Common Gotchas

1. **Don't over-use n8n** — It's tempting to route everything through n8n because
   it's visual and easy. But every n8n hop adds latency and a failure point.
   Keep app logic in the app.

2. **Webhook URLs change between instances** — The webhook ID on Brett's instance
   is different from Gary's. Store webhook URLs in environment variables, not hardcoded.

3. **n8n Cloud has rate limits** — Don't fire 100 webhooks per second. Batch operations
   when possible.

4. **Test on prototyping instance first** — Always build and test on Brett's n8n
   before moving to Gary's production instance.

5. **Error handling is critical** — n8n workflows can fail silently. Always check
   the response from webhook calls and handle errors in your app.

## Integration Points
- **Tauri apps** → Call n8n webhooks via Rust HTTP client (reqwest)
- **Web apps** → Call n8n webhooks via Nuxt server routes ($fetch)
- **n8n → Your app** → n8n calls your API endpoints via HTTP Request node
- **n8n → SurrealDB** → n8n can query SurrealDB directly via HTTP Request node

## Resources
- n8n documentation: https://docs.n8n.io
- Brett's instance: https://banc-r.app.n8n.cloud/
- Gary's instance: https://events.advosy.app/
