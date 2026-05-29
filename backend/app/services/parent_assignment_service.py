from __future__ import annotations

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
from app.schemas.parent import (
    ParentAssignmentDetail,
    ParentAssignmentListItem,
    ParentChildPublic,
    ParentClassPublic,
    ParentJoinClassResponse,
)
from app.services.assignment_status_service import close_overdue_assignments


def get_parent_child(db: Session, parent_id: UUID, child_id: UUID) -> Child | None:
    return db.scalar(select(Child).where(Child.id == child_id, Child.parent_id == parent_id))


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


def _latest_submission(db: Session, child_id: UUID, assignment_id: UUID) -> Submission | None:
    return db.scalar(
        select(Submission)
        .where(Submission.child_id == child_id, Submission.assignment_id == assignment_id)
        .order_by(Submission.created_at.desc())
        .limit(1)
    )


def _assignment_item(
    db: Session,
    child_id: UUID,
    assignment: Assignment,
    classroom: Class,
    teacher: User,
    lesson: Lesson,
) -> ParentAssignmentListItem:
    material_count = db.scalar(
        select(func.count()).select_from(LessonMaterial).where(LessonMaterial.lesson_id == lesson.id)
    ) or 0
    latest = _latest_submission(db, child_id, assignment.id)
    return ParentAssignmentListItem(
        assignment_id=assignment.id,
        title=assignment.title,
        instructions=assignment.instructions,
        status=assignment.status,
        due_at=assignment.due_at,
        class_id=classroom.id,
        class_name=classroom.name,
        teacher_name=teacher.full_name,
        lesson_id=lesson.id,
        lesson_title=lesson.title,
        lesson_description=lesson.description,
        material_count=int(material_count),
        assignment_type=assignment.assignment_type,
        worksheet_file_url=assignment.worksheet_file_url,
        answer_template_url=assignment.answer_template_url,
        max_score=float(assignment.max_score),
        submitted=latest is not None,
        latest_submission_at=(latest.submitted_at or latest.created_at) if latest else None,
        latest_is_correct=latest.is_correct if latest else None,
        latest_confidence=float(latest.confidence) if latest and latest.confidence is not None else None,
        latest_score=float(latest.score) if latest and latest.score is not None else None,
        latest_max_score=float(latest.max_score) if latest and latest.max_score is not None else None,
        latest_grading_status=latest.grading_status if latest else None,
        latest_feedback=latest.teacher_feedback if latest else None,
    )


def list_parent_children(db: Session, parent_id: UUID) -> list[ParentChildPublic]:
    children = db.scalars(
        select(Child).where(Child.parent_id == parent_id).order_by(Child.status.asc(), Child.created_at.asc())
    ).all()
    result = []
    for child in children:
        class_count = db.scalar(
            select(func.count())
            .select_from(ClassChild)
            .where(ClassChild.child_id == child.id, ClassChild.status == "ACTIVE")
        ) or 0
        assignment_count = db.scalar(
            select(func.count())
            .select_from(Assignment)
            .join(ClassChild, ClassChild.class_id == Assignment.class_id)
            .where(
                ClassChild.child_id == child.id,
                ClassChild.status == "ACTIVE",
                Assignment.status == "PUBLISHED",
            )
        ) or 0
        result.append(
            ParentChildPublic(
                id=child.id,
                display_name=child.display_name,
                birth_year=child.birth_year,
                nickname=child.nickname,
                avatar_url=child.avatar_url,
                profile_note=child.profile_note,
                status=child.status,
                total_stars=child.total_stars,
                total_coins=child.total_coins,
                class_count=int(class_count),
                published_assignment_count=int(assignment_count),
                created_at=child.created_at,
            )
        )
    return result


