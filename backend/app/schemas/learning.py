from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class DoodlePredictionRequest(BaseModel):
    child_id: UUID
    assignment_id: UUID
    image_data_url: str = Field(min_length=20)
    target_class: str | None = Field(default=None, max_length=60)
    top_k: int = Field(default=3, ge=1, le=10)


class DoodlePredictionResponse(BaseModel):
    target_class: str | None
    predicted_class: str
    english: str
    vi: str
    phonetic: str | None
    confidence: float
    is_correct: bool
    top_predictions: list[dict[str, Any]]


class SubmissionCreate(BaseModel):
    child_id: UUID
    assignment_id: UUID
    target_class: str | None = Field(default=None, max_length=60)
    predicted_class: str = Field(max_length=60)
    confidence: float = Field(ge=0, le=1)
    is_correct: bool | None = None
    top_predictions: list[dict[str, Any]] | None = None
    canvas_image_data_url: str | None = Field(default=None, min_length=20)
    speech_transcript: str | None = Field(default=None, max_length=1000)
    speech_passed: bool = False


class SubmissionPublic(BaseModel):
    id: UUID
    assignment_id: UUID
    child_id: UUID
    submission_type: str
    target_class: str | None
    predicted_class: str | None
    confidence: float | None
    is_correct: bool
    top_predictions: list[dict[str, Any]] | None
    canvas_image_url: str | None
    speech_transcript: str | None
    speech_passed: bool
    stars_earned: int
    coins_earned: int
    created_at: datetime
