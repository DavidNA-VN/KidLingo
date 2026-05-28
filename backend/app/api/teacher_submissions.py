from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_teacher
from app.models.user import User
from app.schemas.submission import (
    TeacherSubmissionDetail,
    TeacherSubmissionListItem,
    TeacherSubmissionReviewUpdate,
)
from app.services.submission_review_service import (
    get_teacher_submission_detail,
    list_teacher_submissions,
    update_teacher_submission_review,
)

router = APIRouter(prefix="/teacher", tags=["teacher-submissions"])


@router.get("/submissions", response_model=list[TeacherSubmissionListItem])
def get_submissions(
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
    class_id: UUID | None = None,
    assignment_id: UUID | None = None,
    child_id: UUID | None = None,
    is_correct: bool | None = None,
    speech_passed: bool | None = None,
    reviewed: bool | None = None,
    grading_status: Annotated[str | None, Query(max_length=30)] = None,
    score_min: Annotated[float | None, Query(ge=0, le=100)] = None,
    score_max: Annotated[float | None, Query(ge=0, le=100)] = None,
    late: bool | None = None,
    confidence_min: Annotated[float | None, Query(ge=0, le=1)] = None,
    confidence_max: Annotated[float | None, Query(ge=0, le=1)] = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> list[TeacherSubmissionListItem]:
    try:
        return list_teacher_submissions(
            db,
            current_user.id,
            class_id=class_id,
            assignment_id=assignment_id,
            child_id=child_id,
            is_correct=is_correct,
            speech_passed=speech_passed,
            reviewed=reviewed,
            grading_status=grading_status,
            score_min=score_min,
            score_max=score_max,
            late=late,
            confidence_min=confidence_min,
            confidence_max=confidence_max,
            date_from=date_from,
            date_to=date_to,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/classes/{class_id}/submissions", response_model=list[TeacherSubmissionListItem])
def get_class_submissions(
    class_id: UUID,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> list[TeacherSubmissionListItem]:
    return list_teacher_submissions(db, current_user.id, class_id=class_id)


@router.get("/submissions/{submission_id}", response_model=TeacherSubmissionDetail)
def get_submission_detail(
    submission_id: UUID,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> TeacherSubmissionDetail:
    detail = get_teacher_submission_detail(db, current_user.id, submission_id)
    if not detail:
        raise HTTPException(status_code=404, detail="SUBMISSION_NOT_FOUND")
    return detail


@router.patch("/submissions/{submission_id}/review", response_model=TeacherSubmissionDetail)
def patch_submission_review(
    submission_id: UUID,
    payload: TeacherSubmissionReviewUpdate,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> TeacherSubmissionDetail:
    try:
        detail = update_teacher_submission_review(
            db,
            current_user.id,
            submission_id,
            feedback=payload.teacher_feedback,
            reviewed=payload.reviewed,
            score=payload.score,
            max_score=payload.max_score,
            grading_status=payload.grading_status,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not detail:
        raise HTTPException(status_code=404, detail="SUBMISSION_NOT_FOUND")
    return detail
