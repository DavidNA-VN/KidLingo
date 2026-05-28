import shutil
from pathlib import Path
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import require_parent
from app.models.assignment import Assignment
from app.models.child import Child, ClassChild
from app.models.classroom import Class
from app.models.submission import Submission
from app.models.user import User
from app.schemas.parent import (
    JoinClassRequest,
    ParentAssignmentDetail,
    ParentAssignmentListItem,
    ParentChildCreate,
    ParentChildPublic,
    ParentChildUpdate,
    ParentClassPublic,
    ParentDashboardSummary,
    ParentProgressSummary,
    ParentJoinClassResponse,
    ParentSubmissionHistoryItem,
)
from app.services.submission_types import GRADED_STATUSES, PDF_ANSWER
from app.services.assignment_status_service import close_overdue_assignments
from app.services.parent_assignment_service import (
    get_child_assignment_detail,
    get_parent_child,
    join_class_by_code,
    list_child_assignments,
    list_child_classes,
    list_parent_children,
)
from app.services.parent_progress_service import (
    get_child_progress,
    get_parent_dashboard_summary,
    list_parent_child_submissions,
)

router = APIRouter(prefix="/parent", tags=["parent"])

MAX_SUBMISSION_FILE_BYTES = 15 * 1024 * 1024


def _validate_answer_file(file: UploadFile) -> str:
    suffix = Path(file.filename or "").suffix.lower()
    allowed_suffixes = {".doc", ".docx", ".pdf"}
    allowed_types = {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    if (suffix and suffix not in allowed_suffixes) or (not suffix and file.content_type not in allowed_types):
        raise HTTPException(status_code=400, detail="INVALID_FILE_TYPE")
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_SUBMISSION_FILE_BYTES:
        raise HTTPException(status_code=400, detail="FILE_TOO_LARGE")
    return suffix or ".docx"


def _save_answer_file(file: UploadFile, suffix: str) -> str:
    from uuid import uuid4

    settings = get_settings()
    target_dir = settings.upload_path / "submissions" / "answers"
    target_dir.mkdir(parents=True, exist_ok=True)
    safe_name = f"{uuid4()}{suffix}"
    target_path = target_dir / safe_name
    with target_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return f"/uploads/submissions/answers/{safe_name}"


@router.get("/dashboard", response_model=ParentDashboardSummary)
def get_parent_dashboard(
    current_user: Annotated[User, Depends(require_parent)],
    db: Annotated[Session, Depends(get_db)],
) -> ParentDashboardSummary:
    return get_parent_dashboard_summary(db, current_user.id)


@router.get("/children", response_model=list[ParentChildPublic])
def get_children(
    current_user: Annotated[User, Depends(require_parent)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ParentChildPublic]:
    return list_parent_children(db, current_user.id)


@router.post("/children", response_model=ParentChildPublic)
def create_child(
    payload: ParentChildCreate,
    current_user: Annotated[User, Depends(require_parent)],
    db: Annotated[Session, Depends(get_db)],
) -> ParentChildPublic:
    child = Child(
        parent_id=current_user.id,
        display_name=payload.display_name.strip(),
        birth_year=payload.birth_year,
        avatar_url=payload.avatar_url,
        status="ACTIVE",
    )
    db.add(child)
    db.commit()
    return next(item for item in list_parent_children(db, current_user.id) if item.id == child.id)


@router.patch("/children/{child_id}", response_model=ParentChildPublic)
def update_child(
    child_id: UUID,
    payload: ParentChildUpdate,
    current_user: Annotated[User, Depends(require_parent)],
    db: Annotated[Session, Depends(get_db)],
) -> ParentChildPublic:
    child = get_parent_child(db, current_user.id, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="CHILD_NOT_FOUND")
    if payload.display_name is not None:
        child.display_name = payload.display_name.strip()
    if "birth_year" in payload.model_fields_set:
        child.birth_year = payload.birth_year
    if "avatar_url" in payload.model_fields_set:
        child.avatar_url = payload.avatar_url
    if payload.status is not None:
        status_value = payload.status.upper().strip()
        if status_value not in {"ACTIVE", "ARCHIVED"}:
            raise HTTPException(status_code=400, detail="INVALID_CHILD_STATUS")
        child.status = status_value
    db.commit()
    return next(item for item in list_parent_children(db, current_user.id) if item.id == child_id)


@router.post("/children/{child_id}/join-class", response_model=ParentJoinClassResponse)
def join_class(
    child_id: UUID,
    payload: JoinClassRequest,
    current_user: Annotated[User, Depends(require_parent)],
    db: Annotated[Session, Depends(get_db)],
) -> ParentJoinClassResponse:
    try:
        result = join_class_by_code(db, current_user.id, child_id, payload.class_code)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=404, detail="CHILD_NOT_FOUND")
    return result


@router.get("/children/{child_id}/classes", response_model=list[ParentClassPublic])
def get_child_classes(
    child_id: UUID,
    current_user: Annotated[User, Depends(require_parent)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ParentClassPublic]:
    classes = list_child_classes(db, current_user.id, child_id)
    if classes is None:
        raise HTTPException(status_code=404, detail="CHILD_NOT_FOUND")
    return classes


@router.get("/children/{child_id}/assignments", response_model=list[ParentAssignmentListItem])
def get_child_assignments(
    child_id: UUID,
    current_user: Annotated[User, Depends(require_parent)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ParentAssignmentListItem]:
    assignments = list_child_assignments(db, current_user.id, child_id)
    if assignments is None:
        raise HTTPException(status_code=404, detail="CHILD_NOT_FOUND")
    return assignments


@router.get("/children/{child_id}/assignments/{assignment_id}", response_model=ParentAssignmentDetail)
def get_child_assignment(
    child_id: UUID,
    assignment_id: UUID,
    current_user: Annotated[User, Depends(require_parent)],
    db: Annotated[Session, Depends(get_db)],
) -> ParentAssignmentDetail:
    detail = get_child_assignment_detail(db, current_user.id, child_id, assignment_id)
    if not detail:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")
    return detail


@router.post("/children/{child_id}/assignments/{assignment_id}/submission-file", response_model=ParentSubmissionHistoryItem)
def upload_assignment_submission_file(
    child_id: UUID,
    assignment_id: UUID,
    current_user: Annotated[User, Depends(require_parent)],
    db: Annotated[Session, Depends(get_db)],
    file: Annotated[UploadFile, File()],
) -> ParentSubmissionHistoryItem:
    child = get_parent_child(db, current_user.id, child_id)
    if not child or child.status != "ACTIVE":
        raise HTTPException(status_code=404, detail="CHILD_NOT_FOUND")
    close_overdue_assignments(db, assignment_ids=[assignment_id])
    row = db.execute(
        select(Assignment, Class)
        .join(Class, Class.id == Assignment.class_id)
        .where(Assignment.id == assignment_id, Assignment.status.in_(["PUBLISHED", "CLOSED"]))
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")
    assignment, classroom = row
    if assignment.status == "CLOSED":
        raise HTTPException(status_code=409, detail="ASSIGNMENT_CLOSED")
    membership = db.execute(
        select(Child)
        .join(ClassChild, ClassChild.child_id == Child.id)
        .where(
            Child.id == child_id,
            ClassChild.class_id == classroom.id,
            ClassChild.status == "ACTIVE",
        )
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")
    latest = db.scalar(
        select(Submission)
        .where(Submission.child_id == child_id, Submission.assignment_id == assignment_id, Submission.submission_type == PDF_ANSWER)
        .order_by(Submission.created_at.desc())
        .limit(1)
    )
    if latest and latest.grading_status in GRADED_STATUSES:
        raise HTTPException(status_code=409, detail="SUBMISSION_ALREADY_GRADED")
    suffix = _validate_answer_file(file)
    answer_url = _save_answer_file(file, suffix)
    if latest:
        submission = latest
        submission.answer_file_url = answer_url
        submission.grading_status = "SUBMITTED"
        submission.score = None
        submission.graded_at = None
        submission.graded_by = None
        submission.returned_at = None
    else:
        submission = Submission(
            assignment_id=assignment_id,
            child_id=child_id,
            submission_type=PDF_ANSWER,
            answer_file_url=answer_url,
            max_score=assignment.max_score,
            grading_status="SUBMITTED",
        )
        db.add(submission)
    from datetime import datetime, timezone

    submission.submitted_at = datetime.now(timezone.utc)
    db.commit()
    submissions = list_parent_child_submissions(db, current_user.id, child_id, limit=1)
    if not submissions:
        raise HTTPException(status_code=500, detail="SUBMISSION_NOT_SAVED")
    return submissions[0]


@router.get("/children/{child_id}/progress", response_model=ParentProgressSummary)
def get_progress(
    child_id: UUID,
    current_user: Annotated[User, Depends(require_parent)],
    db: Annotated[Session, Depends(get_db)],
) -> ParentProgressSummary:
    progress = get_child_progress(db, current_user.id, child_id)
    if not progress:
        raise HTTPException(status_code=404, detail="CHILD_NOT_FOUND")
    return progress


@router.get("/children/{child_id}/submissions", response_model=list[ParentSubmissionHistoryItem])
def get_child_submission_history(
    child_id: UUID,
    current_user: Annotated[User, Depends(require_parent)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ParentSubmissionHistoryItem]:
    submissions = list_parent_child_submissions(db, current_user.id, child_id)
    if submissions is None:
        raise HTTPException(status_code=404, detail="CHILD_NOT_FOUND")
    return submissions
