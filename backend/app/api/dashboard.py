from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_teacher
from app.models.assignment import Assignment
from app.models.classroom import Class
from app.models.user import User
from app.schemas.dashboard import (
    AssignmentInstructionsUpdate,
    AssignmentProgressItem,
    AssignmentStatusUpdate,
    ClassProgressItem,
    TeacherDashboardResponse,
)
from app.services.teacher_dashboard_service import (
    get_assignment_progress,
    get_class_analytics,
    get_teacher_dashboard,
)

router = APIRouter(prefix="/teacher", tags=["teacher-dashboard"])

VALID_STATUSES = {"DRAFT", "PUBLISHED", "CLOSED"}


def _teacher_assignment_or_404(db: Session, teacher_id: UUID, assignment_id: UUID) -> Assignment:
    assignment = db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")
    classroom = db.get(Class, assignment.class_id)
    if not classroom or classroom.teacher_id != teacher_id:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")
    return assignment


@router.get("/dashboard", response_model=TeacherDashboardResponse)
def teacher_dashboard(
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> TeacherDashboardResponse:
    return get_teacher_dashboard(db, current_user.id)


@router.get("/classes/{class_id}/analytics", response_model=ClassProgressItem)
def teacher_class_analytics(
    class_id: UUID,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> ClassProgressItem:
    try:
        return get_class_analytics(db, current_user.id, class_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/assignments/{assignment_id}/progress", response_model=AssignmentProgressItem)
def teacher_assignment_progress(
    assignment_id: UUID,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> AssignmentProgressItem:
    try:
        return get_assignment_progress(db, current_user.id, assignment_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/assignments/{assignment_id}/status", response_model=AssignmentProgressItem)
def update_assignment_status(
    assignment_id: UUID,
    payload: AssignmentStatusUpdate,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> AssignmentProgressItem:
    status_value = payload.status.strip().upper()
    if status_value not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="INVALID_ASSIGNMENT_STATUS")
    assignment = _teacher_assignment_or_404(db, current_user.id, assignment_id)
    assignment.status = status_value
    db.commit()
    return get_assignment_progress(db, current_user.id, assignment_id)


@router.patch("/assignments/{assignment_id}/instructions", response_model=AssignmentProgressItem)
def update_assignment_instructions(
    assignment_id: UUID,
    payload: AssignmentInstructionsUpdate,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> AssignmentProgressItem:
    assignment = _teacher_assignment_or_404(db, current_user.id, assignment_id)
    assignment.instructions = payload.instructions.strip() if payload.instructions else None
    db.commit()
    return get_assignment_progress(db, current_user.id, assignment_id)