def join_class_by_code(db: Session, parent_id: UUID, child_id: UUID, class_code: str) -> ParentJoinClassResponse | None:
    child = get_parent_child(db, parent_id, child_id)
    if not child or child.status != "ACTIVE":
        return None

    classroom = db.scalar(select(Class).where(func.lower(Class.class_code) == class_code.strip().lower()))
    if not classroom:
        raise ValueError("CLASS_CODE_NOT_FOUND")

    link = db.get(ClassChild, {"class_id": classroom.id, "child_id": child_id})
    already_joined = link is not None
    if not link:
        link = ClassChild(class_id=classroom.id, child_id=child_id, status="ACTIVE")
        db.add(link)
    elif link.status != "ACTIVE":
        link.status = "ACTIVE"
    db.commit()
    db.refresh(link)
    return ParentJoinClassResponse(
        class_id=classroom.id,
        child_id=child_id,
        class_name=classroom.name,
        class_code=classroom.class_code,
        membership_status=link.status,
        joined_at=link.joined_at,
        already_joined=already_joined,
    )


def list_child_classes(db: Session, parent_id: UUID, child_id: UUID) -> list[ParentClassPublic] | None:
    child = get_parent_child(db, parent_id, child_id)
    if not child:
        return None
    rows = db.execute(
        select(ClassChild, Class, User)
        .join(Class, Class.id == ClassChild.class_id)
        .join(User, User.id == Class.teacher_id)
        .where(ClassChild.child_id == child_id)
        .order_by(ClassChild.joined_at.desc())
    ).all()
    result = []
    for link, classroom, teacher in rows:
        assignment_count = db.scalar(
            select(func.count())
            .select_from(Assignment)
            .where(Assignment.class_id == classroom.id, Assignment.status == "PUBLISHED")
        ) or 0
        result.append(
            ParentClassPublic(
                class_id=classroom.id,
                name=classroom.name,
                description=classroom.description,
                class_code=classroom.class_code,
                teacher_name=teacher.full_name,
                membership_status=link.status,
                joined_at=link.joined_at,
                published_assignment_count=int(assignment_count),
            )
        )
    return result


def list_child_assignments(db: Session, parent_id: UUID, child_id: UUID) -> list[ParentAssignmentListItem] | None:
    child = get_parent_child(db, parent_id, child_id)
    if not child:
        return None
    class_ids = db.scalars(
        select(ClassChild.class_id).where(ClassChild.child_id == child_id, ClassChild.status == "ACTIVE")
    ).all()
    close_overdue_assignments(db, class_ids=list(class_ids))
    rows = db.execute(
        select(Assignment, Class, User, Lesson)
        .join(ClassChild, ClassChild.class_id == Assignment.class_id)
        .join(Class, Class.id == Assignment.class_id)
        .join(User, User.id == Class.teacher_id)
        .join(Lesson, Lesson.id == Assignment.lesson_id)
        .where(
            ClassChild.child_id == child_id,
            ClassChild.status == "ACTIVE",
            Assignment.status.in_(["PUBLISHED", "CLOSED"]),
        )
        .order_by(Assignment.due_at.asc().nulls_last(), Assignment.created_at.desc())
    ).all()
    return [
        _assignment_item(db, child_id, assignment, classroom, teacher, lesson)
        for assignment, classroom, teacher, lesson in rows
    ]


def get_child_assignment_detail(
    db: Session, parent_id: UUID, child_id: UUID, assignment_id: UUID
) -> ParentAssignmentDetail | None:
    child = get_parent_child(db, parent_id, child_id)
    if not child:
        return None
    close_overdue_assignments(db, assignment_ids=[assignment_id])
    row = db.execute(
        select(Assignment, Class, User, Lesson)
        .join(ClassChild, ClassChild.class_id == Assignment.class_id)
        .join(Class, Class.id == Assignment.class_id)
        .join(User, User.id == Class.teacher_id)
        .join(Lesson, Lesson.id == Assignment.lesson_id)
        .where(
            Assignment.id == assignment_id,
            ClassChild.child_id == child_id,
            ClassChild.status == "ACTIVE",
            Assignment.status.in_(["PUBLISHED", "CLOSED"]),
        )
    ).first()
    if not row:
        return None
    assignment, classroom, teacher, lesson = row
    base = _assignment_item(db, child_id, assignment, classroom, teacher, lesson)
    materials = db.scalars(
        select(LessonMaterial)
        .where(LessonMaterial.lesson_id == lesson.id)
        .order_by(LessonMaterial.sort_order.asc(), LessonMaterial.created_at.asc())
    ).all()
    return ParentAssignmentDetail(**base.model_dump(), materials=[_material_public(material) for material in materials])
