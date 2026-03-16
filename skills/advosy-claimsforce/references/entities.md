# Claimsforce Entity Reference

All entity definitions, field tables, and relationships.

---

## All Custom Business Entities

Verified via Entity Manager on Feb 20, 2026:

| Entity Name | Label | Type | Purpose |
|-------------|-------|------|---------|
| **Claim** | Claim | Base Plus | Core entity - insurance claims (~200 fields) |
| **Check** | Check | Base Plus | Payments/checks linked to claims |
| **Compensation** | Compensation | Base Plus | Commission/payout records for payroll |
| **SalesRep** | Sales Rep | Base Plus | Sales team members (avoids User license costs) |
| **Contact** | Client | Person | Homeowners/customers |
| **InsuranceCompany** | Insurance Company | Company | Insurance carriers |
| **MortgageCompany** | Mortgage Company | Company | Mortgage lenders |
| **Adjuster** | Adjuster | Person | Insurance adjusters |
| **SecondSupplementer** | Second Supplementer | Person | Second supplementer contacts |
| **AdditionalContact** | Additional Contact | Person | Extra contacts on claims |
| **Inspection** | Inspection | Base Plus | Property inspections |
| **Construction** | Construction | Base Plus | Construction projects |
| **RoofingProjects** | Roofing Project | Base Plus | Roofing-specific projects |
| **NonRoofingProject** | Non-Roofing Project | Base Plus | Non-roof work (HVAC, interior, etc.) |
| **Supplements** | Supplement | Base Plus | Supplement claims to insurance |
| **ChangeOrders** | Change Order | Base Plus | Construction change orders |
| **Collections** | Collection and Billing | Base Plus | Debt collection tracking |
| **Billing** | Billing | Base | Billing records |
| **Trust** | Trust | Base Plus | Trust account management |
| **TrustDisbursementBreakdown** | Trust Disbursement Breakdown | Base Plus | Trust payout details |
| **Policy** | Policy | Base Plus | Insurance policies |
| **Estimate** | Estimate | Base | Repair estimates |
| **Expense** | Expense | Base | Project expenses |
| **Payables** | Payables | Base | Accounts payable |
| **Tarp** | Tarp | Base Plus | Emergency tarping |
| **Packout** | Packout | Base Plus | Contents packout |
| **MitigationAndRestoration** | Mitigation and Restoration | Base Plus | Water/fire mitigation |
| **MitigationTest** | Mitigation | Base Plus | Mitigation test entity |
| **MoneyOwed** | Money Owed | Base Plus | Outstanding balances |
| **OutstandingExpenses** | Outstanding Expense | Base Plus | Unpaid expenses |
| **B2BReferralNetwork** | B2B Referral Network | Base Plus | Business referral partners |
| **BrettsAppraisals** | Brett's Appraisals | Base Plus | Appraisal tracking |
| **BloqueClient** | Bloque Client | Person | Bloque Restoration clients |
| **BloqueDocs** | Bloque Docs | Base Plus | Bloque doc records |
| **BloqueExpenses** | Bloque Expense | Base Plus | Bloque expense records |
| **BloquePayments** | Bloque Payment | Base Plus | Bloque payment records |
| **Reconstruction** | Reconstruction | Base | Reconstruction projects |
| **Stages** | Stage | Base | Pipeline stages |
| **Inventory** | Inventory | Base | Inventory tracking |
| **Outbound** | Outbound | Base | Outbound communications |
| **CallQueue** | CallQueue | Base | Phone queue management |
| **Dealflow** | Dealflow | Base | Deal pipeline |
| **Recurring** | Recurring | Base | Recurring items |
| **ClaimDocument** | ClaimDocument | Base | Claim-specific documents |
| **JobSourceBloque** | Job Source (Bloque) | Company | Bloque job source companies |

Also present: Standard EspoCRM entities (Account/Vendor, Call, Campaign, Case/Ticket, Document, Email, Invoice, Lead, Meeting, Opportunity/Receivable, Product, Quote, SalesOrder, Task, User, VoipEvent, VoipMessage)

---

## Claim Entity

Primary entity for insurance claims. ~200 fields total.

**IMPORTANT:** The `name` field is the **project description/address** (e.g., "1319 S. Wayfarer"), NOT the customer name. The customer name comes from the linked `contact` (Client).

