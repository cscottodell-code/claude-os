# Claimsforce Payroll Workflows

Commission structure, frontend/backend payout workflows, and check categories.

---

## Commission Structure

| Role | Frontend (LOR Sent) | Backend (Check Created) |
|------|---------------------|-------------------------|
| Setter | $200 fixed | 1% of check amount |
| Inspector | $100 fixed | 1% of check amount |
| Recruiter OR | $5 fixed | -- |
| Manager OR | -- | 0.6% of check amount |
| Regional OR | -- | 0.5% of check amount |
| DS OR | -- | 0.3% of check amount |
| Trainer OR | -- | 0.3% of check amount |

---

## Frontend Workflow: Claim FE Payouts

**Entity:** Claim
**Trigger:** After record updated
**Conditions:**
- LOR Sent = Changed
- LOR Sent = Not Empty
- fePayoutsCreated = False (may be `repPaid` field)

**Actions:**

1. Create Compensation (Setter FE):
```
name = string\concatenate(name, ' - Setter FE')
compType = 'Commission'
role = 'Setter'
timing = 'Frontend'
source = (Parent link to Claim)
recipient = setter
amount = 200
```

2. Create Compensation (Inspector FE):
```
name = string\concatenate(name, ' - Inspector FE')
compType = 'Commission'
role = 'Inspector'
timing = 'Frontend'
source = (Parent link to Claim)
recipient = inspector
amount = 100
```

3. Create Compensation (Recruiter OR):
```
name = string\concatenate(name, ' - Recruiter OR')
compType = 'Commission'
role = 'Recruiter'
timing = 'Frontend'
source = (Parent link to Claim)
recipient = setter.recruiter
amount = 5
```

4. Update Target Record:
```
repPaid = true (or fePayoutsCreated = true)
```

---

## Backend Workflow: Claim BE Payouts

**Entity:** Check
**Trigger:** After record created
**Conditions:**
- claim = Is Not Empty
- amount > 0
- category = One of [qualifying categories] (NOTE: use `category` not `type`)
- payoutsCreated = False

**Actions:**

1. Create Compensation (Setter BE):
```
name = string\concatenate(claim.name, ' - Setter BE')
compType = 'Commission'
role = 'Setter'
timing = 'Backend'
source = (Parent link to Claim)
recipient = claim.setter
amount = number\multiply(amount, 0.01)
```

2-6. Similar for Inspector BE (1%), Manager OR (0.6%), Regional OR (0.5%), DS OR (0.3%), Trainer OR (0.3%)

7. Update Target Record:
```
payoutsCreated = true
```

---

## Check Categories (Backend Payout Triggers)

**IMPORTANT:** Use the `category` field (not `type`) for payout trigger conditions.

### Categories that trigger BE payouts:
| Category | Triggers BE Payout |
|----------|-------------------|
| ACV / Initial Check | Yes |
| Add'l ACV | Yes |
| Deductible | Yes |
| Partial Deductible | Yes |
| Depreciation | Yes |
| Supplement | Yes |
| Mitigation | Yes |
| RCV | Yes |
| Misc. | Yes |
| Advosy | Yes |
| Client Check (Upgrade or Out-of-Pocket) | Yes |

### Categories that do NOT trigger BE payouts:
- Additional Expenses (ALE)
- Contents
- 25/75 split payment
- stopped/cancelled check
- Reimbursement to HO
- SA downpayment to contractor
- SA Final Payment to contractor
