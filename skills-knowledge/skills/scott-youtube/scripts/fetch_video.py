#!/usr/bin/env python3
"""
fetch_video.py
Extract metadata and full transcript from a YouTube video URL.

Usage:
    python3 fetch_video.py <youtube-url>

Output (printed to stdout):
    === METADATA ===
    Title, Channel, Posted, Duration, Views, Likes
    === DESCRIPTION ===
    (short description)
    === TRANSCRIPT ===
    [0:01] text
    ...

Exit codes:
    0  success
    1  bad URL or no video ID found
    2  fetch failure (network, blocked, deleted video)
    3  no transcript available (captions disabled by uploader)
"""

from __future__ import annotations

import sys
import re
import json
import urllib.request
import urllib.error
import subprocess

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"


def extract_video_id(url: str) -> str | None:
    """Parse a YouTube URL and return the video ID, or None if not found."""
    patterns = [
        r"(?:v=|youtu\.be/|/shorts/|/embed/|/v/)([A-Za-z0-9_-]{11})",
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    # Maybe the URL is already just an ID
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", url):
        return url
    return None


def fetch_watch_page(video_id: str) -> str:
    url = f"https://www.youtube.com/watch?v={video_id}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise SystemExit(f"Error: video not found (404). The video may have been removed.")
        raise SystemExit(f"Error: HTTP {e.code} fetching watch page.")
    except Exception as e:
        raise SystemExit(f"Error: could not fetch watch page: {e}")


def parse_metadata(html: str, video_id: str) -> dict:
    """Pull title, channel, duration, views, likes, description, upload date from the watch page HTML."""
    meta = {
        "video_id": video_id,
        "url": f"https://www.youtube.com/watch?v={video_id}",
    }

    # videoDetails block from ytInitialPlayerResponse
    m = re.search(r"ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|</script>)", html)
    if m:
        try:
            player_data = json.loads(m.group(1))
            vd = player_data.get("videoDetails") or {}
            meta["title"] = vd.get("title")
            meta["channel"] = vd.get("author")
            meta["channel_id"] = vd.get("channelId")
            meta["duration_seconds"] = int(vd.get("lengthSeconds") or 0)
            meta["views"] = int(vd.get("viewCount") or 0)
            meta["description"] = vd.get("shortDescription") or ""
            meta["keywords"] = vd.get("keywords") or []
            meta["is_live"] = bool(vd.get("isLiveContent"))
        except Exception:
            pass

    # uploadDate from JSON-LD (schema.org)
    ld_match = re.search(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S)
    if ld_match:
        try:
            ld = json.loads(ld_match.group(1))
            meta["upload_date"] = ld.get("uploadDate")
        except Exception:
            pass

    # Like count: look for "likeCount":"<digits>" pattern
    lm = re.search(r'"likeCount":"(\d+)"', html)
    if lm:
        meta["likes"] = int(lm.group(1))

    # Fallback duration extraction from ISO format if needed
    if not meta.get("duration_seconds"):
        dm = re.search(r'"duration":"PT(\d+M\d+S|\d+S|\d+H\d+M\d+S)"', html)
        if dm:
            meta["duration_iso"] = "PT" + dm.group(1)

    return meta


def fmt_duration(seconds: int) -> str:
    if not seconds:
        return "unknown"
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def fmt_num(n) -> str:
    if n is None:
        return "not available"
    try:
        return f"{int(n):,}"
    except (TypeError, ValueError):
        return str(n)


def ensure_youtube_transcript_api():
    """Install youtube-transcript-api if not already available.

    Tries pip install with --break-system-packages first (needed on Python 3.11+
    under PEP 668). Falls back without the flag for older pip versions that
    do not recognize it.
    """
    try:
        import youtube_transcript_api  # noqa
        return
    except ImportError:
        pass
    print("Installing youtube-transcript-api (one-time setup)...", file=sys.stderr)
    base_cmd = [sys.executable, "-m", "pip", "install", "--quiet", "youtube-transcript-api"]
    # Try with --break-system-packages first (Python 3.11+ / PEP 668 environments)
    result = subprocess.run(base_cmd + ["--break-system-packages"], capture_output=True)
    if result.returncode == 0:
        return
    # Retry without the flag (older pip; flag unsupported)
    result = subprocess.run(base_cmd, capture_output=True)
    if result.returncode != 0:
        msg = result.stderr.decode("utf-8", errors="replace") or result.stdout.decode("utf-8", errors="replace")
        print(f"Error: pip install of youtube-transcript-api failed:\n{msg[:500]}", file=sys.stderr)
        sys.exit(2)


def fetch_transcript(video_id: str) -> list[dict]:
    """Fetch the transcript as a list of {start, text} dicts. Raises if unavailable."""
    ensure_youtube_transcript_api()
    from youtube_transcript_api import YouTubeTranscriptApi
    ytt = YouTubeTranscriptApi()
    transcript = ytt.fetch(video_id)
    # Normalize: each segment has .start, .duration, .text attrs in v1.x
    segments = []
    for s in transcript:
        segments.append({
            "start": float(s.start),
            "text": s.text.strip(),
        })
    return segments


def fmt_timestamp(seconds: float) -> str:
    s = int(seconds)
    h, rem = divmod(s, 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def main():
    if len(sys.argv) < 2:
        print("Usage: fetch_video.py <youtube-url>", file=sys.stderr)
        sys.exit(1)

    url = sys.argv[1]
    video_id = extract_video_id(url)
    if not video_id:
        print(f"Error: could not extract a video ID from URL: {url}", file=sys.stderr)
        sys.exit(1)

    # Fetch watch page and parse metadata
    html = fetch_watch_page(video_id)
    meta = parse_metadata(html, video_id)

    # If we couldn't pull a title or channel, the video is almost certainly
    # unavailable (deleted, private, region-blocked, or wrong ID).
    if not meta.get("title") and not meta.get("channel"):
        print(f"Error: video {video_id} is unavailable. It may be deleted, private, or region-blocked.", file=sys.stderr)
        sys.exit(2)

    # Print metadata block (use 'or unknown' so None values render cleanly)
    print("=== METADATA ===")
    print(f"Title: {meta.get('title') or 'unknown'}")
    print(f"Channel: {meta.get('channel') or 'unknown'}")
    print(f"Posted: {meta.get('upload_date') or 'unknown'}")
    print(f"Duration: {fmt_duration(meta.get('duration_seconds') or 0)}")
    print(f"Views: {fmt_num(meta.get('views'))}")
    print(f"Likes: {fmt_num(meta.get('likes'))}")
    print(f"Source: {meta['url']}")
    if meta.get("is_live"):
        print("Note: this is a live or formerly-live stream.")
    print()

    # Print description (truncate to ~1500 chars to keep output reasonable)
    desc = (meta.get("description") or "").strip()
    print("=== DESCRIPTION ===")
    if desc:
        if len(desc) > 1500:
            print(desc[:1500] + "\n[...description truncated...]")
        else:
            print(desc)
    else:
        print("(no description provided)")
    print()

    # Fetch transcript
    print("=== TRANSCRIPT ===")
    try:
        segments = fetch_transcript(video_id)
    except Exception as e:
        err = str(e)
        # Common error types from youtube-transcript-api
        if "TranscriptsDisabled" in type(e).__name__ or "NoTranscriptFound" in type(e).__name__:
            print("(no transcript available, captions are disabled or none were generated)")
            sys.exit(3)
        if "VideoUnavailable" in type(e).__name__:
            print("(video unavailable)")
            sys.exit(2)
        print(f"(transcript fetch failed: {type(e).__name__}: {err[:200]})")
        sys.exit(2)

    if not segments:
        print("(transcript is empty)")
        sys.exit(3)

    for seg in segments:
        ts = fmt_timestamp(seg["start"])
        # Skip pure music markers like [♪♪♪] only if also empty
        text = seg["text"]
        if text:
            print(f"[{ts}] {text}")

    print()
    print(f"=== END (transcript: {len(segments)} segments) ===")


if __name__ == "__main__":
    main()