### Identity & Status Fields
| Field | Label | Type | Notes |
|-------|-------|------|-------|
| `name` | Name (Not Customer, but Project Description) | Varchar | Usually the property address |
| `claimID` | Claim ID | Auto-increment | Sequential number |
| `claimNumber` | Claim Number | Varchar | Insurance claim number |
| `status` | Status | Enum | Current claim status |
| `closedStatus` | Closed Status | Enum | Reason for closure |
| `type` | Type | Multi-Enum | Wind, Hail, Interior, etc. |
| `daysInStage` | Days In Stage | Float | Auto-calculated |

### People/Link Fields
| Field | Label | Type | Links To |
|-------|-------|------|----------|
| `contact` | Client (Primary) | Link | Contact |
| `setter` | Setter | Link | Sales Rep |
| `inspector` | Inspector | Link | Sales Rep |
| `secondSupplementer` | Second Supplementer | Link | SecondSupplementer |
| `user` | Sales Rep (old) | Link | User |
| `assignedUser` | Assigned User | Link | User |
| `insuranceCompany` | Insurance Company | Link | InsuranceCompany |
| `mortgageCompany` | Mortgage Company | Link | MortgageCompany |
| `account` | Vendor | Link | Account (Vendor) |
| `account1` | Sent To App | Link | Account (Vendor) |
| `policy` | Policy | Link | Policy |
| `document` | Active Estimate | Link | Document |

### Financial Fields
| Field | Label | Type |
|-------|-------|------|
| `approvedAMT` | Approved AMT | Currency |
| `deductibleAmount` | Deductible Amount | Currency |
| `checksTotal` | Checks Total | Currency |
| `totalRCV` | Total RCV | Currency |
| `grossProfit` | Gross Profit | Currency |
| `grossExpenses` | Gross Expenses | Currency |
| `totalCollected` | Total Collected | Currency |
| `outstandingBalance` | Outstanding Balance | Currency |
| `customerOwed` | Customer Owed | Currency |
| `totalExpenses` | Total Expenses | Currency |
| `totalChargeToHO` | Total Charge to HO | Currency |
| `hOAmount` | HO Amount | Currency |
| `costPerSQ` | Cost Per SQ | Currency |
| `paidPerSQ` | Paid Per SQ | Currency |
| `roofTotal` | Roof Total | Currency |
| `depreciation` | Depreciation Billed Amount | Currency |
| `supplementIncreased` | Supplement Increased | Currency |
| `secondSupplementIncrease` | Second Supplement Increase | Currency |
| `finalEstimateRCV` | Final Estimate RCV | Currency |
| `secondFinalEstimateRCV` | Second Final Estimate RCV | Currency |

### Key Date Fields
| Field | Label | Type |
|-------|-------|------|
| `dateofLoss` | Date Of Loss | Date |
| `loeSent` | LOR Sent | Date |
| `contractedDate` | Contracted Date | Date |
| `dateClosed` | Date Closed | Date |
| `stageChanged` | Stage Changed | Date |
| `depreciationDueDate` | DEP Expiration Date | Date |
| `dateInspectionCompleted` | Date Inspection Completed | Date |
| `dateInspectionRequested` | Date Inspection Requested | Date |
| `lastCustomerContact` | Last Customer Contact | Date |

### Boolean Flags
| Field | Label | Purpose |
|-------|-------|---------|
| `repPaid` | FE Paid | Frontend payout flag |
| `checkToHO` | Check to HO | Check sent to homeowner |
| `depEXPIRED` | DEP EXPIRED | Depreciation expired |
| `inAppraisal` | In Appraisal | Currently in appraisal |
| `payoutsCreated` | Payouts Created | Duplicate prevention for payouts |

### Claim Relationships (26 total)

| From Link | Type | To Link | To Entity |
|-----------|------|---------|-----------|
| `claims` (M-1) | Many-to-One | `contact` | Client |
| `claims` (M-1) | Many-to-One | `setter` | Sales Rep |
| `claims1` (M-1) | Many-to-One | `inspector` | Sales Rep |
| `claims` (M-1) | Many-to-One | `insuranceCompany` | Insurance Company |
| `claim` (1-M) | One-to-Many | `checks` | Check |
| `claim` (1-M) | One-to-Many | `changeOrders` | Change Order |
| `claim` (1-M) | One-to-Many | `supplementss` | Supplement |
| `source` (P-C) | Parent-to-Children | `compensations` | Compensation |
| `claims` (M-M) | Many-to-Many | `adjusters` | Adjuster |

---

## Check Entity

Check/payment records linked to claims. 36 fields.

**IMPORTANT:** Check has BOTH `category` (Enum) and `type` (Enum) as separate fields. The `category` field determines payout triggers.

