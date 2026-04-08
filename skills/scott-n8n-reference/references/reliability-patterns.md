# Reliability Patterns for Automations

> Extracted from the `scott-automation-guide` skill (consolidated April 2026).
> Platform-agnostic principles that apply to any automation system.

## Idempotency

Make operations safe to retry without side effects.

- Use unique identifiers (not auto-increment)
- Check for duplicates before creating
- Use upsert operations where possible

**Bad**: `CREATE order SET total = total + 100`
**Good**: `UPSERT order:123 SET total = 100, updated_at = time::now()`

## Error Handling

Every automation should handle failures gracefully.

**Required components**:
1. Try/catch or error trigger nodes
2. Error logging to database
3. Alert notification (Slack/email)
4. Original data preservation for retry

**Error log schema** (SurrealQL example):
```surql
CREATE error_logs SET
  workflow = "payment-processor",
  error_type = "api_timeout",
  error_message = $error.message,
  input_data = $input,
  timestamp = time::now(),
  resolved = false;
```

## Data Validation

Validate inputs before processing.

**Checklist**:
- [ ] Required fields present
- [ ] Data types correct
- [ ] Values within expected ranges
- [ ] Email/phone formats valid
- [ ] No malicious content

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

## Performance

### Batch Processing
Process data in batches, not one at a time.

**Recommended batch sizes**:
- API calls: 50-100 items
- Database inserts: 100-500 items
- Email sends: 50 items (rate limits)

### Caching
Cache frequently accessed data with TTL:
```surql
CREATE cache:user_list SET
  data = $users,
  expires_at = time::now() + 1h;

SELECT data FROM cache:user_list
WHERE expires_at > time::now();
```

### Rate Limiting
- Add delays between API calls
- Implement exponential backoff on failures
- Track API usage in database
- Set up alerts before hitting limits

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
