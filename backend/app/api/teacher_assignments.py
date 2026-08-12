from pathlib import Path
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

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
from app.services.audit_service import AuditAction, commit_audit_event, get_request_context
from app.services.file_storage import save_upload_file

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


def _save_assignment_file(db: Session, file: UploadFile, subdir: str, suffix: str) -> str:
    from uuid import uuid4

    safe_name = f"{uuid4()}{suffix}"
    return save_upload_file(db, f"assignments/{subdir}/{safe_name}", file)


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
    request: Request,
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
    commit_audit_event(
        db,
        action=AuditAction.ASSIGNMENT_UPDATED,
        actor=current_user,
        resource_type="ASSIGNMENT",
        resource_id=assignment_id,
        request_context=get_request_context(request),
        metadata={"updated_fields": sorted(payload.model_fields_set), "status": detail.status},
    )
    return detail


@router.post("/{assignment_id}/worksheet", response_model=TeacherAssignmentDetail, status_code=status.HTTP_200_OK)
def upload_assignment_worksheet(
    assignment_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
    file: Annotated[UploadFile, File()],
) -> TeacherAssignmentDetail:
    assignment = _assignment_or_404(db, current_user.id, assignment_id)
    try:
        suffix = _validate_upload(file, {".pdf"}, {"application/pdf"})
    except HTTPException as exc:
        commit_audit_event(
            db,
            action=AuditAction.UPLOAD_INVALID,
            actor=current_user,
            result="FAILURE",
            category="UPLOAD",
            resource_type="ASSIGNMENT",
            resource_id=assignment_id,
            request_context=get_request_context(request),
            metadata={"reason": exc.detail, "filename": file.filename},
        )
        raise
    assignment.worksheet_file_url = _save_assignment_file(db, file, "worksheets", suffix)
    db.commit()
    commit_audit_event(
        db,
        action=AuditAction.ASSIGNMENT_FILE_UPLOADED,
        actor=current_user,
        category="UPLOAD",
        resource_type="ASSIGNMENT",
        resource_id=assignment_id,
        request_context=get_request_context(request),
        metadata={"file_type": "WORKSHEET", "filename": file.filename},
    )
    detail = get_teacher_assignment_detail(db, current_user.id, assignment_id)
    if not detail:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")
    return detail


@router.post("/{assignment_id}/answer-template", response_model=TeacherAssignmentDetail, status_code=status.HTTP_200_OK)
def upload_assignment_answer_template(
    assignment_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
    file: Annotated[UploadFile, File()],
) -> TeacherAssignmentDetail:
    assignment = _assignment_or_404(db, current_user.id, assignment_id)
    try:
        suffix = _validate_upload(
            file,
            {".doc", ".docx"},
            {"application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
        )
    except HTTPException as exc:
        commit_audit_event(
            db,
            action=AuditAction.UPLOAD_INVALID,
            actor=current_user,
            result="FAILURE",
            category="UPLOAD",
            resource_type="ASSIGNMENT",
            resource_id=assignment_id,
            request_context=get_request_context(request),
            metadata={"reason": exc.detail, "filename": file.filename},
        )
        raise
    assignment.answer_template_url = _save_assignment_file(db, file, "answer-templates", suffix)
    db.commit()
    commit_audit_event(
        db,
        action=AuditAction.ASSIGNMENT_FILE_UPLOADED,
        actor=current_user,
        category="UPLOAD",
        resource_type="ASSIGNMENT",
        resource_id=assignment_id,
        request_context=get_request_context(request),
        metadata={"file_type": "ANSWER_TEMPLATE", "filename": file.filename},
    )
    detail = get_teacher_assignment_detail(db, current_user.id, assignment_id)
    if not detail:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")
    return detail
