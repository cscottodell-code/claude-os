#!/usr/bin/env bash
# fetch_post.sh
# Fetch an X.com / Twitter.com post (or full thread) by URL using the FxTwitter API.
# Falls back to VxTwitter if FxTwitter fails. Outputs formatted text.
#
# Usage:
#   ./fetch_post.sh <x-or-twitter-url>           # single post
#   ./fetch_post.sh <x-or-twitter-url> thread    # full unrolled thread
#
# Exit codes:
#   0  success
#   1  bad URL (no post ID found)
#   2  API error (post not found, private, or both APIs unreachable)

set -euo pipefail

URL="${1:-}"
MODE="${2:-status}"

if [[ -z "$URL" ]]; then
  echo "Usage: $0 <x-or-twitter-url> [thread]" >&2
  exit 1
fi

# Extract post ID from URL
POST_ID=$(echo "$URL" | grep -oE 'status/[0-9]+' | grep -oE '[0-9]+' || true)
if [[ -z "$POST_ID" ]]; then
  echo "Error: could not find a post ID in URL: $URL" >&2
  exit 1
fi

# Validate mode
if [[ "$MODE" != "status" && "$MODE" != "thread" ]]; then
  echo "Error: mode must be 'status' or 'thread', got: $MODE" >&2
  exit 1
fi

# Primary call: FxTwitter v2
FX_URL="https://api.fxtwitter.com/2/${MODE}/${POST_ID}"
RESPONSE=$(curl -s --max-time 15 "$FX_URL" || true)

# Check for empty response
if [[ -z "$RESPONSE" ]]; then
  echo "Warning: FxTwitter returned empty response, trying fallback..." >&2
  RESPONSE=$(curl -s --max-time 15 "https://api.vxtwitter.com/i/status/${POST_ID}" || true)
  if [[ -z "$RESPONSE" ]]; then
    echo "Error: both FxTwitter and VxTwitter are unreachable." >&2
    exit 2
  fi
  SOURCE="vxtwitter"
else
  SOURCE="fxtwitter"
fi

# Parse and format with python3 (universally available on macOS)
python3 - "$RESPONSE" "$SOURCE" "$MODE" "$URL" <<'PYEOF'
import json
import sys

raw, source, mode, original_url = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

try:
    data = json.loads(raw)
except json.JSONDecodeError:
    print(f"Error: API returned non-JSON response:\n{raw[:500]}", file=sys.stderr)
    sys.exit(2)

def fmt_num(n):
    if n is None:
        return "not provided"
    try:
        return f"{int(n):,}"
    except (TypeError, ValueError):
        return str(n)

def extract_article_text(article):
    """X Articles store body content as Draft.js blocks. Stitch them into plain text."""
    if not article:
        return None
    title = article.get("title", "").strip()
    content = article.get("content") or {}
    blocks = content.get("blocks") or []
    paragraphs = []
    for b in blocks:
        text = (b.get("text") or "").strip()
        if text:
            btype = b.get("type", "unstyled")
            if btype.startswith("header"):
                paragraphs.append(f"\n## {text}\n")
            elif btype == "unordered-list-item":
                paragraphs.append(f"- {text}")
            elif btype == "ordered-list-item":
                paragraphs.append(f"1. {text}")
            elif btype == "blockquote":
                paragraphs.append(f"> {text}")
            else:
                paragraphs.append(text)
    body = "\n\n".join(paragraphs).strip()
    if title and body:
        return f"[X Article] {title}\n\n{body}"
    if title:
        return f"[X Article] {title}"
    return body or None

