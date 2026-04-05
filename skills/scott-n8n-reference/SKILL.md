---
name: scott:n8n-reference
description: |
  Complete n8n workflow automation reference. Use when the user mentions n8n,
  workflow automation, nodes, webhooks, Code node, expressions, or any
  n8n-related topic. Also trigger when the user asks about: writing JavaScript
  or Python in Code nodes, configuring HTTP Request nodes (auth headers, API
  keys, OAuth), connecting n8n to databases like SurrealDB or Postgres,
  debugging workflow errors or silent failures, expression syntax or evaluation
  errors, scheduled/cron workflows, AI agent workflows, error handling patterns,
  n8n-mcp tools, or validating workflow configuration. If the question involves
  automating a process and n8n is Scott's automation tool, this skill applies.
user_invocable: true
invocation_hint: /scott:n8n-reference - Complete n8n workflow reference (patterns, code nodes, expressions, validation)
section: reference
---

# n8n Complete Reference

## Quick Workflow Checklist
- [ ] Error handling on every workflow (Error Trigger node)
- [ ] Webhook paths are unique across all workflows
- [ ] Expressions use `={{ }}` format (note the `=` prefix)
- [ ] Node references use exact names: `$('Exact Node Name')`
- [ ] Code nodes return `[{ json: { ... } }]` format
- [ ] Webhook data accessed via `.body`: `$json.body.fieldName`

## Critical Gotchas

| Mistake | Fix |
|---------|-----|
| `{{ $json.field }}` in expression | `={{ $json.field }}` (needs `=` prefix) |
| `$json.fieldName` for webhook data | `$json.body.fieldName` (webhook nests under .body) |
| `$('Code in JavaScript')` after rename | Use the **current** node name, not the original |
| Returning `{ key: value }` from Code node | Return `[{ json: { key: value } }]` (array of objects with json key) |
| Using `{{ }}` inside Code node | Use regular JavaScript - expressions are for node fields only |

## Topic Reference

Use the routing table below to find the right sub-file for your task:

| If you need to... | Read this file |
|--------------------|---------------|
| **Choose a workflow pattern** (webhook, API, DB, AI, scheduled) | [workflow-patterns.md](workflow-patterns.md) |
| **Write JavaScript** in a Code node | [code-javascript.md](code-javascript.md) |
| **Write Python** in a Code node | [code-python.md](code-python.md) |
| **Write an expression** (`={{ }}` syntax) | [expressions.md](expressions.md) |
| **Configure a node** (operations, properties, dependencies) | [node-configuration.md](node-configuration.md) |
| **Fix a validation error** or understand validation profiles | [validation.md](validation.md) |
| **Use n8n-mcp tools** (search nodes, create workflows, etc.) | [mcp-tools.md](mcp-tools.md) |
| **Decide when to use n8n** vs SurrealDB events, Tauri, or Nuxt routes | [n8n-integration-guide.md](n8n-integration-guide.md) |

## Deep Dive Sub-Files

Each topic has additional detail files for specific subtopics:

### Workflow Patterns
- [workflow-webhook.md](workflow-webhook.md) - Webhook processing patterns
- [workflow-http-api.md](workflow-http-api.md) - HTTP API integration
- [workflow-database.md](workflow-database.md) - Database operations
- [workflow-ai-agent.md](workflow-ai-agent.md) - AI agent workflows
- [workflow-scheduled.md](workflow-scheduled.md) - Scheduled/cron tasks

### Code Nodes (JavaScript)
- [code-javascript-data.md](code-javascript-data.md) - Data access patterns ($input, $node)
- [code-javascript-errors.md](code-javascript-errors.md) - Top 5 errors and fixes
- [code-javascript-patterns.md](code-javascript-patterns.md) - 10 production patterns
- [code-javascript-builtins.md](code-javascript-builtins.md) - Built-in functions (httpRequest, DateTime, etc.)

### Code Nodes (Python)
- [code-python-data.md](code-python-data.md) - Data access patterns (_input, _node)
- [code-python-errors.md](code-python-errors.md) - Top 5 Python errors
- [code-python-patterns.md](code-python-patterns.md) - 10 production patterns
- [code-python-stdlib.md](code-python-stdlib.md) - Available standard library modules

### Expressions
- [expressions-examples.md](expressions-examples.md) - 10 real working examples
- [expressions-mistakes.md](expressions-mistakes.md) - 15 common expression errors

### Node Configuration
- [node-operations.md](node-operations.md) - Patterns by node type (HTTP, Slack, Gmail, etc.)
- [node-dependencies.md](node-dependencies.md) - Property dependencies and displayOptions

### Validation
- [validation-errors.md](validation-errors.md) - Complete error type catalog
- [validation-false-positives.md](validation-false-positives.md) - When warnings are OK to ignore

### MCP Tools
- [mcp-search.md](mcp-search.md) - Node search and discovery tools
- [mcp-validation.md](mcp-validation.md) - Configuration validation tools
- [mcp-workflow.md](mcp-workflow.md) - Workflow management tools

## Common Error Quick Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| Node reference not found | `$('NodeName')` uses wrong name | Check exact node name in workflow |
| Expression evaluation failed | Missing `=` prefix | Use `={{ $json.field }}` not `{{ $json.field }}` |
| Code node returns nothing | Missing return statement | Add `return [{ json: { ... } }]` |
| Webhook data undefined | Accessing `$json.field` directly | Use `$json.body.field` for webhook data |
| Validation passes but execution fails | Stale node references | Update all `$('...')` to current node names |
| ModuleNotFoundError (Python) | Importing external library | Only stdlib available - use JS for external APIs |
