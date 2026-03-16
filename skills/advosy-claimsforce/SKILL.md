---
name: advosy:claimsforce
description: |
  Claimsforce (EspoCRM) workflow automation, placeholder syntax, webhook integration,
  and n8n patterns. Use when building CF automations, configuring workflows, troubleshooting
  CF-to-n8n integrations, looking up entity fields, or working with Claimsforce payroll,
  commissions, or claim status changes. Also use when the user mentions Claimsforce, CF,
  EspoCRM, Select Adjusters CRM, claims management, or sa.claimsforce.net.
user_invocable: true
invocation_hint: /advosy:claimsforce - Get Claimsforce automation context (workflows, placeholders, webhooks)
---

# Claimsforce Skill

Claimsforce is a rebranded EspoCRM used by Select Adjusters for claims management.

## Quick Reference

| Property | Value |
|----------|-------|
| **Instance URL** | https://sa.claimsforce.net |
| **Entity URL Pattern** | `https://sa.claimsforce.net/#Entity/view/{id}` |
| **Based On** | EspoCRM |
| **Total Claims** | ~11,168 (as of Feb 2026) |
| **Total Entities** | 70+ (35 custom business entities) |

---

## Placeholder Syntax

**CRITICAL**: Claimsforce uses EspoCRM placeholder syntax with a dollar sign.

| Correct | Wrong | Notes |
|---------|-------|-------|
| `{$id}` | `{id}` | Dollar sign required |
| `{$status}` | `{status}` | Direct field access |
| `{$phoneNumber}` | `{phoneNumber}` | Any direct field |

### Direct Fields
```
{$fieldName}
```

### Related Record Fields (UNRESOLVED)
```
{$relationship.fieldName}  // May not work - needs testing
{$contact.name}            // Did NOT work in testing
```

**Known Issue**: Related record syntax like `{$contact.name}` came through as literal text, not the actual value.

---

## Entity Manager Overview

**Path:** Administration > Entity Manager > [Entity Name]

| Option | Use For |
|--------|---------|
| **Fields** | Simple fields (Varchar, Boolean, Enum, Date, etc.) |
| **Relationships** | Link fields connecting entities (including self-referential) |
| **Layouts** | Control which fields appear on forms and lists |
| **Formula** | Before Save Custom Scripts for automation |

### Key Entities

| Entity | Label | Fields | Purpose |
|--------|-------|--------|---------|
| **Claim** | Claim | ~200 | Core insurance claims |
| **Check** | Check | 36 | Payments linked to claims |
| **Compensation** | Compensation | 19 | Commission/payout records |
| **SalesRep** | Sales Rep | 30 | Sales team (avoids User license cost) |
| **Contact** | Client | ~65 | Homeowners/customers |

For full entity field tables and relationships, read [references/entities.md](references/entities.md).

---

## Formula Functions

**Path:** Entity Manager > [Entity] > Formula > Before Save Custom Script

Key functions: `ifThenElse()`, `ifThen()`, `string\concatenate()`, `number\multiply()`, `datetime\today()`, `entity\isNew()`, `entity\isAttributeChanged()`, `entity\setAttribute()`, `entity\sumRelated()`, `record\exists()`.

**No `entity\throwError()`** — cannot block saves with validation errors. Use auto-clear or flag fields instead.

---

## Workflows

**Path:** Administration > Workflows

### Trigger Types
- After record created / updated / saved
- Scheduled / Sequential / Manual

### Actions

| Action Type | Use Case |
|-------------|----------|
| Send HTTP Request | Trigger external webhooks (n8n) |
| Update Target Record | Auto-set fields on trigger record |
| Create Record | Generate related records (Compensation) |

### Duplicate Prevention Pattern
1. Create Boolean field (e.g., `payoutsCreated`)
2. Add condition: `payoutsCreated = False`
3. Final action: Set `payoutsCreated = True`

For commission structure and FE/BE payout workflows, read [references/payroll-workflows.md](references/payroll-workflows.md).

---

## Claim Status Values

1. Pending With Issues - Inside Operations
2. Schedule AM
3. Pending Inspection
4. Pending Estimate
5. Check to HO
6. Coverage Dispute
7. Review 1st EST
8. Active Supp Negotiations
9. Pre Const Review

---

## Gotchas & Lessons Learned

1. **Placeholder syntax requires `$`** — `{$field}` not `{field}`
2. **Workflow condition "Changed"** — Use "Changed" not "was not equal" for status triggers
3. **n8n data path** — Webhook data is at `$json.body.*` not `$json.*`
4. **Related records** — `{$relationship.field}` syntax may not work in webhooks
5. **Headers optional** — CF webhook works without custom headers
6. **Method must be POST** — CF workflows send POST requests
7. **Email/Phone types** — Built-in on Contact, but custom entities (Sales Rep) must use Varchar
8. **No throwError function** — Cannot block saves with validation; use auto-clear or flags
9. **Link fields via Relationships** — Use Entity Manager > Relationships, not Fields
10. **Many-to-One for hierarchies** — Manager, Regional, etc. links use Many-to-One
11. **Leave "Link Multiple Field" unchecked** — For standard many-to-one relationships
12. **Duplicate prevention** — Use Boolean flag + "Update Target Record" action pattern
13. **Sales Rep vs User** — Use Sales Rep entity to avoid per-user license costs
14. **Related field access in formulas** — `claim.setter.manager` (two levels deep) may not resolve
15. **Create Record actions fail silently** — If a formula returns NULL, the action fails with no error
16. **Workflow Log does not equal Success** — Workflow firing doesn't mean actions succeeded
17. **Cross-entity formula references broken** — `claim.xxx` in Check-triggered workflows returns empty
18. **`name` on Claim = address/description** — NOT the customer name (that's on Contact)
19. **Check has `category` AND `type`** — Two separate Enum fields. `category` determines BE payout triggers
20. **Compensation uses `compType` not `type`** — Field is named `compType` in the actual entity
21. **Compensation `amount` is Float** — NOT Currency type, despite storing money values
22. **Compensation `source` is Link Parent** — Polymorphic link that can point to Claim OR Check
23. **Sales Rep `salesSeat` = DS** — "Direct Seat" (DS) in the hierarchy is the `salesSeat` field

---

## Reference Files

Read these on-demand for detailed information:

| If you need... | Read this file |
|----------------|---------------|
| Entity field tables, relationships, list view layout | [references/entities.md](references/entities.md) |
| Commission structure, FE/BE payout workflows, check categories | [references/payroll-workflows.md](references/payroll-workflows.md) |
| Webhook payloads, n8n patterns, quiet hours, test mode | [references/webhook-integration.md](references/webhook-integration.md) |
| Workflow debugging, formula issues, BPM vs Workflows | [references/debugging.md](references/debugging.md) |

---

## Resources

- **EspoCRM Documentation**: https://docs.espocrm.com/
- **EspoCRM Workflows**: https://docs.espocrm.com/administration/workflows/

*Last verified: Feb 20, 2026 via Playwright exploration of live instance*
