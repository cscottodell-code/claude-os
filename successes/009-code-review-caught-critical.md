# Success #009: Code Review Caught Critical Bug Before Ship
**Date:** 2026-03-28
**Project:** scott-toolkit

## What Worked
The code review agent found that the entire plugin detection feature was silently broken (checking a nonexistent path). Without the review, the feature would have shipped non-functional and the bug would have been invisible since it fails silently.

## The Triggering Prompt
```
Review the latest commit on ~/Sites/Global/scott-toolkit for quality issues.
```

## Why It Worked
**Key factor:** The reviewer tested the actual file path existence and traced the logic through both branches of the bidirectional check.
**Contributing factors:** Structured review that checked shell correctness, JSON validity, edge cases, and logic bugs separately.

## Reproducible?
- **Can repeat?** Yes — code review after every feature is standard practice
- **Should become standard?** Already is (phase closeout Phase 2)
