"""
Bot protection middleware.

Blocks known AI crawlers by User-Agent, rate-limits by IP,
and provides Cloudflare setup guidance in comments.

Cloudflare setup (WAF → Custom Rules):
  Field: http.user_agent
  Operator: contains (any of the bot UA patterns below)
  Action: Block
  Also enable "Bot Fight Mode" under Security → Bots.
"""

import time
import re
from collections import defaultdict, deque
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

# Known AI crawler / scraper user-agents (case-insensitive substring match)
BLOCKED_UA_PATTERNS = [
    "claudebot",
    "claude-web",
    "anthropic",
    "gptbot",
    "chatgpt-user",
    "openai",
    "google-extended",
    "googleother",
    "meta-externalagent",
    "meta-externalfetcher",
    "diffbot",
    "semrushbot",
    "ahrefsbot",
    "mj12bot",
    "dotbot",
    "petalbot",
    "bytespider",
    "python-httpx",
    "python-requests",
    "go-http-client",
    "scrapy",
    "wget",
    "libwww-perl",
    "curl/",
    "java/",
    "okhttp",
    "axios",
]

_COMPILED = re.compile(
    "|".join(re.escape(p) for p in BLOCKED_UA_PATTERNS),
    re.IGNORECASE,
)

# Rate limit: (requests, window_seconds)
RATE_LIMIT = 60
RATE_WINDOW = 60  # 1 minute

# Simple in-memory sliding window — swap for Redis in production
_ip_windows: dict[str, deque] = defaultdict(deque)


def _is_rate_limited(ip: str) -> bool:
    now = time.time()
    window = _ip_windows[ip]
    cutoff = now - RATE_WINDOW
    while window and window[0] < cutoff:
        window.popleft()
    if len(window) >= RATE_LIMIT:
        return True
    window.append(now)
    return False


class BotProtectionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        ua = request.headers.get("user-agent", "")

        if _COMPILED.search(ua):
            return JSONResponse(
                {"detail": "Forbidden"},
                status_code=403,
                headers={"X-Block-Reason": "bot-ua"},
            )

        ip = request.client.host if request.client else "unknown"
        if _is_rate_limited(ip):
            return JSONResponse(
                {"detail": "Too many requests"},
                status_code=429,
                headers={"Retry-After": str(RATE_WINDOW)},
            )

        return await call_next(request)
