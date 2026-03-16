# Claimsforce Webhook & n8n Integration

Webhook payloads, n8n patterns, quiet hours, and test mode.

---

## Standard Payload Template

```json
{
  "claimId": "{$id}",
  "status": "{$status}",
  "phoneNumber": "{$phoneNumber}",
  "claimUrl": "https://sa.claimsforce.net/#Claim/view/{$id}"
}
```

## Extended Payload

```json
{
  "claimId": "{$id}",
  "status": "{$status}",
  "phoneNumber": "{$phoneNumber}",
  "contactName": "{$contact.name}",
  "lossAddress": "{$lossAddress}",
  "claimUrl": "https://sa.claimsforce.net/#Claim/view/{$id}"
}
```

**Note**: `contactName` and `lossAddress` placeholders may not resolve correctly. Test before relying on them.

---

## n8n Data Path

When CF sends a webhook to n8n, the data arrives at:
```
$json.body.fieldName
```

**NOT** at `$json.fieldName`.

| In Payload | Access in n8n |
|------------|---------------|
| `claimId` | `$json.body.claimId` |
| `status` | `$json.body.status` |
| `phoneNumber` | `$json.body.phoneNumber` |

---

## n8n Integration Patterns

### Webhook Node Settings
- **HTTP Method**: POST
- **Path**: descriptive name (e.g., `claimsforce-status-change`)
- **Response Mode**: Immediately

### Status Routing (Switch Node)
```javascript
{{ $json.body.status }}
// Cases: "Check to HO", "Pending Inspection", etc.
```

### Message Templates
```
Your claim {{ $json.body.claimId }} has been updated.
View details: {{ $json.body.claimUrl }}
```

---

## Quiet Hours Pattern

```javascript
// Arizona/MST is UTC-7 (no daylight saving)
const mstOffset = -7;
const now = new Date();
const mstHour = (now.getUTCHours() + mstOffset + 24) % 24;
// 9 AM to 7 PM MST
const withinWindow = mstHour >= 9 && mstHour < 19;
```

---

## Test Mode Pattern

1. **Override recipient** - Send to test phones instead of `$json.body.phoneNumber`
2. **Prefix messages** - Add `[TEST]` to identify test messages
3. **Use test claims** - Create or identify specific claims for testing

### Test Numbers (Advosy)
- Scott: 480-213-2760
- Brett: 480-329-0872

---

## Existing Automations

### SMS Notifications on Status Change
- **n8n Workflow**: `sC1sVFyTRRxucW4T` (Brett's n8n)
- **Webhook**: `https://banc-r.app.n8n.cloud/webhook/claimsforce-status-change`
- **Status**: Active (TEST MODE)

### Payroll Automations
- **Frontend Workflow**: Claim FE Payouts (triggers on LOR Sent)
- **Backend Workflow**: Claim BE Payouts (triggers on Check created)
