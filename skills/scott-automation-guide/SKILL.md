---
name: scott:automation-guide
description: |
  Industry best practices for building reliable automations. Use as a companion
  to scott-n8n-complete when DESIGNING a new automation from scratch — covers
  reliability principles (idempotency, error handling, validation), performance
  optimization (batching, caching, rate limiting), monitoring/alerting strategy,
  and testing methodology. While scott-n8n-complete handles n8n-specific syntax
  and node configuration, THIS skill handles the architectural best practices
  that apply regardless of platform. Use when planning error handling strategy,
  setting up monitoring, writing test plans, or creating documentation templates
  for automations.
user_invocable: false
---

# Automation Best Practices

## Reliability Principles

### 1. Idempotency
Make operations safe to retry without side effects.

**Bad**:
```
CREATE order SET total = total + 100
```

**Good**:
```
UPSERT order:123 SET total = 100, updated_at = time::now()
```

Tips:
- Use unique identifiers (not auto-increment)
- Check for duplicates before creating
- Use upsert operations where possible

### 2. Error Handling
Every automation should handle failures gracefully.

**Required components**:
1. Try/catch or error trigger nodes
2. Error logging to database
3. Alert notification (Slack/email)
4. Original data preservation for retry

**Error log schema**:
```surql
CREATE error_logs SET
  workflow = "payment-processor",
  error_type = "api_timeout",
  error_message = $error.message,
  input_data = $input,
  timestamp = time::now(),
  resolved = false;
```

### 3. Data Validation
Validate inputs before processing.

**Validation checklist**:
- [ ] Required fields present
- [ ] Data types correct
- [ ] Values within expected ranges
- [ ] Email/phone formats valid
- [ ] No malicious content

**Example n8n validation**:
```
IF Node:
- Condition: ={{ $json.email }} is not empty
- Condition: ={{ $json.email }}.includes('@')
→ True: Continue processing
→ False: Return validation error
```
Note: n8n expressions require the `=` prefix: `={{ $json.field }}` not `{{ $json.field }}`

## Performance Optimization

### 1. Batch Processing
Process data in batches, not one at a time.

**Recommended batch sizes**:
- API calls: 50-100 items
- Database inserts: 100-500 items
- Email sends: 50 items (rate limits)

### 2. Caching
Cache frequently accessed data.

```surql
-- Store in a cache table with TTL
CREATE cache:user_list SET
  data = $users,
  expires_at = time::now() + 1h;

-- Query with TTL check
SELECT data FROM cache:user_list
WHERE expires_at > time::now();
```

### 3. Rate Limiting
Respect API rate limits.

- Add delays between API calls
- Implement exponential backoff on failures
- Track API usage in database
- Set up alerts before hitting limits

## Monitoring & Alerting

### Key Metrics to Track
1. **Execution count**: How often does it run?
2. **Success rate**: What % succeed?
3. **Execution time**: How long does it take?
4. **Error rate**: How often does it fail?
5. **Data volume**: How much data processed?

### Alert Thresholds
- Error rate > 5%: Warning
- Error rate > 20%: Critical
- Execution time > 2x normal: Warning
- No executions in expected window: Alert

### Logging Best Practices
```surql
CREATE execution_log SET
  workflow_id = "payment-sync",
  started_at = time::now(),
  status = "running",
  input_count = 150;

-- On completion
UPDATE execution_log:xyz SET
  completed_at = time::now(),
  status = "success",
  output_count = 148,
  duration_ms = 4500;
```

## Testing Strategy

### Test Levels
1. **Unit test**: Test individual nodes
2. **Integration test**: Test full workflow with test data
3. **Smoke test**: Quick test in production
4. **Load test**: Test with realistic volume

### Test Data Guidelines
- Create dedicated test namespace in SurrealDB
- Use realistic but fake data
- Include edge cases (empty, null, special chars)
- Test with production-like volume

### Pre-Deployment Checklist
- [ ] All test cases pass
- [ ] Error handling verified
- [ ] Notifications configured
- [ ] Monitoring in place
- [ ] Rollback plan documented
- [ ] Client notified

## Documentation Requirements

### Per Automation
1. **Purpose**: What does it do and why?
2. **Trigger**: What starts it?
3. **Data flow**: Input → Process → Output
4. **Dependencies**: What external services?
5. **Error handling**: How are failures managed?
6. **Monitoring**: How to check health?
7. **Contact**: Who owns this?

### Template
```markdown
# Automation: [Name]

## Purpose
[1-2 sentences]

## Trigger
- Type: [Webhook/Schedule/Manual]
- Details: [Cron expression or endpoint]

## Data Flow
1. Receive [input]
2. Process [transformation]
3. Store in [database]
4. Notify via [channel]

## Error Handling
- Errors logged to: [table]
- Alerts sent to: [Slack channel]

## Monitoring
- Dashboard: [link]
- Key metric: [what to watch]

## Owner
- Primary: [name]
- Backup: [name]
```

---

## Related Skills

- **n8n-complete** — For n8n-specific workflow patterns, Code node syntax, and expression rules
- **surrealdb-patterns** — For SurrealDB schema design and query patterns used in automations
