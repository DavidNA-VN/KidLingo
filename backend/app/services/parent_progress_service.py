from __future__ import annotations

from uuid import UUID

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.child import Child, ClassChild
from app.models.classroom import Class
from app.models.lesson import Lesson
from app.models.submission import Submission
from app.schemas.parent import (
    ParentDashboardSummary,
    ParentProgressSummary,
    ParentSubmissionHistoryItem,
)
from app.services.parent_assignment_service import get_parent_child
from app.services.submission_types import PDF_ANSWER


def _published_assignment_ids_for_child(db: Session, child_id: UUID) -> list[UUID]:
    return list(
        db.scalars(
            select(Assignment.id)
            .join(ClassChild, ClassChild.class_id == Assignment.class_id)
            .where(
                ClassChild.child_id == child_id,
                ClassChild.status == "ACTIVE",
                Assignment.status == "PUBLISHED",
            )
        ).all()
    )


def _submission_history(db: Session, child_id: UUID, limit: int = 20) -> list[ParentSubmissionHistoryItem]:
    rows = db.execute(
        select(Submission, Assignment, Class, Lesson)
        .join(Assignment, Assignment.id == Submission.assignment_id)
        .join(Class, Class.id == Assignment.class_id)
        .join(Lesson, Lesson.id == Assignment.lesson_id)
        .join(ClassChild, ClassChild.class_id == Class.id)
        .where(
            Submission.child_id == child_id,
            Submission.submission_type == PDF_ANSWER,
            ClassChild.child_id == child_id,
            ClassChild.status == "ACTIVE",
        )
        .order_by(Submission.created_at.desc())
        .limit(limit)
    ).all()
    return [
        ParentSubmissionHistoryItem(
            id=submission.id,
            submission_type=submission.submission_type,
            assignment_id=assignment.id,
            assignment_title=assignment.title,
            class_name=classroom.name,
            lesson_title=lesson.title,
            target_class=submission.target_class,
            predicted_class=submission.predicted_class,
            confidence=float(submission.confidence) if submission.confidence is not None else None,
            is_correct=submission.is_correct,
            speech_passed=submission.speech_passed,
            speech_transcript=submission.speech_transcript,
            stars_earned=submission.stars_earned,
            coins_earned=submission.coins_earned,
            answer_file_url=submission.answer_file_url,
            submitted_at=submission.submitted_at,
            graded_at=submission.graded_at,
            score=float(submission.score) if submission.score is not None else None,
            max_score=float(submission.max_score) if submission.max_score is not None else None,
            grading_status=submission.grading_status,
            returned_at=submission.returned_at,
            teacher_feedback=submission.teacher_feedback,
            reviewed_at=submission.reviewed_at,
            created_at=submission.created_at,
        )
        for submission, assignment, classroom, lesson in rows
    ]


def list_parent_child_submissions(
    db: Session, parent_id: UUID, child_id: UUID, limit: int = 50
) -> list[ParentSubmissionHistoryItem] | None:
    child = get_parent_child(db, parent_id, child_id)
    if not child:
        return None
    return _submission_history(db, child_id, limit=limit)


