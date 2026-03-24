# Error #8: EOD Timezone Fix Introduced Regression
**Date:** 2026-03-23
**Project:** Bresco

## What Happened
While fixing the fragile EOD timezone calculation (I11), the agent replaced the complex-but-correct offset approach with a "simplified" version that appended `Z` to a local date string. This made all EOD queries use UTC midnight instead of local midnight, meaning the EOD summary would miss 17 hours of the business day for Arizona tenants (UTC-7).

## The Triggering Prompt
```
Fix I11 -- EOD timezone and M6 midday zero-data:
Replace the complex offset calculation with the simpler approach:
const today = new Intl.DateTimeFormat('en-CA', { timeZone: tenantTimezone }).format(new Date());
const todayStart = `${today}T00:00:00Z`;
```

## What Went Wrong
**Category:** Prompt Error
**Root cause:** The plan assumed the morning check-in's date-only approach would work for EOD's datetime comparisons. Morning uses `scheduled_date = $today` (date vs date), but EOD uses `timestamp >= $todayStart` (datetime vs datetime). Appending `Z` makes it UTC midnight, not local midnight.
**Surface symptom:** Code review flagged it as CRITICAL. Tests didn't catch it because mocks don't enforce timezone correctness.

## What The Prompt Should Have Been
```
Fix I11 -- EOD timezone:
The current offset calculation using toLocaleString round-trips is fragile.
Replace with a proper UTC offset computation:
1. Get today's date in tenant timezone
2. Compute the UTC offset by comparing formatted hours in UTC vs tenant tz
3. Construct local midnight as a UTC ISO string by applying the offset
Do NOT simply append 'Z' to a local date -- that creates UTC midnight, not local midnight.
```

## Prevention
1. When a fix involves timezone math, the prompt must specify whether the result is used as a date or datetime comparison
2. Test timezone-sensitive code with explicit assertions about the expected UTC value for a known timezone

## Pattern Check
- **Seen before?** Yes -- lessons.md already has "Match Existing Patterns When Writing Fixes" from the same EOD timezone calculation
- **Added to toolkit?** No, but captured in lessons.md below
