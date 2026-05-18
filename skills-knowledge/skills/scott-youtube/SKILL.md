---
name: scott:youtube
description: |
  Extract a YouTube video's metadata, description, and full transcript into a
  structured .md research file in Scott's Obsidian vault. Uses an external
  python script (scrapes the watch page for metadata, fetches transcript via
  youtube-transcript-api). Produces a hybrid v2-style file: synthesis sections
  (Thesis, Key Points, Frameworks, Examples, Evidence, Action Items) plus
  verbatim sections (Memorable Quotes, Description, Full Transcript) with
  timestamps throughout. YAML frontmatter carries channel, posted date,
  duration, views, likes, has_transcript for Obsidian queryability.

  Use when Scott shares a youtube.com or youtu.be URL and wants the content
  captured. This is a standalone extraction tool, not tied to any specific
  downstream workflow. Scott decides where to save it and what to do with it
  afterward.
user_invocable: true
invocation_hint: /scott:youtube <url> - Extract a YouTube video into a markdown source file
input_examples:
  - "/scott:youtube https://www.youtube.com/watch?v=UF8uR6Z6KLc"
  - "/scott:youtube https://youtu.be/abc123"
section: tools
---

# YouTube Video

Extract a YouTube video's metadata + transcript into a structured `.md` file, following any linked resources from the description for full context.

## Step 1: Extract Video Content (Primary)

Run the bundled script. It handles URL parsing, watch-page scraping (metadata + description), and transcript fetch via `youtube-transcript-api` (auto-installed on first use).

```bash
python3 ~/Scott/claude-os/skills-knowledge/skills/scott-youtube/scripts/fetch_video.py "<url>"
```

**Script exit codes:**
- `0` success, output is metadata + description + full timestamped transcript
- `1` bad URL (no 11-char video ID found), tell Scott to double-check
- `2` video unavailable (deleted, private, region-blocked, or pip install failed)
- `3` no transcript available (uploader disabled captions and no auto-captions)

**What the script returns** (three sections separated by `===` markers):
- `=== METADATA ===` Title, Channel, Posted (ISO date), Duration, Views, Likes, Source, optional "Note: live stream"
- `=== DESCRIPTION ===` Full description (truncated to ~1500 chars)
- `=== TRANSCRIPT ===` Timestamped lines, one per segment, format `[M:SS] text` or `[H:MM:SS] text`
- `=== END (transcript: N segments) ===`

## Step 2: Fallbacks (only if Step 1 fails)

- **Exit code 1 (bad URL)**: tell Scott the URL does not contain a valid video ID, ask him to recheck.
- **Exit code 2 (video unavailable)**: tell Scott the video is gone (deleted, private, region-blocked). Try a `cache:` search if you suspect recent removal.
- **Exit code 3 (no transcript)**: the script still printed metadata + description. You can write a metadata-only file or ask Scott if he wants to skip. See "When Transcript Is Unavailable" below.
- **`pip install` failed** (rare, exit 2 with pip error): tell Scott to install manually with `python3 -m pip install youtube-transcript-api --break-system-packages` then retry.

## Step 3: Follow Linked Resources (the high-value step)

YouTube descriptions often link to GitHub repos, blog posts, the speaker's other content, sponsors, books, papers. **Always fetch the meaningful ones.**

- Pull every non-youtube.com URL from the description (filter out timestamp anchors like `#t=120`).
- WebFetch each one in parallel.
- Skip pure tracking links (utm_*, bit.ly redirects to known sponsors, etc.) unless they look substantive.
- If a GitHub repo or paper is linked, fetch the README / abstract and note key facts.

## Step 4: Update Outdated Information

If the video references specific tools, versions, frameworks, or stats, search for the current state. Note updates but do not rewrite the source's synthesis to reflect them; note as a separate "Notes on freshness" line at the end if needed.

## Step 5: Save Location

Save to `~/Scott/growth-os/raw/research/global/` by default. No need to ask unless Scott specifies a different path.

## Step 6: Write the Source File

