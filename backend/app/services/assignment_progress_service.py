from __future__ import annotations

from collections import defaultdict
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.child import Child, ClassChild
from app.models.classroom import Class
from app.models.lesson import Lesson, LessonMaterial
from app.models.submission import Submission
from app.models.user import User
from app.schemas.lesson import LessonMaterialPublic
from app.schemas.teacher_assignment import (
    AssignmentSubmissionPreview,
    MissingChildItem,
    TeacherAssignmentDetail,
    TeacherAssignmentListItem,
)
from app.services.submission_types import (
    GRADED_STATUSES,
    PDF_ANSWER,
    UNGRADED_STATUSES,
    is_gradable_submission,
)


VALID_ASSIGNMENT_STATUSES = {"DRAFT", "PUBLISHED", "CLOSED"}
VALID_ASSIGNMENT_TYPES = {"PDF_ASSIGNMENT"}


def _rate(part: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return round(part / total, 4)


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


def _active_children(db: Session, class_id: UUID) -> list[tuple[ClassChild, Child, User]]:
    return db.execute(
        select(ClassChild, Child, User)
        .join(Child, Child.id == ClassChild.child_id)
        .join(User, User.id == Child.parent_id)
        .where(
            ClassChild.class_id == class_id,
            ClassChild.status == "ACTIVE",
            Child.status == "ACTIVE",
        )
        .order_by(Child.display_name.asc())
    ).all()


def _build_assignment_item(
    db: Session,
    assignment: Assignment,
    classroom: Class,
    lesson: Lesson,
    active_child_count: int | None = None,
) -> TeacherAssignmentListItem:
    active_count = active_child_count
    if active_count is None:
        active_count = db.scalar(
            select(func.count())
            .select_from(ClassChild)
            .join(Child, Child.id == ClassChild.child_id)
            .where(
                ClassChild.class_id == assignment.class_id,
                ClassChild.status == "ACTIVE",
                Child.status == "ACTIVE",
            )
        ) or 0

    submissions = db.scalars(select(Submission).where(Submission.assignment_id == assignment.id)).all()
    gradable_submissions = [
        submission for submission in submissions if is_gradable_submission(submission.submission_type)
    ]
    submitted_child_ids = {submission.child_id for submission in gradable_submissions}
    submitted_count = len(submitted_child_ids)
    confidence_values = [float(submission.confidence) for submission in submissions if submission.confidence is not None]
    score_values = [
        float(submission.score)
        for submission in gradable_submissions
        if submission.score is not None and submission.grading_status in GRADED_STATUSES
    ]
    material_count = db.scalar(
        select(func.count()).select_from(LessonMaterial).where(LessonMaterial.lesson_id == lesson.id)
    ) or 0

    return TeacherAssignmentListItem(
        assignment_id=assignment.id,
        assignment_type=assignment.assignment_type,
        title=assignment.title,
        instructions=assignment.instructions,
        worksheet_file_url=assignment.worksheet_file_url,
        answer_template_url=assignment.answer_template_url,
        max_score=float(assignment.max_score),
        status=assignment.status,
        due_at=assignment.due_at,
        class_id=classroom.id,
        class_name=classroom.name,
        lesson_id=lesson.id,
        lesson_title=lesson.title,
        material_count=material_count,
        assigned_child_count=active_count,
        submitted_child_count=submitted_count,
        missing_child_count=max(active_count - submitted_count, 0),
        correct_count=sum(1 for submission in submissions if submission.submission_type != PDF_ANSWER and submission.is_correct),
        incorrect_count=sum(1 for submission in submissions if submission.submission_type != PDF_ANSWER and not submission.is_correct),
        speech_failed_count=sum(1 for submission in submissions if not submission.speech_passed),
        ungraded_submission_count=sum(
            1 for submission in gradable_submissions if submission.grading_status in UNGRADED_STATUSES
        ),
        graded_submission_count=sum(
            1 for submission in gradable_submissions if submission.grading_status in GRADED_STATUSES
        ),
        average_score=round(sum(score_values) / len(score_values), 2) if score_values else None,
        completion_rate=_rate(submitted_count, active_count),
        average_confidence=round(sum(confidence_values) / len(confidence_values), 4) if confidence_values else None,
        created_at=assignment.created_at,
    )


def list_teacher_assignments(
    db: Session,
    teacher_id: UUID,
    status: str | None = None,
    class_id: UUID | None = None,
) -> list[TeacherAssignmentListItem]:
    filters = [Class.teacher_id == teacher_id]
    if status:
        filters.append(Assignment.status == status.upper())
    if class_id:
        filters.append(Assignment.class_id == class_id)

    rows = db.execute(
        select(Assignment, Class, Lesson)
        .join(Class, Class.id == Assignment.class_id)
        .join(Lesson, Lesson.id == Assignment.lesson_id)
        .where(*filters)
        .order_by(Assignment.created_at.desc())
    ).all()
    if not rows:
        return []

    active_counts: dict[UUID, int] = defaultdict(int)
    class_ids = {classroom.id for _, classroom, _ in rows}
    count_rows = db.execute(
        select(ClassChild.class_id, func.count(ClassChild.child_id))
        .join(Child, Child.id == ClassChild.child_id)
        .where(ClassChild.class_id.in_(class_ids), ClassChild.status == "ACTIVE", Child.status == "ACTIVE")
        .group_by(ClassChild.class_id)
    ).all()
    for row_class_id, count in count_rows:
        active_counts[row_class_id] = count or 0

    return [
        _build_assignment_item(db, assignment, classroom, lesson, active_counts[classroom.id])
        for assignment, classroom, lesson in rows
    ]


def get_teacher_assignment_detail(db: Session, teacher_id: UUID, assignment_id: UUID) -> TeacherAssignmentDetail | None:
    row = db.execute(
        select(Assignment, Class, Lesson)
        .join(Class, Class.id == Assignment.class_id)
        .join(Lesson, Lesson.id == Assignment.lesson_id)
        .where(Assignment.id == assignment_id, Class.teacher_id == teacher_id)
    ).first()
    if not row:
        return None

    assignment, classroom, lesson = row
    base = _build_assignment_item(db, assignment, classroom, lesson)
    materials = db.scalars(
        select(LessonMaterial)
        .where(LessonMaterial.lesson_id == lesson.id)
        .order_by(LessonMaterial.sort_order.asc(), LessonMaterial.created_at.asc())
    ).all()
    submitted_child_ids = set(
        db.scalars(
            select(Submission.child_id).where(
                Submission.assignment_id == assignment.id,
                Submission.submission_type == PDF_ANSWER,
            )
        ).all()
    )
    missing_children = [
        MissingChildItem(
            id=child.id,
            display_name=child.display_name,
            birth_year=child.birth_year,
            parent_name=parent.full_name,
            parent_email=parent.email,
            joined_at=link.joined_at,
        )
        for link, child, parent in _active_children(db, classroom.id)
        if child.id not in submitted_child_ids
    ]
    recent_submission_rows = db.execute(
        select(Submission, Child)
        .join(Child, Child.id == Submission.child_id)
        .where(Submission.assignment_id == assignment.id, Submission.submission_type == PDF_ANSWER)
        .order_by(Submission.created_at.desc())
        .limit(5)
    ).all()
    recent_submissions = [
        AssignmentSubmissionPreview(
            id=submission.id,
            child_name=child.display_name,
            submitted_at=submission.submitted_at or submission.created_at,
            grading_status=submission.grading_status,
            score=float(submission.score) if submission.score is not None else None,
            max_score=float(submission.max_score) if submission.max_score is not None else None,
            answer_file_url=submission.answer_file_url,
        )
        for submission, child in recent_submission_rows
    ]

    return TeacherAssignmentDetail(
        **base.model_dump(),
        materials=[_material_public(material) for material in materials],
        missing_children=missing_children,
        recent_submissions=recent_submissions,
    )


def update_teacher_assignment(
    db: Session,
    teacher_id: UUID,
    assignment_id: UUID,
    *,
    assignment_type: str | None = None,
    title: str | None = None,
    instructions: str | None = None,
    worksheet_file_url: str | None = None,
    answer_template_url: str | None = None,
    max_score: float | None = None,
    due_at_set: bool = False,
    due_at=None,
    status: str | None = None,
) -> TeacherAssignmentDetail | None:
    row = db.execute(
        select(Assignment, Class)
        .join(Class, Class.id == Assignment.class_id)
        .where(Assignment.id == assignment_id, Class.teacher_id == teacher_id)
    ).first()
    if not row:
        return None
    assignment, _ = row
    if assignment_type is not None:
        assignment_type_value = assignment_type.upper().strip()
        if assignment_type_value not in VALID_ASSIGNMENT_TYPES:
            raise ValueError("INVALID_ASSIGNMENT_TYPE")
        assignment.assignment_type = assignment_type_value
    if title is not None:
        assignment.title = title.strip()
    if instructions is not None:
        assignment.instructions = instructions.strip() or None
    if worksheet_file_url is not None:
        assignment.worksheet_file_url = worksheet_file_url.strip() or None
    if answer_template_url is not None:
        assignment.answer_template_url = answer_template_url.strip() or None
    if max_score is not None:
        assignment.max_score = max_score
    if due_at_set:
        assignment.due_at = due_at
    if status is not None:
        status_value = status.upper().strip()
        if status_value not in VALID_ASSIGNMENT_STATUSES:
            raise ValueError("INVALID_ASSIGNMENT_STATUS")
        assignment.status = status_value
    db.commit()
    return get_teacher_assignment_detail(db, teacher_id, assignment_id)
