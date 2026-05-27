from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.child import Child
from app.models.classroom import Class
from app.models.lesson import Lesson, LessonMaterial
from app.models.submission import Submission
from app.models.user import User
from app.schemas.submission import TeacherSubmissionDetail, TeacherSubmissionListItem
from app.services.submission_types import PDF_ANSWER, UNGRADED_STATUSES, is_gradable_submission


LOW_CONFIDENCE_THRESHOLD = 0.7


def review_reason(submission: Submission) -> str | None:
    if is_gradable_submission(submission.submission_type):
        if submission.grading_status in UNGRADED_STATUSES:
            return "Chưa chấm"
        if not submission.reviewed_at:
            return "Chưa review"
        return None
    if not submission.is_correct:
        return "Sai dự đoán"
    if submission.confidence is not None and float(submission.confidence) < LOW_CONFIDENCE_THRESHOLD:
        return "Confidence thấp"
    if not submission.speech_passed:
        return "Speech chưa đạt"
    if not submission.reviewed_at:
        return "Chưa review"
    return None


def _base_rows(db: Session, teacher_id: UUID):
    return (
        select(Submission, Child, User, Assignment, Class, Lesson)
        .join(Child, Child.id == Submission.child_id)
        .join(User, User.id == Child.parent_id)
        .join(Assignment, Assignment.id == Submission.assignment_id)
        .join(Class, Class.id == Assignment.class_id)
        .join(Lesson, Lesson.id == Assignment.lesson_id)
        .where(Class.teacher_id == teacher_id)
    )


def _to_list_item(
    submission: Submission,
    child: Child,
    parent: User,
    assignment: Assignment,
    classroom: Class,
    lesson: Lesson,
) -> TeacherSubmissionListItem:
    return TeacherSubmissionListItem(
        id=submission.id,
        submission_type=submission.submission_type,
        child_id=child.id,
        child_name=child.display_name,
        parent_name=parent.full_name,
        parent_email=parent.email,
        class_id=classroom.id,
        class_name=classroom.name,
        assignment_id=assignment.id,
        assignment_title=assignment.title,
        lesson_title=lesson.title,
        answer_file_url=submission.answer_file_url,
        target_class=submission.target_class,
        predicted_class=submission.predicted_class,
        confidence=float(submission.confidence) if submission.confidence is not None else None,
        is_correct=submission.is_correct,
        speech_passed=submission.speech_passed,
        speech_transcript=submission.speech_transcript,
        stars_earned=submission.stars_earned,
        coins_earned=submission.coins_earned,
        submitted_at=submission.submitted_at,
        graded_at=submission.graded_at,
        graded_by=submission.graded_by,
        score=float(submission.score) if submission.score is not None else None,
        max_score=float(submission.max_score) if submission.max_score is not None else None,
        grading_status=submission.grading_status,
        returned_at=submission.returned_at,
        teacher_feedback=submission.teacher_feedback,
        reviewed_at=submission.reviewed_at,
        reviewed_by=submission.reviewed_by,
        created_at=submission.created_at,
        review_reason=review_reason(submission),
    )


