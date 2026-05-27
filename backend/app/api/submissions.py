from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_parent
from app.models.submission import Submission
from app.models.user import User
from app.schemas.learning import SubmissionCreate, SubmissionPublic
from app.services.doodle_vocabulary import find_doodle_item
from app.services.learning_service import (
    build_submission_public,
    calculate_reward,
    get_learning_assignment,
    save_canvas_image,
)
from app.services.submission_types import DOODLE_ATTEMPT, NOT_REQUIRED

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.get("", response_model=list[SubmissionPublic])
def list_child_submissions(
    current_user: Annotated[User, Depends(require_parent)],
    db: Annotated[Session, Depends(get_db)],
    child_id: UUID = Query(),
) -> list[SubmissionPublic]:
    rows = db.scalars(
        select(Submission)
        .where(Submission.child_id == child_id)
        .order_by(Submission.created_at.desc())
        .limit(50)
    ).all()
    visible = []
    for submission in rows:
        if get_learning_assignment(db, current_user.id, child_id, submission.assignment_id):
            visible.append(SubmissionPublic(**build_submission_public(submission)))
    return visible


@router.post("", response_model=SubmissionPublic)
def create_submission(
    payload: SubmissionCreate,
    current_user: Annotated[User, Depends(require_parent)],
    db: Annotated[Session, Depends(get_db)],
) -> SubmissionPublic:
    context = get_learning_assignment(db, current_user.id, payload.child_id, payload.assignment_id)
    if not context:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")

    child = context[0]
    if payload.target_class and not find_doodle_item(payload.target_class):
        raise HTTPException(status_code=400, detail="TARGET_CLASS_NOT_SUPPORTED")

    expected_correct = bool(payload.target_class and payload.predicted_class == payload.target_class)
    is_correct = expected_correct if payload.is_correct is None else bool(payload.is_correct and expected_correct)
    stars, coins = calculate_reward(is_correct, payload.speech_passed)

    try:
        canvas_url = save_canvas_image(payload.canvas_image_data_url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    submission = Submission(
        assignment_id=payload.assignment_id,
        child_id=payload.child_id,
        submission_type=DOODLE_ATTEMPT,
        target_class=payload.target_class,
        predicted_class=payload.predicted_class,
        confidence=payload.confidence,
        is_correct=is_correct,
        top_predictions=payload.top_predictions,
        canvas_image_url=canvas_url,
        speech_transcript=payload.speech_transcript,
        speech_passed=payload.speech_passed,
        stars_earned=stars,
        coins_earned=coins,
        submitted_at=None,
        grading_status=NOT_REQUIRED,
    )
    child.total_stars += stars
    child.total_coins += coins
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return SubmissionPublic(**build_submission_public(submission))