def fmt_status(s, index=None, total=None):
    lines = []
    if index is not None:
        lines.append(f"[Post {index} of {total}]")

    author = s.get("author") or {}
    name = author.get("name", "Unknown")
    handle = author.get("screen_name", "unknown")
    if index is None:
        lines.append(f"Author: {name} (@{handle})")
        lines.append(f"Posted: {s.get('created_at', 'unknown')}")
        lang = s.get("lang") or "unknown"
        lines.append(f"Language: {lang}")
        lines.append("")

    # If this is an X Article, use the article body. Otherwise use the regular text.
    article_text = extract_article_text(s.get("article"))
    body_text = article_text or s.get("text") or ""
    if not body_text.strip():
        # Last resort: raw_text (often just a t.co link for articles)
        body_text = (s.get("raw_text") or {}).get("text") or "[no text]"
    lines.append(body_text)

    cn = s.get("community_note")
    if cn and cn.get("text"):
        lines.append("")
        lines.append("Community Note:")
        lines.append(cn["text"])

    lines.append("")
    if index is None:
        lines.append("Stats")
        lines.append(f"- Likes: {fmt_num(s.get('likes'))}")
        lines.append(f"- Reposts: {fmt_num(s.get('reposts') or s.get('retweets'))}")
        lines.append(f"- Replies: {fmt_num(s.get('replies'))}")
        lines.append(f"- Quotes: {fmt_num(s.get('quotes'))}")
        lines.append(f"- Bookmarks: {fmt_num(s.get('bookmarks'))}")
        lines.append(f"- Views: {fmt_num(s.get('views'))}")
    else:
        likes = fmt_num(s.get("likes"))
        reposts = fmt_num(s.get("reposts") or s.get("retweets"))
        replies = fmt_num(s.get("replies"))
        views = fmt_num(s.get("views"))
        lines.append(f"Stats: {likes} likes, {reposts} reposts, {replies} replies, {views} views")

    # Media
    media = s.get("media") or {}
    urls = []
    for key in ("photos", "videos"):
        for item in media.get(key, []) or []:
            u = item.get("url") if isinstance(item, dict) else None
            if u:
                urls.append(u)
    if index is None:
        if urls:
            lines.append("")
            lines.append("Media:")
            for u in urls:
                lines.append(f"- {u}")
        else:
            lines.append("Media: none")

    if index is None:
        lines.append("")
        lines.append(f"Source: {s.get('url', original_url)}")
    return "\n".join(lines)

# Handle vxtwitter (flat) response
if source == "vxtwitter":
    s = {
        "text": data.get("text"),
        "author": {
            "name": data.get("user_name"),
            "screen_name": data.get("user_screen_name"),
        },
        "created_at": data.get("date"),
        "lang": data.get("lang"),
        "likes": data.get("likes"),
        "reposts": data.get("retweets"),
        "replies": data.get("replies"),
        "quotes": None,
        "bookmarks": None,
        "views": None,
        "media": {"photos": [{"url": u} for u in (data.get("mediaURLs") or [])]},
        "url": data.get("tweetURL") or original_url,
    }
    print(fmt_status(s))
    print("\n(Source: vxtwitter fallback. Quotes, bookmarks, and views not available from this API.)")
    sys.exit(0)

# Handle fxtwitter response
code = data.get("code")
if code == 400:
    print(f"Error: invalid post ID. {data.get('message', '')}", file=sys.stderr)
    sys.exit(2)
if code == 401:
    print("Error: this post is from a private/protected account.", file=sys.stderr)
    sys.exit(2)
if code == 404:
    print("Error: this post is unavailable (deleted, age-restricted, or never existed).", file=sys.stderr)
    sys.exit(2)
if code != 200:
    print(f"Error: API returned code {code}: {data.get('message', '')}", file=sys.stderr)
    sys.exit(2)

if mode == "thread":
    thread = data.get("thread") or []
    if not thread:
        # Not actually a thread, fall back to status
        s = data.get("status") or {}
        print(fmt_status(s))
        sys.exit(0)
    author = (thread[0].get("author") or {}) if thread else {}
    name = author.get("name", "Unknown")
    handle = author.get("screen_name", "unknown")
    print(f"THREAD ({len(thread)} posts) by {name} (@{handle})")
    print("")
    for i, post in enumerate(thread, 1):
        print(fmt_status(post, index=i, total=len(thread)))
        if i < len(thread):
            print("\n---\n")
else:
    s = data.get("status") or {}
    print(fmt_status(s))

PYEOF
