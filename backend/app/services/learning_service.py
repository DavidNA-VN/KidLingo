from __future__ import annotations

import base64
import binascii
import uuid
from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.assignment import Assignment
from app.models.child import Child, ClassChild
from app.models.classroom import Class
from app.models.lesson import Lesson, LessonMaterial
from app.models.submission import Submission
from app.models.user import User


def get_learning_assignment(
    db: Session, parent_id: UUID, child_id: UUID, assignment_id: UUID
) -> tuple[Child, Assignment, Class, User, Lesson, list[LessonMaterial]] | None:
    row = db.execute(
        select(Child, Assignment, Class, User, Lesson)
        .join(ClassChild, ClassChild.child_id == Child.id)
        .join(Assignment, Assignment.class_id == ClassChild.class_id)
        .join(Class, Class.id == Assignment.class_id)
        .join(User, User.id == Class.teacher_id)
        .join(Lesson, Lesson.id == Assignment.lesson_id)
        .where(
            Child.id == child_id,
            Child.parent_id == parent_id,
            Child.status == "ACTIVE",
            ClassChild.status == "ACTIVE",
            Assignment.id == assignment_id,
            Assignment.status == "PUBLISHED",
        )
    ).first()
    if not row:
        return None
    child, assignment, classroom, teacher, lesson = row
    materials = db.scalars(
        select(LessonMaterial)
        .where(LessonMaterial.lesson_id == lesson.id)
        .order_by(LessonMaterial.sort_order.asc(), LessonMaterial.created_at.asc())
    ).all()
    return child, assignment, classroom, teacher, lesson, list(materials)


def get_doodle_vocabulary(materials: list[LessonMaterial]) -> list[dict[str, Any]]:
    vocabulary: list[dict[str, Any]] = []
    for material in materials:
        if material.type == "DOODLE_VOCAB" and material.vocabulary_items:
            vocabulary.extend(material.vocabulary_items)
    return vocabulary


def find_vocabulary_item(vocabulary: list[dict[str, Any]], class_key: str) -> dict[str, Any] | None:
    normalized = class_key.strip().lower()
    for item in vocabulary:
        if str(item.get("class_key", "")).strip().lower() == normalized:
            return item
    return None


def calculate_reward(is_correct: bool, speech_passed: bool) -> tuple[int, int]:
    if is_correct and speech_passed:
        return 3, 10
    if is_correct:
        return 2, 7
    return 1, 3


def save_canvas_image(image_data_url: str | None) -> str | None:
    if not image_data_url:
        return None
    if not image_data_url.startswith("data:image/png;base64,"):
        raise ValueError("ONLY_PNG_DATA_URL_SUPPORTED")

    try:
        raw = base64.b64decode(image_data_url.split(",", 1)[1], validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("INVALID_CANVAS_IMAGE") from exc

    settings = get_settings()
    target_dir = settings.upload_path / "submissions"
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4()}.png"
    target_path = target_dir / filename
    _assert_inside_uploads(target_path, settings.upload_path)
    target_path.write_bytes(raw)
    return f"/uploads/submissions/{filename}"


def _assert_inside_uploads(path: Path, upload_path: Path) -> None:
    resolved_path = path.resolve()
    resolved_root = upload_path.resolve()
    if resolved_root not in resolved_path.parents and resolved_path != resolved_root:
        raise ValueError("INVALID_UPLOAD_PATH")


def build_submission_public(submission: Submission) -> dict[str, Any]:
    return {
        "id": submission.id,
        "assignment_id": submission.assignment_id,
        "child_id": submission.child_id,
        "submission_type": submission.submission_type,
        "target_class": submission.target_class,
        "predicted_class": submission.predicted_class,
        "confidence": float(submission.confidence) if submission.confidence is not None else None,
        "is_correct": submission.is_correct,
        "top_predictions": submission.top_predictions,
        "canvas_image_url": submission.canvas_image_url,
        "speech_transcript": submission.speech_transcript,
        "speech_passed": submission.speech_passed,
        "stars_earned": submission.stars_earned,
        "coins_earned": submission.coins_earned,
        "created_at": submission.created_at,
    }
