# Success #8: Fast-Tracking New-Project Phases with Existing Planning

**Date:** 2026-03-27
**Project:** Bresco

## What Worked
When rebuilding Bresco, recognized that Phases 1-4 of the new-project workflow (Brain Dump, Clarify, Draft PRD, Finalize PRD) were already complete via existing planning docs. Jumped directly to Phase 5 (Create Repository) and carried forward all 8 source-of-truth documents. Saved significant time without cutting corners.

## The Triggering Prompt
```
I want to get back to working on Bresco. I've decided to rebuild it from the ground up, but stick with the original design plan according to scott:new-project.
```

## Why It Worked
**Key factor:** The new-project workflow phases are goal-oriented, not ceremony-oriented. Each phase has a "Done when" condition. Phases 1-4 were already "done" because the planning docs existed and were locked.
**Contributing factors:** Reading the existing PROJECT.md, ROADMAP.md, and CLAUDE.md before starting the workflow made it clear that the planning was complete. Asking Scott 4 targeted questions (reuse docs? what's driving rebuild? same repo? team structure?) resolved all unknowns in one exchange.

## Reproducible?
- **Can repeat?** Yes, any time a project is being rebuilt or forked with existing planning
- **Should become standard?** Yes. The new-project workflow should explicitly mention: "If planning docs already exist, verify they're current and skip to Phase 5."