The output is a **hybrid v2 format**: synthesis sections (Claude's reading of the video, with timestamps as anchors) plus verbatim sections (quotes + description + full transcript in blockquotes). Frontmatter carries metadata for Obsidian queryability.

This departs from the strict scott:x-post v2 spec (which forbids synthesis) because a 30-minute video's verbatim transcript is unreadable; the synthesis layer is what makes captured videos useful for future retrieval.

### File Structure (template)

```markdown
---
type: reference
status: draft
source_url: <full https://www.youtube.com/watch?v=... URL>
video_id: <11-char video ID>
channel: <channel name as printed by the script>
posted: <YYYY-MM-DD, just the date from the upload_date>
captured: <YYYY-MM-DD, today>
duration_seconds: <int from script>
duration_display: <M:SS or H:MM:SS>
views: <int>
likes: <int or null if hidden>
has_transcript: <true | false>
is_live: <true | false>
linked_resources:
  - <url1 from description>
  - <url2>
tags:
  - types/reference
  - statuses/draft
---

# <Video Title>

## Summary

<3 to 5 sentences. Claude's overview of how the video makes its case and what the audience walks away with. Synthesis, not blockquoted.>

## Thesis

<1 to 2 sentence statement of the video's central argument or claim. Synthesis.>

## Key Points

1. <Distinct point that supports the thesis, with enough detail to stand alone.> [<timestamp>]
2. <Next point.> [<timestamp>]
   <(Aim for completeness; a 22-minute talk usually has 12 to 20 distinct points. Order by video structure so reader can jump to source.)>

## Concepts & Definitions

- <Term>: <How the speaker defines or explains it.> [<timestamp>]

## Distinctions Drawn

- <X vs Y>: <How the speaker distinguishes them and why it matters.> [<timestamp>]

## Frameworks & Mental Models

- <Name>: <Brief explanation of how it works and what it organizes.> [<timestamp>]

## Examples & Stories

- <Brief description of the example or story and what point it illustrates.> [<timestamp>]

## Evidence & References

- <Stat, study, citation, or external reference the speaker uses.> [<timestamp>]

## Action Items

1. <Concrete step the viewer could take, verb-first.> [<timestamp>]

## Memorable Quotes (verbatim)

> "<direct quote from transcript, exact wording, lightly cleaned only if obvious auto-caption error>" [<timestamp>]
>
> "<next direct quote>" [<timestamp>]

## Linked: <resource name from description> (<short attribution>)

> <verbatim body of the linked resource, blockquoted>

[Repeat `## Linked: ...` for each linked resource worth keeping.]

## Description (verbatim)

> <verbatim description text from the script's DESCRIPTION block>

## Full Transcript (verbatim)

> [0:01] First line of dialogue
> [0:05] Next line
> [0:08] ...

---

#types/reference #statuses/draft
```

### Format rules

- **Skip empty sections.** If a video has no distinctions, no Distinctions Drawn section. If no examples, no Examples section. Don't write "(none)" or "N/A".
- **Synthesis sections (Summary through Action Items) are Claude's reading**, not blockquoted. They MAY paraphrase the speaker; that's the job.
- **Verbatim sections (Memorable Quotes, Description, Full Transcript) are blockquoted** and use the speaker's exact words. Auto-caption errors may be lightly cleaned (typos, obvious mishearings) but not paraphrased.
- **Timestamps everywhere in synthesis sections.** Every point, definition, distinction, example, quote, and reference gets a `[M:SS]` or `[H:MM:SS]` timestamp from the transcript. Pick the moment the idea is first introduced.
- **Linked resources go between Memorable Quotes and Description** so verbatim source material (Description, Transcript) stays at the bottom as the authoritative archive.
- **Full Transcript is the longest section** (often 80%+ of file size). It is the verbatim source-of-truth and must be included unless the video has no transcript (exit code 3).
- **Dual-write tags**: YAML `tags:` array + body hashtag line on the last line.
- **Tag at capture**: `types/reference` + `statuses/draft` immediately. (Same departure from "tag at use" rule as scott:x-post.)

### Naming Convention

`[topic-slug]-[channel-or-author-slug]-[year].md`

Examples:
- `commencement-address-stanford-2008.md`
- `vibe-coding-debate-fireship-2025.md`
- `karpathy-talk-microsoft-2026.md`
- `me-at-the-zoo-jawed-2005.md`

Channel slug is lowercase-hyphen from the channel name; topic slug is lowercase-hyphen from the video title or main topic.

## What NOT To Do

- Don't fabricate quotes the transcript did not contain.
- Don't skip the Full Transcript section unless exit code 3 (no transcript available).
- Don't padding-fill empty synthesis sections; cut them.
- Don't paraphrase the Memorable Quotes section; use exact transcript wording.
- Don't reformat the timestamps; keep them in the `[M:SS]` form the script returns.
- Don't skip linked resources in the description (they often have the real substance: GitHub repos, the paper being discussed, the speaker's blog).
- Don't overwrite an existing file without asking Scott first.
- Don't try to summarize music videos or non-spoken content beyond metadata; the transcript will be `[♪♪♪]` markers; skip the synthesis sections.

## When Transcript Is Unavailable (exit code 3)

The script still printed METADATA and DESCRIPTION. Two paths:

1. **Metadata-only file**: write the frontmatter with `has_transcript: false`, include the Description section verbatim, skip all synthesis and quote sections. Add a `## Notes` section at the end noting "Transcript unavailable; this file captures metadata + description only." Save it.
2. **Skip entirely**: tell Scott the video has no captions and ask if he wants the metadata-only file or to skip.

Ask Scott which when the description is thin (under ~200 chars). Default to option 1 when description is rich.

## When Content Is Too Thin

- **Short video, short description, no notable quotes**: tell Scott what you found and ask if he wants to proceed with a minimal file.
- **Pure music video**: metadata-only is fine; no point synthesizing `[♪♪♪]` segments.

## Script Maintenance

The script lives at `scripts/fetch_video.py` alongside this SKILL.md. It was absorbed from the `youtube-video-extractor` plugin on 2026-05-17 and patched for Python 3.9 compatibility (added `from __future__ import annotations` and made `--break-system-packages` retry-on-failure for older pip).

If `youtube-transcript-api` API changes (it has been historically stable since v1.x), update the `fetch_transcript` function. If YouTube changes the watch page HTML structure (the regex-based parsers in `parse_metadata` are the brittle part), update the regex patterns.

## Sister skill in Cowork

This skill is the Claude Code CLI version. The Cowork equivalent lives at `~/Scott/growth-os/wiki/system/cowork-tasks/youtube.md` (source) with a plugin bundle at `youtube.zip`. The Cowork version inlines the python script body because Cowork's filesystem sandbox does not include the claude-os repo.

If this file's Step 6 format spec changes, mirror the change in the Cowork version, rebuild the plugin zip, and re-upload to Cowork's Customize section.
