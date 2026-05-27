from __future__ import annotations

from typing import Any


DOODLE_VOCABULARY: list[dict[str, Any]] = [
    {"class_key": "airplane", "english": "airplane", "vi": "máy bay", "phonetic": "/ˈer.pleɪn/"},
    {"class_key": "apple", "english": "apple", "vi": "quả táo", "phonetic": "/ˈæp.əl/"},
    {"class_key": "banana", "english": "banana", "vi": "quả chuối", "phonetic": "/bəˈnæn.ə/"},
    {"class_key": "car", "english": "car", "vi": "xe ô tô", "phonetic": "/kɑːr/"},
    {"class_key": "cat", "english": "cat", "vi": "con mèo", "phonetic": "/kæt/"},
    {"class_key": "duck", "english": "duck", "vi": "con vịt", "phonetic": "/dʌk/"},
    {"class_key": "fish", "english": "fish", "vi": "con cá", "phonetic": "/fɪʃ/"},
    {"class_key": "hand", "english": "hand", "vi": "bàn tay", "phonetic": "/hænd/"},
    {"class_key": "house", "english": "house", "vi": "ngôi nhà", "phonetic": "/haʊs/"},
    {"class_key": "soccer_ball", "english": "soccer ball", "vi": "quả bóng đá", "phonetic": "/ˈsɑː.kɚ bɔːl/"},
]


def find_doodle_item(class_key: str | None) -> dict[str, Any] | None:
    if not class_key:
        return None
    normalized = class_key.strip().lower()
    return next((item for item in DOODLE_VOCABULARY if item["class_key"] == normalized), None)