def get_child_progress(db: Session, parent_id: UUID, child_id: UUID) -> ParentProgressSummary | None:
    child = get_parent_child(db, parent_id, child_id)
    if not child:
        return None

    assignment_ids = _published_assignment_ids_for_child(db, child_id)
    published_count = len(set(assignment_ids))
    submitted_assignment_count = (
        db.scalar(
            select(func.count(distinct(Submission.assignment_id))).where(
                Submission.child_id == child_id,
                Submission.submission_type == PDF_ANSWER,
                Submission.assignment_id.in_(assignment_ids) if assignment_ids else False,
            )
        )
        or 0
    )
    total_submissions = (
        db.scalar(select(func.count(Submission.id)).where(Submission.child_id == child_id, Submission.submission_type == PDF_ANSWER))
        or 0
    )
    correct_submissions = (
        db.scalar(
            select(func.count(Submission.id)).where(
                Submission.child_id == child_id,
                Submission.submission_type == PDF_ANSWER,
                Submission.is_correct.is_(True),
            )
        )
        or 0
    )
    speech_passed_count = (
        db.scalar(
            select(func.count(Submission.id)).where(
                Submission.child_id == child_id,
                Submission.submission_type == PDF_ANSWER,
                Submission.speech_passed.is_(True),
            )
        )
        or 0
    )
    average_confidence = db.scalar(
        select(func.avg(Submission.confidence)).where(Submission.child_id == child_id, Submission.submission_type == PDF_ANSWER)
    )
    latest_submission_at = db.scalar(
        select(func.max(Submission.created_at)).where(Submission.child_id == child_id, Submission.submission_type == PDF_ANSWER)
    )
    class_count = (
        db.scalar(select(func.count(ClassChild.class_id)).where(ClassChild.child_id == child_id, ClassChild.status == "ACTIVE"))
        or 0
    )

    return ParentProgressSummary(
        child_id=child.id,
        display_name=child.display_name,
        total_stars=child.total_stars,
        total_coins=child.total_coins,
        class_count=int(class_count),
        published_assignment_count=published_count,
        submitted_assignment_count=int(submitted_assignment_count),
        pending_assignment_count=max(0, published_count - int(submitted_assignment_count)),
        total_submissions=int(total_submissions),
        correct_submissions=int(correct_submissions),
        incorrect_submissions=max(0, int(total_submissions) - int(correct_submissions)),
        speech_passed_count=int(speech_passed_count),
        average_confidence=float(average_confidence) if average_confidence is not None else None,
        latest_submission_at=latest_submission_at,
        recent_submissions=_submission_history(db, child_id, limit=8),
    )


def get_parent_dashboard_summary(db: Session, parent_id: UUID) -> ParentDashboardSummary:
    children = db.scalars(select(Child).where(Child.parent_id == parent_id)).all()
    child_ids = [child.id for child in children]
    active_child_ids = [child.id for child in children if child.status == "ACTIVE"]
    if not child_ids:
        return ParentDashboardSummary(
            child_count=0,
            active_child_count=0,
            class_count=0,
            published_assignment_count=0,
            submitted_assignment_count=0,
            total_submissions=0,
            correct_submissions=0,
            total_stars=0,
            total_coins=0,
            latest_submission_at=None,
        )

    class_count = (
        db.scalar(
            select(func.count(distinct(ClassChild.class_id))).where(
                ClassChild.child_id.in_(active_child_ids) if active_child_ids else False,
                ClassChild.status == "ACTIVE",
            )
        )
        or 0
    )
    assignment_rows = db.scalars(
        select(Assignment.id)
        .join(ClassChild, ClassChild.class_id == Assignment.class_id)
        .where(
            ClassChild.child_id.in_(active_child_ids) if active_child_ids else False,
            ClassChild.status == "ACTIVE",
            Assignment.status == "PUBLISHED",
        )
    ).all()
    assignment_ids = list(set(assignment_rows))
    submitted_assignment_count = (
        db.scalar(
            select(func.count(distinct(Submission.assignment_id))).where(
                Submission.child_id.in_(child_ids),
                Submission.assignment_id.in_(assignment_ids) if assignment_ids else False,
            )
        )
        or 0
    )
    total_submissions = db.scalar(select(func.count(Submission.id)).where(Submission.child_id.in_(child_ids))) or 0
    correct_submissions = (
        db.scalar(select(func.count(Submission.id)).where(Submission.child_id.in_(child_ids), Submission.is_correct.is_(True)))
        or 0
    )
    latest_submission_at = db.scalar(select(func.max(Submission.created_at)).where(Submission.child_id.in_(child_ids)))

    return ParentDashboardSummary(
        child_count=len(children),
        active_child_count=len(active_child_ids),
        class_count=int(class_count),
        published_assignment_count=len(assignment_ids),
        submitted_assignment_count=int(submitted_assignment_count),
        total_submissions=int(total_submissions),
        correct_submissions=int(correct_submissions),
        total_stars=sum(child.total_stars for child in children),
        total_coins=sum(child.total_coins for child in children),
        latest_submission_at=latest_submission_at,
    )
