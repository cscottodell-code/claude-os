---
name: skill-creator
description: Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, update or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.
---

# Skill Creator

A skill for creating new skills and iteratively improving them.

## High-Level Process

1. Decide what the skill should do and roughly how
2. Write a draft of the skill
3. Create test prompts and run claude-with-access-to-the-skill on them
4. Help the user evaluate results qualitatively and quantitatively
5. Rewrite the skill based on feedback
6. Repeat until satisfied
7. Expand the test set and try again at larger scale

Your job is to figure out where the user is in this process and help them progress. If they want to skip evals and just vibe, that's fine too.

## Communicating with the User

Pay attention to context cues for coding familiarity. In the default case:
- "evaluation" and "benchmark" are borderline, but OK
- For "JSON" and "assertion", see cues that the user knows these terms before using them without explanation
- Briefly explain terms if in doubt

## Reference Files

Read these when you reach the relevant stage:

| File | When to Read |
|------|-------------|
| `references/workflow.md` | Creating or improving a skill (capture intent, interview, writing guide, iteration loop) |
| `references/eval-guide.md` | Running test cases, grading, benchmarking, description optimization, packaging |
| `references/schemas.md` | Writing evals.json, grading.json, or benchmark.json |
| `agents/grader.md` | Spawning a grader subagent |
| `agents/comparator.md` | Blind A/B comparison between two outputs |
| `agents/analyzer.md` | Analyzing benchmark results for hidden patterns |

## Core Loop (for emphasis)

- Figure out what the skill is about
- Draft or edit the skill
- Run claude-with-access-to-the-skill on test prompts
- Evaluate the outputs with the user (use `eval-viewer/generate_review.py`)
- Run quantitative evals
- Repeat until satisfied
- Package the final skill and return it to the user

Add steps to your TodoList to make sure you don't forget. If in Cowork, specifically add "Create evals JSON and run `eval-viewer/generate_review.py` so human can review test cases."