| Field | Label | Type | Notes |
|-------|-------|------|-------|
| `name` | Name | Varchar | |
| `amount` | Amount | Currency | Check amount |
| `category` | Category | Enum | Determines BE payout triggers |
| `type` | Type | Enum | Check type classification |
| `status` | Status | Enum | |
| `checkNumber` | Check Number | Varchar | |
| `claim` | Claim | Link | Related Claim |
| `contact` | Client | Link | Related Contact |
| `payoutsCreated` | Payouts Created | Boolean | Duplicate prevention flag |
| `datePaid` | Date Paid | Date | |
| `dateReceived` | Date Received | Date-Time | |

---

## Compensation Entity

Commission and override records for payroll. 19 fields.

**IMPORTANT CORRECTIONS from live system:**
- The type field is `compType` (NOT `type`)
- The amount field is `Float` (NOT Currency)
- The source field is `Link Parent` (polymorphic - can link to Claim OR Check)

| Field | Label | Type | Notes |
|-------|-------|------|-------|
| `name` | Name | Varchar | e.g., "1319 S. Wayfarer - Setter FE" |
| `amount` | Amount | **Float** | Payout amount (NOT Currency) |
| `compType` | Type | Enum | Commission, etc. |
| `role` | Role | Enum | Setter, Inspector, Recruiter, Manager, Regional, DS, Trainer |
| `timing` | Timing | Enum | Frontend, Backend |
| `status` | Status | Enum | Payment status |
| `source` | Source | **Link Parent** | Polymorphic link to Claim OR Check |
| `recipient` | Recipient | Link | Sales Rep receiving payment |

---

## Sales Rep Entity

Alternative to User entity (avoids license costs). 30 fields.

| Field | Label | Type | Notes |
|-------|-------|------|-------|
| `name` | Name | Varchar | Full name |
| `email` | Email | Varchar | Email address |
| `phone` | Phone | Varchar | Phone number |
| `role` | Role | Enum | Sales role |
| `status` | Status | Enum | Active/inactive |
| `manager` | Manager | Link (Sales Rep) | Self-referential |
| `recruiter` | Recruiter | Link (Sales Rep) | Self-referential |
| `regional` | Regional | Link (Sales Rep) | Self-referential |
| `salesSeat` | Sales Seat | Link (Sales Rep) | Self-ref (was "DS") |
| `trainer` | Trainer | Link (Sales Rep) | Self-referential |
| `advosySalesSeat` | Advosy Sales Seat | Link (Sales Rep) | Self-referential |

### Self-Referential Relationships

| Link Name | Direction | Inverse Link | Meaning |
|-----------|-----------|-------------|---------|
| `manager` | Up (M-1) | `salesRepM` (1-M) | This rep's manager |
| `recruiter` | Up (M-1) | `salesRepRC` (1-M) | This rep's recruiter |
| `regional` | Up (M-1) | `salesRepR` (1-M) | This rep's regional |
| `salesSeat` | Up (M-1) | `salesRepSS` (1-M) | This rep's sales seat |
| `trainer` | Up (M-1) | `salesRepT` (1-M) | This rep's trainer |

---

## Contact Entity (labeled "Client")

Customer/homeowner information. ~65 fields.

| Field | Label | Type | Notes |
|-------|-------|------|-------|
| `name` | Name (Primary) | Person Name | Composite first/last/salutation |
| `firstName` | First Name | Varchar | |
| `lastName` | Last Name | Varchar | |
| `phoneNumber` | Phone | **Phone** | Native Phone type (not Varchar!) |
| `emailAddress` | Email | **Email** | Native Email type (not Varchar!) |
| `address` | Address | Address | Full address with components |
| `customerID` | Customer ID | Auto-increment | Sequential ID |
| `status` | Status | Enum | |
| `claims` | Claims | Link Multiple | All related claims |
| `checks` | Checks | Link Multiple | All related checks |

---

## User Entity

Internal staff members (incurs license cost).

| Field | Type | Notes |
|-------|------|-------|
| `id` | ID | |
| `name` | Varchar | |
| `phoneNumber` | Varchar | |

---

## Claims List View Layout

The default list view shows these columns:

1. Client (Primary)
2. Name (Project Description/address)
3. Claim Number
4. Job Source
5. Account Manager
6. Insurance Company
7. Loss Address
8. Status
9. Supp Status
10. Construction Stage
11. DEP Expiration Date
12. Contracted Date
13. Date Of Loss
14. Type
15. Created At (sorted descending)
16. Supplementer
17. Second Supplementer
18. Supplements
