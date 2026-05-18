---
name: scott:x-post
description: |
  Extract an X post / thread / X Article (and any linked resources) into a
  structured .md research file. Uses the bundled fetch_post.sh script (FxTwitter
  v2 API, native X Article parsing, single-call threads, VxTwitter fallback) as
  the primary extraction mechanism. Follows external links (GitHub, blog posts,
  docs) via WebFetch. Falls back to Playwright + WebSearch only when the script
  fails. Writes a comprehensive source file with post content, linked resources,
  and engagement metrics.

  Use when Scott shares an x.com or twitter.com URL and wants the content captured.
  This is a standalone extraction tool, not tied to any specific downstream workflow.
  Scott decides where to save it and what to do with it afterward.
user_invocable: true
invocation_hint: /scott:x-post <url> - Extract an X post into a markdown source file
input_examples:
  - "/scott:x-post https://x.com/anthropic/status/123456789"
  - "/scott:x-post https://x.com/someone/status/987654321"
section: tools
---

# X Post

Extract an X post or thread into a structured `.md` file, following any linked resources for full context.

## Step 1: Extract Tweet Content (Primary)

Run the bundled script. It handles URL parsing, FxTwitter v2 API, VxTwitter fallback, X Article body extraction (Draft.js blocks stitched to markdown), threads, polls, community notes, quote tweets, and reposts in one call.

```bash
# Single post (default):
bash ~/Scott/claude-os/skills-knowledge/skills/scott-x-post/scripts/fetch_post.sh "<url>"

# Full unrolled thread:
bash ~/Scott/claude-os/skills-knowledge/skills/scott-x-post/scripts/fetch_post.sh "<url>" thread
```

**When to pass `thread`:** if the tweet looks like the start of a thread (numbered "1/" or visible reply chain by the same author), or if Scott says "the whole thread" or "unrolled."

**Script exit codes:**
- `0` success, output is the formatted extraction
- `1` bad URL (no post ID found), tell Scott to double-check the URL
- `2` API error (private, deleted, age-restricted, or both APIs unreachable)

**What the script returns:**
- Author name + handle, post timestamp, language
- Full text (including X Article body when present, stitched from Draft.js blocks)
- Stats: likes, reposts, replies, quotes, bookmarks, views
- Media URLs (photos + videos)
- Community Note text when present

## Step 2: Fallbacks (only if Step 1 fails)

Only reach for these when the script returns exit code 2 AND the failure is not "private/deleted":

- **X Article the script could not parse** (rare): Playwright to the tweet URL, wait 5s, snapshot to capture the rendered article body.
- **fxtwitter and vxtwitter both down**: WebSearch with `site:x.com [handle] [topic keywords]` or `"[exact phrase from snippet]" [handle]`.
- **Deleted tweet or suspended account**: tell Scott it is gone. Search for cached versions via `"[tweet URL]"` or `cache:[tweet URL]` before giving up.
- **Private/protected account**: the script will tell you. Tell Scott the account is private.

Do NOT use WebFetch or Firecrawl directly on x.com / twitter.com, they fail.

## Step 3: Follow Linked Resources (the high-value step)

Tweets often link to GitHub repos, blog posts, docs, or websites. These ARE fetchable with WebFetch (unlike x.com itself). **Always fetch them.** They usually contain the real substance the tweet is promoting.

- Pull every non-x.com URL from the post text and media.
- WebFetch each one in parallel.
- If WebFetch returns a redirect (e.g., 308 from `anthropic.com` to `claude.com`), re-fetch the redirect URL immediately.
- If a GitHub repo is linked, also fetch the README and note stars/forks.

## Step 4: Cross-Reference and Fill Gaps

- If the tweet is a thread but Step 1 was run in `status` mode, re-run in `thread` mode.
- For multi-tweet threads the API misses (rare), search for follow-ups by the same author and re-run the script on each.
- Fetch any non-X links discovered during research.

## Step 5: Update Outdated Information

Search for the current state of any tools, versions, or features mentioned. Note
updates in the file but stay true to the source's structure and intent.

## Step 6: Save Location

Save to `~/Scott/growth-os/raw/research/global/` by default. No need to ask unless Scott specifies a different path.

## Step 7: Write the Source File

The output is designed to be opened in Obsidian as a verbatim source-of-record. Frontmatter feeds the Properties panel and Bases queries. Body is the source's own words inside blockquotes, with light section breaks allowed for scannability. NO interpretive synthesis, NO invented section names like "Thesis" or "Closing posture."

### File Structure (template)

```markdown
---
type: reference
status: draft
source_url: <full URL of the original post>
author: <full name>
author_handle: <x handle, no @>
posted: <YYYY-MM-DD, the post's actual date>
captured: <YYYY-MM-DD, today>
post_type: <single | thread | x-article>
post_count: <1 for single/x-article, N for thread>
likes: <int>
reposts: <int>
replies: <int>
quotes: <int or null>
bookmarks: <int or null>
views: <int or null>
linked_resources:
  - <url1>
  - <url2>
tags:
  - types/reference
  - statuses/draft
---

# <Title from post or "[Author] on [topic], [Date]" if no natural title>

## Original post

[For a single tweet:]
> <verbatim text, blockquoted, paragraph breaks preserved as the author wrote them>

[For a thread:]
### Post 1 of N

> <verbatim text>

### Post 2 of N

> <verbatim text>

[For an X Article: preserve the author's own H2/H3 structure, but demote one level to fit under `## Original post`:]
### <Author's own section heading>

