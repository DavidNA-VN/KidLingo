import shutil
from pathlib import Path
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import require_teacher
from app.models.assignment import Assignment
from app.models.classroom import Class
from app.models.user import User
from app.schemas.teacher_assignment import (
    MissingChildItem,
    TeacherAssignmentDetail,
    TeacherAssignmentListItem,
    TeacherAssignmentUpdate,
)
from app.services.assignment_progress_service import (
    get_teacher_assignment_detail,
    list_teacher_assignments,
    update_teacher_assignment,
)

router = APIRouter(prefix="/teacher/assignments", tags=["teacher-assignments"])

MAX_ASSIGNMENT_FILE_BYTES = 15 * 1024 * 1024


def _assignment_or_404(db: Session, teacher_id: UUID, assignment_id: UUID) -> Assignment:
    assignment = db.scalars(
        select(Assignment)
        .join(Class, Class.id == Assignment.class_id)
        .where(Assignment.id == assignment_id, Class.teacher_id == teacher_id)
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")
    return assignment


def _validate_upload(file: UploadFile, allowed_suffixes: set[str], allowed_content_types: set[str]) -> str:
    filename = file.filename or ""
    suffix = Path(filename).suffix.lower()
    if (suffix and suffix not in allowed_suffixes) or (not suffix and file.content_type not in allowed_content_types):
        raise HTTPException(status_code=400, detail="INVALID_FILE_TYPE")
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_ASSIGNMENT_FILE_BYTES:
        raise HTTPException(status_code=400, detail="FILE_TOO_LARGE")
    return suffix or next(iter(allowed_suffixes))


def _save_assignment_file(file: UploadFile, subdir: str, suffix: str) -> str:
    settings = get_settings()
    target_dir = settings.upload_path / "assignments" / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    from uuid import uuid4

    safe_name = f"{uuid4()}{suffix}"
    target_path = target_dir / safe_name
    with target_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return f"/uploads/assignments/{subdir}/{safe_name}"


@router.get("", response_model=list[TeacherAssignmentListItem])
def get_assignments(
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
    status: Annotated[str | None, Query(max_length=20)] = None,
    class_id: UUID | None = None,
) -> list[TeacherAssignmentListItem]:
    return list_teacher_assignments(db, current_user.id, status=status, class_id=class_id)


@router.get("/{assignment_id}", response_model=TeacherAssignmentDetail)
def get_assignment_detail(
    assignment_id: UUID,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> TeacherAssignmentDetail:
    detail = get_teacher_assignment_detail(db, current_user.id, assignment_id)
    if not detail:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")
    return detail


@router.get("/{assignment_id}/missing-children", response_model=list[MissingChildItem])
def get_assignment_missing_children(
    assignment_id: UUID,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> list[MissingChildItem]:
    detail = get_teacher_assignment_detail(db, current_user.id, assignment_id)
    if not detail:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")
    return detail.missing_children


@router.patch("/{assignment_id}", response_model=TeacherAssignmentDetail)
def patch_assignment(
    assignment_id: UUID,
    payload: TeacherAssignmentUpdate,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> TeacherAssignmentDetail:
    try:
        detail = update_teacher_assignment(
            db,
            current_user.id,
            assignment_id,
            assignment_type=payload.assignment_type,
            title=payload.title,
            instructions=payload.instructions,
            worksheet_file_url=payload.worksheet_file_url,
            answer_template_url=payload.answer_template_url,
            max_score=payload.max_score,
            due_at_set="due_at" in payload.model_fields_set,
            due_at=payload.due_at,
            status=payload.status,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not detail:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")
    return detail


@router.post("/{assignment_id}/worksheet", response_model=TeacherAssignmentDetail, status_code=status.HTTP_200_OK)
def upload_assignment_worksheet(
    assignment_id: UUID,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
    file: Annotated[UploadFile, File()],
) -> TeacherAssignmentDetail:
    assignment = _assignment_or_404(db, current_user.id, assignment_id)
    suffix = _validate_upload(file, {".pdf"}, {"application/pdf"})
    assignment.worksheet_file_url = _save_assignment_file(file, "worksheets", suffix)
    db.commit()
    detail = get_teacher_assignment_detail(db, current_user.id, assignment_id)
    if not detail:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")
    return detail


@router.post("/{assignment_id}/answer-template", response_model=TeacherAssignmentDetail, status_code=status.HTTP_200_OK)
def upload_assignment_answer_template(
    assignment_id: UUID,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
    file: Annotated[UploadFile, File()],
) -> TeacherAssignmentDetail:
    assignment = _assignment_or_404(db, current_user.id, assignment_id)
    suffix = _validate_upload(
        file,
        {".doc", ".docx"},
        {"application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    )
    assignment.answer_template_url = _save_assignment_file(file, "answer-templates", suffix)
    db.commit()
    detail = get_teacher_assignment_detail(db, current_user.id, assignment_id)
    if not detail:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")
    return detail
