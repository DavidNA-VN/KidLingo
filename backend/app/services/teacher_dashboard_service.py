from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.child import Child, ClassChild
from app.models.classroom import Class
from app.models.lesson import Lesson, LessonMaterial
from app.models.submission import Submission
from app.services.assignment_status_service import close_overdue_assignments
from app.services.submission_types import GRADED_STATUSES, PDF_ANSWER, UNGRADED_STATUSES, is_gradable_submission
from app.schemas.dashboard import (
    AssignmentProgressItem,
    ClassProgressItem,
    DashboardSubmissionItem,
    StatusBreakdownItem,
    SubmissionQualityItem,
    TeacherDashboardResponse,
    TeacherDashboardSummary,
    TopStudentItem,
)


LOW_CONFIDENCE_THRESHOLD = 0.7


def _rate(part: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return round(part / total, 4)


def _submission_review_reason(submission: Submission) -> str | None:
    if is_gradable_submission(submission.submission_type):
        if submission.grading_status in UNGRADED_STATUSES:
            return "Chưa chấm"
        return None
    if not submission.is_correct:
        return "Sai dự đoán"
    if submission.confidence is not None and float(submission.confidence) < LOW_CONFIDENCE_THRESHOLD:
        return "Confidence thấp"
    if not submission.speech_passed:
        return "Speech chưa đạt"
    return None


def _material_count_map(db: Session, lesson_ids: set[UUID]) -> dict[UUID, int]:
    if not lesson_ids:
        return {}
    rows = db.execute(
        select(LessonMaterial.lesson_id, func.count(LessonMaterial.id))
        .where(LessonMaterial.lesson_id.in_(lesson_ids))
        .group_by(LessonMaterial.lesson_id)
    ).all()
    return {lesson_id: count or 0 for lesson_id, count in rows}


def _active_children_by_class(db: Session, class_ids: list[UUID]) -> dict[UUID, set[UUID]]:
    if not class_ids:
        return {}
    rows = db.execute(
        select(ClassChild.class_id, ClassChild.child_id)
        .join(Child, Child.id == ClassChild.child_id)
        .where(
            ClassChild.class_id.in_(class_ids),
            ClassChild.status == "ACTIVE",
            Child.status == "ACTIVE",
        )
    ).all()
    result: dict[UUID, set[UUID]] = defaultdict(set)
    for class_id, child_id in rows:
        result[class_id].add(child_id)
    return result


def _assignment_progress_items(db: Session, teacher_id: UUID, class_id: UUID | None = None) -> list[AssignmentProgressItem]:
    teacher_class_ids = db.scalars(select(Class.id).where(Class.teacher_id == teacher_id)).all()
    if class_id is not None and class_id not in set(teacher_class_ids):
        raise ValueError("CLASS_NOT_FOUND")
    close_overdue_assignments(db, class_ids=[class_id] if class_id is not None else list(teacher_class_ids))
    filters = [Class.teacher_id == teacher_id, Assignment.status.in_(["PUBLISHED", "CLOSED"])]
    if class_id is not None:
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

    class_ids = [classroom.id for _, classroom, _ in rows]
    assignment_ids = [assignment.id for assignment, _, _ in rows]
    lesson_ids = {lesson.id for _, _, lesson in rows}
    active_children = _active_children_by_class(db, class_ids)
    material_counts = _material_count_map(db, lesson_ids)

    submission_rows = db.scalars(select(Submission).where(Submission.assignment_id.in_(assignment_ids))).all()
    submissions_by_assignment: dict[UUID, list[Submission]] = defaultdict(list)
    for submission in submission_rows:
        submissions_by_assignment[submission.assignment_id].append(submission)

    items: list[AssignmentProgressItem] = []
    for assignment, classroom, lesson in rows:
        assigned_child_ids = active_children.get(classroom.id, set())
        submissions = submissions_by_assignment.get(assignment.id, [])
        pdf_submissions = [submission for submission in submissions if submission.submission_type == PDF_ANSWER]
        submitted_child_ids = {submission.child_id for submission in pdf_submissions}
        assigned_count = len(assigned_child_ids)
        submitted_count = len(submitted_child_ids & assigned_child_ids) if assigned_child_ids else len(submitted_child_ids)
        confidence_values = [float(submission.confidence) for submission in submissions if submission.confidence is not None]
        score_values = [
            float(submission.score)
            for submission in pdf_submissions
            if submission.score is not None and submission.grading_status in GRADED_STATUSES
        ]
        items.append(
            AssignmentProgressItem(
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
                lesson_title=lesson.title,
                material_count=material_counts.get(lesson.id, 0),
                assigned_child_count=assigned_count,
                submitted_child_count=submitted_count,
                missing_child_count=max(assigned_count - submitted_count, 0),
                correct_count=sum(1 for submission in submissions if submission.submission_type != PDF_ANSWER and submission.is_correct),
                incorrect_count=sum(1 for submission in submissions if submission.submission_type != PDF_ANSWER and not submission.is_correct),
                speech_failed_count=sum(1 for submission in submissions if not submission.speech_passed),
                ungraded_submission_count=sum(1 for submission in pdf_submissions if submission.grading_status in UNGRADED_STATUSES),
                graded_submission_count=sum(1 for submission in pdf_submissions if submission.grading_status in GRADED_STATUSES),
                average_score=round(sum(score_values) / len(score_values), 2) if score_values else None,
                completion_rate=_rate(submitted_count, assigned_count),
                average_confidence=round(sum(confidence_values) / len(confidence_values), 4)
                if confidence_values
                else None,
            )
        )
    return items


def _class_progress_items(
    db: Session,
    teacher_id: UUID,
    assignment_items: list[AssignmentProgressItem],
    class_id: UUID | None = None,
) -> list[ClassProgressItem]:
    filters = [Class.teacher_id == teacher_id]
    if class_id is not None:
        filters.append(Class.id == class_id)
    classes = db.scalars(select(Class).where(*filters).order_by(Class.created_at.desc())).all()
    if class_id is not None and not classes:
        raise ValueError("CLASS_NOT_FOUND")
    active_children = _active_children_by_class(db, [classroom.id for classroom in classes])
    assignments_by_class: dict[UUID, list[AssignmentProgressItem]] = defaultdict(list)
    for item in assignment_items:
        assignments_by_class[item.class_id].append(item)

    result: list[ClassProgressItem] = []
    for classroom in classes:
        class_assignments = assignments_by_class.get(classroom.id, [])
        assigned_slots = sum(item.assigned_child_count for item in class_assignments)
        submitted_slots = sum(item.submitted_child_count for item in class_assignments)
        score_values = [item.average_score for item in class_assignments if item.average_score is not None]
        result.append(
            ClassProgressItem(
                class_id=classroom.id,
                class_name=classroom.name,
                class_code=classroom.class_code,
                active_child_count=len(active_children.get(classroom.id, set())),
                assignment_count=len(class_assignments),
                submitted_count=submitted_slots,
                missing_count=max(assigned_slots - submitted_slots, 0),
                ungraded_submission_count=sum(item.ungraded_submission_count for item in class_assignments),
                graded_submission_count=sum(item.graded_submission_count for item in class_assignments),
                average_score=round(sum(score_values) / len(score_values), 2) if score_values else None,
                completion_rate=_rate(submitted_slots, assigned_slots),
            )
        )
    return result


def _dashboard_submissions(
    db: Session,
    teacher_id: UUID,
    class_id: UUID | None = None,
) -> tuple[list[DashboardSubmissionItem], list[DashboardSubmissionItem]]:
    filters = [Class.teacher_id == teacher_id]
    if class_id is not None:
        filters.append(Class.id == class_id)
    rows = db.execute(
        select(Submission, Child, Assignment, Class)
        .join(Assignment, Assignment.id == Submission.assignment_id)
        .join(Class, Class.id == Assignment.class_id)
        .join(Child, Child.id == Submission.child_id)
        .where(*filters)
        .order_by(Submission.created_at.desc())
        .limit(40)
    ).all()
    recent: list[DashboardSubmissionItem] = []
    review: list[DashboardSubmissionItem] = []
    for submission, child, assignment, classroom in rows:
        reason = _submission_review_reason(submission)
        item = DashboardSubmissionItem(
            id=submission.id,
            submission_type=submission.submission_type,
            child_id=child.id,
            child_name=child.display_name,
            class_name=classroom.name,
            assignment_id=assignment.id,
            assignment_title=assignment.title,
            predicted_class=submission.predicted_class,
            is_correct=submission.is_correct,
            confidence=float(submission.confidence) if submission.confidence is not None else None,
            speech_passed=submission.speech_passed,
            stars_earned=submission.stars_earned,
            coins_earned=submission.coins_earned,
            grading_status=submission.grading_status,
            score=float(submission.score) if submission.score is not None else None,
            max_score=float(submission.max_score) if submission.max_score is not None else None,
            created_at=submission.created_at,
            review_reason=reason,
        )
        recent.append(item)
        if reason and len(review) < 8:
            review.append(item)
    return recent[:8], review


def _top_students(db: Session, teacher_id: UUID, class_id: UUID | None = None) -> list[TopStudentItem]:
    filters = [
        Class.teacher_id == teacher_id,
        Submission.submission_type == PDF_ANSWER,
        Submission.score.is_not(None),
        Submission.grading_status.in_(GRADED_STATUSES),
    ]
    if class_id is not None:
        filters.append(Class.id == class_id)
    rows = db.execute(
        select(Submission, Child, Class)
        .join(Assignment, Assignment.id == Submission.assignment_id)
        .join(Class, Class.id == Assignment.class_id)
        .join(Child, Child.id == Submission.child_id)
        .where(*filters)
    ).all()
    student_scores: dict[tuple[UUID, UUID], dict[str, object]] = {}
    for submission, child, classroom in rows:
        max_score = float(submission.max_score or 10)
        if max_score <= 0:
            continue
        key = (child.id, classroom.id)
        if key not in student_scores:
            student_scores[key] = {
                "child": child,
                "classroom": classroom,
                "scores": [],
            }
        student_scores[key]["scores"].append(float(submission.score) / max_score * 10)

    items: list[TopStudentItem] = []
    for entry in student_scores.values():
        scores = entry["scores"]
        if not scores:
            continue
        child = entry["child"]
        classroom = entry["classroom"]
        items.append(
            TopStudentItem(
                child_id=child.id,
                child_name=child.display_name,
                class_id=classroom.id,
                class_name=classroom.name,
                graded_submission_count=len(scores),
                average_score=round(sum(scores) / len(scores), 2),
            )
        )
    return sorted(items, key=lambda item: (item.average_score, item.graded_submission_count), reverse=True)[:5]


def get_teacher_dashboard(db: Session, teacher_id: UUID, class_id: UUID | None = None) -> TeacherDashboardResponse:
    assignment_items = _assignment_progress_items(db, teacher_id, class_id=class_id)
    class_items = _class_progress_items(db, teacher_id, assignment_items, class_id=class_id)
    recent_submissions, review_submissions = _dashboard_submissions(db, teacher_id, class_id=class_id)

    now = datetime.now(timezone.utc)
    seven_days_later = now + timedelta(days=7)
    upcoming = [
        item
        for item in assignment_items
        if item.status == "PUBLISHED" and item.due_at is not None and now <= item.due_at <= seven_days_later
    ][:6]

    status_counts = Counter(item.status for item in assignment_items)
    status_breakdown = [
        StatusBreakdownItem(status=status, count=status_counts.get(status, 0))
        for status in ["PUBLISHED", "CLOSED"]
    ]
    graded_pdf_items = [
        item
        for item in recent_submissions
        if item.submission_type == PDF_ANSWER and item.score is not None and item.max_score
    ]
    score_buckets = {
        "Điểm >= 8": 0,
        "Điểm 6.5-7.9": 0,
        "Điểm 5-6.4": 0,
        "Điểm < 5": 0,
    }
    for item in graded_pdf_items:
        normalized_score = (item.score or 0) / (item.max_score or 10) * 10
        if normalized_score >= 8:
            score_buckets["Điểm >= 8"] += 1
        elif normalized_score >= 6.5:
            score_buckets["Điểm 6.5-7.9"] += 1
        elif normalized_score >= 5:
            score_buckets["Điểm 5-6.4"] += 1
        else:
            score_buckets["Điểm < 5"] += 1
    pronunciation_items = [item for item in recent_submissions if item.submission_type != PDF_ANSWER]
    speech_failed_count = sum(1 for item in pronunciation_items if not item.speech_passed)
    speech_passed_count = sum(1 for item in pronunciation_items if item.speech_passed)
    submission_quality = [
        *[SubmissionQualityItem(label=label, count=count) for label, count in score_buckets.items()],
        SubmissionQualityItem(label="Phát âm đạt", count=speech_passed_count),
        SubmissionQualityItem(label="Phát âm chưa đạt", count=speech_failed_count),
    ]
    pronunciation_pass_rate = _rate(speech_passed_count, len(pronunciation_items))

    completion_rates = [item.completion_rate for item in assignment_items if item.assigned_child_count > 0]
    confidence_values = [item.average_confidence for item in assignment_items if item.average_confidence is not None]
    score_values = [item.average_score for item in assignment_items if item.average_score is not None]
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    new_submission_count = sum(1 for item in recent_submissions if item.created_at >= today_start)

    summary = TeacherDashboardSummary(
        class_count=len(class_items),
        active_child_count=sum(item.active_child_count for item in class_items),
        open_assignment_count=sum(1 for item in assignment_items if item.status == "PUBLISHED"),
        new_submission_count=new_submission_count,
        review_submission_count=len(review_submissions),
        ungraded_submission_count=sum(item.ungraded_submission_count for item in assignment_items),
        average_completion_rate=round(sum(completion_rates) / len(completion_rates), 4) if completion_rates else 0.0,
        average_confidence=round(sum(confidence_values) / len(confidence_values), 4) if confidence_values else None,
        average_score=round(sum(score_values) / len(score_values), 2) if score_values else None,
    )

    return TeacherDashboardResponse(
        summary=summary,
        class_progress=class_items,
        assignment_progress=assignment_items[:12],
        status_breakdown=status_breakdown,
        submission_quality=submission_quality,
        score_distribution=[SubmissionQualityItem(label=label, count=count) for label, count in score_buckets.items()],
        pronunciation_pass_rate=pronunciation_pass_rate,
        ungraded_by_class=[item for item in class_items if item.ungraded_submission_count > 0],
        assignment_stats_by_class=class_items,
        top_students=_top_students(db, teacher_id, class_id=class_id),
        upcoming_assignments=upcoming,
        review_submissions=review_submissions,
        recent_submissions=recent_submissions,
    )


def get_class_analytics(db: Session, teacher_id: UUID, class_id: UUID) -> ClassProgressItem:
    classroom = db.get(Class, class_id)
    if not classroom or classroom.teacher_id != teacher_id:
        raise ValueError("CLASS_NOT_FOUND")
    dashboard = get_teacher_dashboard(db, teacher_id)
    for item in dashboard.class_progress:
        if item.class_id == class_id:
            return item
    raise ValueError("CLASS_NOT_FOUND")


def get_assignment_progress(db: Session, teacher_id: UUID, assignment_id: UUID) -> AssignmentProgressItem:
    for item in _assignment_progress_items(db, teacher_id):
        if item.assignment_id == assignment_id:
            return item
    raise ValueError("ASSIGNMENT_NOT_FOUND")
