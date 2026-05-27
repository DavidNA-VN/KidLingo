from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class TeacherSubmissionListItem(BaseModel):
    id: UUID
    submission_type: str
    child_id: UUID
    child_name: str
    parent_name: str
    parent_email: str
    class_id: UUID
    class_name: str
    assignment_id: UUID
    assignment_title: str
    lesson_title: str
    answer_file_url: str | None
    target_class: str | None
    predicted_class: str | None
    confidence: float | None
    is_correct: bool
    speech_passed: bool
    speech_transcript: str | None
    stars_earned: int
    coins_earned: int
    submitted_at: datetime | None
    graded_at: datetime | None
    graded_by: UUID | None
    score: float | None
    max_score: float | None
    grading_status: str
    returned_at: datetime | None
    teacher_feedback: str | None
    reviewed_at: datetime | None
    reviewed_by: UUID | None
    created_at: datetime
    review_reason: str | None


class TeacherSubmissionDetail(TeacherSubmissionListItem):
    top_predictions: list[dict[str, Any]] | None
    canvas_image_url: str | None
    lesson_materials: list[str]


class TeacherSubmissionReviewUpdate(BaseModel):
    teacher_feedback: str | None = Field(default=None, max_length=2000)
    reviewed: bool = True
    score: float | None = Field(default=None, ge=0, le=100)
    max_score: float | None = Field(default=None, gt=0, le=100)
    grading_status: str | None = Field(default=None, min_length=3, max_length=30)
