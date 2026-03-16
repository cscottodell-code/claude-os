---
name: scott:save-tweet
description: |
  Extract tweet/thread content from x.com URLs into .md source files for the
  context-engineering collection. Use when the user shares an x.com or twitter.com
  URL and wants a source file created. Handles X's scraping blocks automatically.
user_invocable: true
invocation_hint: /scott:save-tweet <url> - Extract a tweet into a context-engineering source file
input_examples:
  - "/scott:save-tweet https://x.com/anthropic/status/123456789"
  - "/scott:save-tweet -- extract this tweet thread about context engineering"
---

# Tweet to Source

Extract an x.com tweet or thread into a `.md` source file saved to `~/Sites/Global/context-engineering/raw-sources/`.

## Standard Prompt (User's Intent)

> "Create a .md file that gives you all of the helpful information from this source to help customize Claude Code later. Update any outdated information with current information. Don't customize the information to any context about the user — stay true to the source, except for the updates. Save to ~/Sites/Global/context-engineering/raw-sources/."

## Extraction Workflow

X/Twitter blocks all direct scraping (WebFetch, Firecrawl, browser-based scrapers all fail). Use the fxtwitter API as your primary extraction method.

### Step 1: Identify the Tweet

Parse the URL for author handle and tweet ID. Note them for search queries.

### Step 2: Extract Tweet Content via fxtwitter API

**This is your primary extraction method.** Fetch both API endpoints in parallel using WebFetch:

```
https://api.fxtwitter.com/[handle]/status/[tweet_id]
https://api.vxtwitter.com/[handle]/status/[tweet_id]
```

These return the tweet text, author, date, engagement metrics, media URLs, and article previews. If one fails, the other usually works. Both support threads, quote tweets, and X Articles.

**For X Articles** (long-form posts): The API returns the article title and preview text. The article itself is behind a login wall and can't be fetched. Use the preview text + WebSearch to find the full content (the author usually published it elsewhere as a blog post too).

**If both APIs fail** (rare), fall back to WebSearch:
- `site:x.com [handle] [topic keywords]` - finds the tweet and related thread tweets
- `[handle] [topic] [year]` - finds blog posts, GitHub repos, or articles the tweet links to
- `"[exact phrase from snippet]" [handle]` - expands on partial content found in first search

### Step 3: Follow Linked Resources

Tweets often link to GitHub repos, blog posts, or websites. These ARE fetchable with WebFetch. Fetch them - they usually contain the real substance the tweet is promoting. This is where most of your content comes from.

If WebFetch returns a redirect notice (e.g., 308 from `anthropic.com` to `claude.com`), re-fetch the redirect URL immediately.

### Step 4: Cross-Reference and Fill Gaps

If the tweet is a thread, search for follow-up tweets by the same author. Use fxtwitter API on any thread tweet URLs found. Fetch any non-X links found.

### Step 5: Update Outdated Information

Search for the current state of any tools, versions, or features mentioned. Note updates in the file but stay true to the source's structure and intent.

### Step 6: Write the Source File

Use the file template below. Match the naming and formatting conventions of existing files in `~/Sites/Global/context-engineering/raw-sources/`.

## File Template

Read 1-2 existing files in `~/Sites/Global/context-engineering/raw-sources/` first to match the current formatting conventions. Use this as a starting structure:

```markdown
# [Title — from tweet or linked resource]

**Source:** [Tweet Title](https://x.com/...) by [@handle](https://x.com/handle) — linking to [resource name](url) if applicable
**Author:** [Name] — [brief credentials if findable]
**Version at time of capture:** [version if applicable]
**License:** [if applicable]

---

## [Core content sections — structure based on what the source contains]

[Stay true to the source. Don't add personal context or customization.]

---
```

## Naming Convention

`[topic-slug]-[author-or-project]-[year].md`

Examples from existing files:
- `everything-claude-code-mustafa-2026.md`
- `seeing-like-an-agent-thariq-2026.md`
- `skill-graphs-arscontexta-heinrich-2025.md`

## What NOT To Do

- Don't use WebFetch, Firecrawl, or browser scraping on x.com/twitter.com - they all fail
- Don't skip the fxtwitter API and go straight to search - the API is faster and more reliable
- Don't fabricate tweet text you didn't find via API or search snippets
- Don't add user-specific context or customization to the source content
- Don't skip linked resources - they're usually the main content
- Don't create thin files with just a tweet's 280 characters - dig into linked resources for substance
- Don't overwrite an existing source file without asking - if the canonical filename already exists, ask the user first

## When Content Is Too Thin

If searches return very little (single tweet with no thread, no linked resources, no related content), tell the user what you found and ask if they want to proceed with a minimal file or skip it.
