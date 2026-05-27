from __future__ import annotations

import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import get_settings


class AIServiceError(RuntimeError):
    pass


def predict_doodle(image_data_url: str, top_k: int = 3) -> dict[str, Any]:
    settings = get_settings()
    url = f"{settings.ai_service_url.rstrip('/')}/predict"
    body = json.dumps({"image_base64": image_data_url, "top_k": top_k}).encode("utf-8")
    request = Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")

    try:
        with urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise AIServiceError(detail or f"AI_SERVICE_HTTP_{exc.code}") from exc
    except URLError as exc:
        raise AIServiceError("AI_SERVICE_UNAVAILABLE") from exc
