from urllib.parse import parse_qs, urlparse


def extract_youtube_video_id(url: str) -> str | None:
    parsed = urlparse(url.strip())
    host = parsed.netloc.lower().replace("www.", "")

    if host == "youtu.be":
        video_id = parsed.path.strip("/").split("/")[0]
        return video_id or None

    if host in {"youtube.com", "m.youtube.com", "music.youtube.com"}:
        if parsed.path == "/watch":
            return parse_qs(parsed.query).get("v", [None])[0]
        if parsed.path.startswith("/embed/") or parsed.path.startswith("/shorts/"):
            parts = parsed.path.strip("/").split("/")
            return parts[1] if len(parts) > 1 else None

    return None
