from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_teacher
from app.models.assignment import Assignment
from app.models.classroom import Class
from app.models.lesson import Lesson, LessonMaterial
from app.models.submission import Submission
from app.models.user import User
from app.schemas.assignment import AssignmentCreate, AssignmentDetail, AssignmentPublic, AssignmentUpdate
from app.schemas.lesson import LessonMaterialPublic

router = APIRouter(prefix="/assignments", tags=["assignments"])

VALID_STATUSES = {"DRAFT", "PUBLISHED", "CLOSED"}
VALID_ASSIGNMENT_TYPES = {"PDF_ASSIGNMENT"}


def _teacher_class_or_404(db: Session, teacher_id: UUID, class_id: UUID) -> Class:
    classroom = db.get(Class, class_id)
    if not classroom or classroom.teacher_id != teacher_id:
        raise HTTPException(status_code=404, detail="CLASS_NOT_FOUND")
    return classroom


def _teacher_lesson_or_404(db: Session, teacher_id: UUID, lesson_id: UUID) -> Lesson:
    lesson = db.get(Lesson, lesson_id)
    if not lesson or lesson.teacher_id != teacher_id:
        raise HTTPException(status_code=404, detail="LESSON_NOT_FOUND")
    return lesson


def _validate_lesson_class(lesson: Lesson, class_id: UUID) -> None:
    if lesson.class_id is not None and lesson.class_id != class_id:
        raise HTTPException(status_code=400, detail="LESSON_CLASS_MISMATCH")


def _assignment_or_404(db: Session, teacher_id: UUID, assignment_id: UUID) -> tuple[Assignment, Class, Lesson]:
    row = db.execute(
        select(Assignment, Class, Lesson)
        .join(Class, Class.id == Assignment.class_id)
        .join(Lesson, Lesson.id == Assignment.lesson_id)
        .where(Assignment.id == assignment_id, Class.teacher_id == teacher_id)
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")
    return row


def _material_public(material: LessonMaterial) -> LessonMaterialPublic:
    return LessonMaterialPublic(
        id=material.id,
        lesson_id=material.lesson_id,
        type=material.type,
        title=material.title,
        description=material.description,
        file_url=material.file_url,
        external_url=material.external_url,
        youtube_video_id=material.youtube_video_id,
        vocabulary_items=material.vocabulary_items,
        sort_order=material.sort_order,
        created_at=material.created_at,
    )


def _assignment_public(db: Session, assignment: Assignment, classroom: Class, lesson: Lesson) -> AssignmentPublic:
    material_count = db.scalar(
        select(func.count()).select_from(LessonMaterial).where(LessonMaterial.lesson_id == lesson.id)
    )
    submission_count = db.scalar(
        select(func.count()).select_from(Submission).where(Submission.assignment_id == assignment.id)
    )
    return AssignmentPublic(
        id=assignment.id,
        class_id=assignment.class_id,
        lesson_id=assignment.lesson_id,
        assignment_type=assignment.assignment_type,
        title=assignment.title,
        instructions=assignment.instructions,
        worksheet_file_url=assignment.worksheet_file_url,
        answer_template_url=assignment.answer_template_url,
        max_score=float(assignment.max_score),
        due_at=assignment.due_at,
        status=assignment.status,
        class_name=classroom.name,
        lesson_title=lesson.title,
        material_count=material_count or 0,
        submission_count=submission_count or 0,
        created_at=assignment.created_at,
    )


@router.post("", response_model=AssignmentPublic, status_code=status.HTTP_201_CREATED)
def create_assignment(
    payload: AssignmentCreate,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> AssignmentPublic:
    status_value = payload.status.upper().strip()
    if status_value not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="INVALID_ASSIGNMENT_STATUS")
    assignment_type = payload.assignment_type.upper().strip()
    if assignment_type not in VALID_ASSIGNMENT_TYPES:
        raise HTTPException(status_code=400, detail="INVALID_ASSIGNMENT_TYPE")

    classroom = _teacher_class_or_404(db, current_user.id, payload.class_id)
    lesson = _teacher_lesson_or_404(db, current_user.id, payload.lesson_id)
    _validate_lesson_class(lesson, classroom.id)
    assignment = Assignment(
        class_id=payload.class_id,
        lesson_id=payload.lesson_id,
        assignment_type=assignment_type,
        title=payload.title.strip(),
        instructions=payload.instructions.strip() if payload.instructions else None,
        worksheet_file_url=payload.worksheet_file_url,
        answer_template_url=payload.answer_template_url,
        max_score=payload.max_score,
        due_at=payload.due_at,
        status=status_value,
    )
    db.add(assignment)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="ASSIGNMENT_ALREADY_EXISTS") from exc
    db.refresh(assignment)
    return _assignment_public(db, assignment, classroom, lesson)


@router.patch("/{assignment_id}", response_model=AssignmentPublic)
def update_assignment(
    assignment_id: UUID,
    payload: AssignmentUpdate,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> AssignmentPublic:
    assignment, classroom, lesson = _assignment_or_404(db, current_user.id, assignment_id)
    if payload.assignment_type is not None:
        assignment_type = payload.assignment_type.upper().strip()
        if assignment_type not in VALID_ASSIGNMENT_TYPES:
            raise HTTPException(status_code=400, detail="INVALID_ASSIGNMENT_TYPE")
        assignment.assignment_type = assignment_type
    if payload.title is not None:
        assignment.title = payload.title.strip()
    if payload.instructions is not None:
        assignment.instructions = payload.instructions.strip() or None
    if payload.worksheet_file_url is not None:
        assignment.worksheet_file_url = payload.worksheet_file_url.strip() or None
    if payload.answer_template_url is not None:
        assignment.answer_template_url = payload.answer_template_url.strip() or None
    if payload.max_score is not None:
        assignment.max_score = payload.max_score
    if payload.due_at is not None:
        assignment.due_at = payload.due_at
    if payload.status is not None:
        status_value = payload.status.upper().strip()
        if status_value not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail="INVALID_ASSIGNMENT_STATUS")
        assignment.status = status_value
    db.commit()
    db.refresh(assignment)
    return _assignment_public(db, assignment, classroom, lesson)


@router.get("/{assignment_id}", response_model=AssignmentDetail)
def get_assignment(
    assignment_id: UUID,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> AssignmentDetail:
    assignment, classroom, lesson = _assignment_or_404(db, current_user.id, assignment_id)
    public = _assignment_public(db, assignment, classroom, lesson)
    materials = db.scalars(
        select(LessonMaterial)
        .where(LessonMaterial.lesson_id == lesson.id)
        .order_by(LessonMaterial.sort_order.asc(), LessonMaterial.created_at.asc())
    ).all()
    return AssignmentDetail(
        **public.model_dump(),
        materials=[_material_public(material) for material in materials],
    )
