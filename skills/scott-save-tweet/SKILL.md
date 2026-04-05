---
name: scott:save-tweet
description: |
  Extract tweet/thread content from x.com URLs into structured .md files. Handles X's
  scraping blocks automatically using fxtwitter API, Playwright for X Articles, and
  WebFetch for linked resources. Produces a comprehensive source file with the tweet
  content, linked resources (GitHub repos, blog posts, docs), and engagement metrics.

  Use when Scott shares an x.com or twitter.com URL and wants the content captured.
  This is a standalone extraction tool, not tied to any specific downstream workflow.
  Scott decides where to save it and what to do with it afterward.
user_invocable: true
invocation_hint: /scott:save-tweet <url> - Extract a tweet into a markdown source file
input_examples:
  - "/scott:save-tweet https://x.com/anthropic/status/123456789"
  - "/scott:save-tweet https://x.com/someone/status/987654321"
section: tools
---

# Tweet to Source

Extract an x.com tweet or thread into a structured `.md` file.

## Step 1: Parse the URL

Extract author handle and tweet ID from the URL. Handle these formats:
- `https://x.com/[handle]/status/[id]`
- `https://x.com/[handle]/status/[id]?s=46` (with query params)
- `https://twitter.com/[handle]/status/[id]` (old domain)

## Step 2: Extract Tweet Content

### Primary method: fxtwitter API

Fetch both endpoints in parallel using WebFetch:

```
https://api.fxtwitter.com/[handle]/status/[tweet_id]
https://api.vxtwitter.com/[handle]/status/[tweet_id]
```

These return tweet text, author, date, engagement metrics, media URLs, and article
previews. If one fails, the other usually works. Both support threads, quote tweets,
and X Articles.

### X Articles (long-form posts)

X Articles are long-form posts embedded in tweets. The fxtwitter API returns the title
and preview text but not the full article body.

**Use Playwright as the primary method for X Articles:**

1. Navigate to the tweet URL with Playwright
2. Wait 5 seconds for content to load
3. Take a snapshot to capture the full article text
4. The article renders inline in the tweet page when you scroll down

If Playwright fails (browser not available, Chrome already running):
- Search for the article title + author name via WebSearch
- The author often published the same content as a blog post elsewhere
- Use the fxtwitter preview text as a fallback summary

**How to detect an X Article:** The fxtwitter API response will reference an article URL
like `x.com/i/article/[id]`, or the tweet text will be minimal with the substance in
a linked article preview.

### If both fxtwitter endpoints fail (rare)

Fall back to WebSearch:
- `site:x.com [handle] [topic keywords]`
- `[handle] [topic] [year]`
- `"[exact phrase from snippet]" [handle]`

## Step 3: Follow Linked Resources

Tweets often link to GitHub repos, blog posts, docs, or websites. These ARE fetchable
with WebFetch (unlike x.com itself). **Always fetch them.** They usually contain the
real substance the tweet is promoting.

If WebFetch returns a redirect (e.g., 308 from `anthropic.com` to `claude.com`),
re-fetch the redirect URL immediately.

## Step 4: Cross-Reference and Fill Gaps

- If the tweet is a thread, search for follow-up tweets by the same author
- Use fxtwitter API on any thread tweet URLs found in search results
- Fetch any non-X links discovered during research

## Step 5: Update Outdated Information

Search for the current state of any tools, versions, or features mentioned. Note
updates in the file but stay true to the source's structure and intent.

## Step 6: Save Location

Save to `~/Sites/Global/research/` by default. No need to ask unless Scott specifies a different path.

## Step 7: Write the Source File

### File Header Convention

Always start with this header:

```markdown
<!-- Last refreshed: YYYY-MM-DD -->
**Source:** [Tweet or Article Title](https://x.com/...) by [@handle](https://x.com/handle) — linking to [resource name](url) if applicable
```

### File Structure

```markdown
<!-- Last refreshed: YYYY-MM-DD -->
**Source:** [Title](tweet URL) by [@handle](profile URL) linking to [resource](url)

# [Title]

**Author:** [Name] (@handle) — [brief credentials if findable]
**Published:** [date]
**Repository/Resource:** [URL if applicable]
**License:** [if applicable]

---

## [Core content sections — structure based on what the source contains]

[Stay true to the source. Don't add personal context or customization.]

---

## Engagement (as of [month year])

Tweet: [likes] likes, [bookmarks] bookmarks, [views] views
[Repository: [stars] stars, [forks] forks — if applicable]

---
```

### Naming Convention

`[topic-slug]-[author-or-project]-[year].md`

Examples:
- `council-of-high-intelligence-nyk-2026.md`
- `seeing-like-an-agent-thariq-2026.md`
- `claude-code-architecture-deep-dive-hitw93-2025.md`

## What NOT To Do

- Don't use WebFetch or Firecrawl on x.com/twitter.com directly (they fail)
- Don't skip the fxtwitter API and go straight to search (API is faster and more reliable)
- Don't fabricate tweet text you didn't find via API, Playwright, or search snippets
- Don't add user-specific context or customization to the source content
- Don't skip linked resources (they're usually the main content)
- Don't create thin files with just a tweet's 280 characters (dig into linked resources)
- Don't overwrite an existing file without asking Scott first

## If Extraction Fails

- **Deleted tweet or suspended account:** Tell Scott the tweet is gone. Search for
  cached versions via `"[tweet URL]"` or `cache:[tweet URL]` before giving up.
- **Private/protected account:** fxtwitter will fail. Tell Scott the account is private.
- **Malformed URL:** If the URL doesn't match expected patterns, ask Scott to double-check it.

## When Content Is Too Thin

If searches return very little (single tweet with no thread, no linked resources, no
related content), tell Scott what you found and ask if he wants to proceed with a
minimal file or skip it.