def list_teacher_submissions(
    db: Session,
    teacher_id: UUID,
    *,
    class_id: UUID | None = None,
    assignment_id: UUID | None = None,
    child_id: UUID | None = None,
    is_correct: bool | None = None,
    speech_passed: bool | None = None,
    reviewed: bool | None = None,
    grading_status: str | None = None,
    score_min: float | None = None,
    score_max: float | None = None,
    late: bool | None = None,
    confidence_min: float | None = None,
    confidence_max: float | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> list[TeacherSubmissionListItem]:
    filters = [Submission.submission_type == PDF_ANSWER]
    if class_id:
        filters.append(Class.id == class_id)
    if assignment_id:
        filters.append(Assignment.id == assignment_id)
    if child_id:
        filters.append(Child.id == child_id)
    if is_correct is not None:
        filters.append(Submission.is_correct == is_correct)
    if speech_passed is not None:
        filters.append(Submission.speech_passed == speech_passed)
    if reviewed is not None:
        filters.append(Submission.reviewed_at.is_not(None) if reviewed else Submission.reviewed_at.is_(None))
    if grading_status:
        filters.append(Submission.grading_status == grading_status.upper())
    if score_min is not None:
        filters.append(Submission.score >= score_min)
    if score_max is not None:
        filters.append(Submission.score <= score_max)
    if late is not None:
        late_condition = Assignment.due_at.is_not(None) & Submission.submitted_at.is_not(None) & (Submission.submitted_at > Assignment.due_at)
        filters.append(late_condition if late else ~late_condition)
    if confidence_min is not None:
        filters.append(Submission.confidence >= confidence_min)
    if confidence_max is not None:
        filters.append(Submission.confidence <= confidence_max)
    if date_from is not None:
        filters.append(Submission.created_at >= date_from)
    if date_to is not None:
        filters.append(Submission.created_at <= date_to)

    query = _base_rows(db, teacher_id)
    if filters:
        query = query.where(and_(*filters))
    rows = db.execute(query.order_by(Submission.created_at.desc()).limit(100)).all()
    return [_to_list_item(submission, child, parent, assignment, classroom, lesson) for submission, child, parent, assignment, classroom, lesson in rows]


def get_teacher_submission_detail(db: Session, teacher_id: UUID, submission_id: UUID) -> TeacherSubmissionDetail | None:
    row = db.execute(_base_rows(db, teacher_id).where(Submission.id == submission_id)).first()
    if not row:
        return None
    submission, child, parent, assignment, classroom, lesson = row
    base = _to_list_item(submission, child, parent, assignment, classroom, lesson)
    material_titles = db.scalars(
        select(LessonMaterial.title)
        .where(LessonMaterial.lesson_id == lesson.id)
        .order_by(LessonMaterial.sort_order.asc(), LessonMaterial.created_at.asc())
    ).all()
    return TeacherSubmissionDetail(
        **base.model_dump(),
        top_predictions=submission.top_predictions,
        canvas_image_url=submission.canvas_image_url,
        lesson_materials=list(material_titles),
    )


def update_teacher_submission_review(
    db: Session,
    teacher_id: UUID,
    submission_id: UUID,
    *,
    feedback: str | None,
    reviewed: bool,
    score: float | None = None,
    max_score: float | None = None,
    grading_status: str | None = None,
) -> TeacherSubmissionDetail | None:
    row = db.execute(_base_rows(db, teacher_id).where(Submission.id == submission_id)).first()
    if not row:
        return None
    submission = row[0]
    submission.teacher_feedback = feedback.strip() if feedback else None
    if is_gradable_submission(submission.submission_type):
        if max_score is not None:
            submission.max_score = max_score
        if score is not None:
            effective_max = float(submission.max_score or max_score or 10)
            if score > effective_max:
                raise ValueError("SCORE_EXCEEDS_MAX_SCORE")
            submission.score = score
        if grading_status is not None:
            status_value = grading_status.upper().strip()
            if status_value not in {"SUBMITTED", "GRADED", "RETURNED", "NEEDS_REVISION"}:
                raise ValueError("INVALID_GRADING_STATUS")
            submission.grading_status = status_value
        elif score is not None:
            submission.grading_status = "GRADED"
        if submission.grading_status in {"GRADED", "RETURNED"}:
            submission.graded_at = datetime.now(timezone.utc)
            submission.graded_by = teacher_id
        if submission.grading_status == "RETURNED":
            submission.returned_at = datetime.now(timezone.utc)
    if reviewed:
        submission.reviewed_at = datetime.now(timezone.utc)
        submission.reviewed_by = teacher_id
    else:
        submission.reviewed_at = None
        submission.reviewed_by = None
    db.commit()
    return get_teacher_submission_detail(db, teacher_id, submission_id)