> <verbatim body>

### <Next author section>

> <verbatim body>

## Linked: <resource name> (<short attribution, e.g. "Simon Willison, Mar 2025">)

> <verbatim body of the linked resource, blockquoted>

[Repeat `## Linked: ...` for each linked resource. Same blockquote treatment.]

---

#types/reference #statuses/draft
```

### Format rules

- **Frontmatter only**, no HTML comment header. The `captured:` field replaces `<!-- Last refreshed -->`.
- **Engagement stats live in frontmatter** as numeric fields, not in a body section. Obsidian's Properties panel surfaces them; Bases queries can filter on them.
- **All source text goes inside blockquotes** (`>`). The blockquote boundary is what tells future-you (and future-Claude) what is verbatim source vs your own framing.
- **Only `##` headers you create are `## Original post` and `## Linked: <name>`.** Don't invent additional `##` sections like `## Thesis` or `## Key takeaways`.
- **`###` sub-headings ARE permitted to break up long verbatim blocks for scannability.** Two valid kinds:
  1. **Author's own structure**: if the source has its own headings (X Articles often do), demote them by one level and use the author's exact wording. Example: Thariq's `## Why HTML?` becomes `### Why HTML?` under `## Original post`.
  2. **Navigational labels you create**: short, descriptive, accurate to the verbatim block that follows. Example: `### Karpathy's framing of the posture` over the "tight leash on this new over-eager junior intern savant" paragraph. The text inside the section is still 100% blockquoted source text.
- **Sub-headings are navigational, not synthesis.** A sub-heading is a label, not a claim. `### Willison's golden rule` (navigational, points to a literal quote of the rule) is fine. `### Willison's optimistic case for beginners` (interpretive framing, characterizes the author's stance) is too far. When in doubt, use the author's own phrase from the text.
- **Dual-write tags**: include in both YAML frontmatter (`tags:` array) and as body hashtags on the last line. Per Scott's identity.md tag rule, this enables both Bases queries (`file.hasTag()`) and grep / inline context.
- **Tags at capture, not at promotion**: raw research files get `types/reference` + `statuses/draft` immediately. (This is a deliberate departure from the daily-note capture rule, which stays untagged.)

### Naming Convention

`[topic-slug]-[author-or-project]-[year].md`

Examples:
- `council-of-high-intelligence-nyk-2026.md`
- `seeing-like-an-agent-thariq-2026.md`
- `claude-code-architecture-deep-dive-hitw93-2025.md`

## What NOT To Do

- Don't use WebFetch or Firecrawl on x.com/twitter.com directly (they fail)
- Don't bypass the script and try to reconstruct fxtwitter calls via WebFetch (slower, more failure modes, no native X Article handling)
- Don't fabricate tweet text the script did not return
- Don't add user-specific context or customization to the source content
- Don't skip linked resources (they're usually the main content)
- Don't create thin files with just a tweet's 280 characters (dig into linked resources)
- Don't overwrite an existing file without asking Scott first
- **Don't invent `##` headers** beyond `## Original post` and `## Linked: <name>`. (Navigational `###` sub-headings are allowed, see Step 7.)
- **Don't synthesize or paraphrase.** Body text outside a blockquote must be Scott's later annotation, not your interpretation. Capture, don't curate.
- **Don't reformat verbatim text.** Don't bold keywords the author didn't bold. Don't number items the author didn't number. Don't build summary tables from the author's prose. If the source uses ASCII art, keep it as ASCII art.

## When Content Is Too Thin

If the script returns a short tweet with no thread and no linked resources, tell Scott what you found and ask if he wants to proceed with a minimal file or skip it.

## Script Maintenance

The script lives at `scripts/fetch_post.sh` alongside this SKILL.md. It was absorbed from a separate plugin (`x-post-extractor` v0.1.0) on 2026-05-17 because the v2 FxTwitter endpoint, single-call threads, and native X Article (Draft.js block) parsing were strictly better than the original WebFetch-based approach. The plugin was deleted after merge.

If FxTwitter or VxTwitter changes its response shape, update the python block inside `fetch_post.sh` (the parsing is centralized there, not in this SKILL.md).

## Rename History

- **2026-05-17** (initial): created as `scott:save-tweet` (when it was a Playwright + WebFetch skill).
- **2026-05-17** (same day): renamed to `scott:x-post`. The original `save-tweet` name was action-centric (verb + noun); the new `x-post` name is subject-centric and aligns with the absorbed plugin's terminology. The old `~/.claude/skills/scott-save-tweet/` symlink dir was removed and replaced with `~/.claude/skills/scott-x-post/`.
