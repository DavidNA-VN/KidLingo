from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_teacher
from app.models.assignment import Assignment
from app.models.child import Child, ClassChild
from app.models.classroom import Class
from app.models.lesson import Lesson
from app.models.submission import Submission
from app.models.user import User
from app.schemas.teacher import (
    AssignmentMini,
    ChildSearchResponse,
    ChildSearchResult,
    MembershipCreate,
    MembershipResponse,
    MembershipUpdate,
    ParentSummary,
    RecentSubmissionSummary,
    RosterChild,
    TeacherClassCreate,
    TeacherClassDetail,
    TeacherClassSummary,
    TeacherClassUpdate,
    TeacherStudentProfile,
    TeacherStudentSubmissionSummary,
)
from app.services.class_code_service import generate_unique_class_code

router = APIRouter(prefix="/teacher", tags=["teacher"])


def _teacher_class_or_404(db: Session, teacher_id: UUID, class_id: UUID) -> Class:
    classroom = db.get(Class, class_id)
    if not classroom or classroom.teacher_id != teacher_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CLASS_NOT_FOUND")
    return classroom


def _class_stats(db: Session, class_id: UUID) -> dict[str, int]:
    active_child_count = db.scalar(
        select(func.count()).select_from(ClassChild).where(
            ClassChild.class_id == class_id,
            ClassChild.status == "ACTIVE",
        )
    )
    archived_child_count = db.scalar(
        select(func.count()).select_from(ClassChild).where(
            ClassChild.class_id == class_id,
            ClassChild.status == "ARCHIVED",
        )
    )
    assignment_count = db.scalar(
        select(func.count()).select_from(Assignment).where(Assignment.class_id == class_id)
    )
    submission_count = db.scalar(
        select(func.count())
        .select_from(Submission)
        .join(Assignment, Assignment.id == Submission.assignment_id)
        .where(Assignment.class_id == class_id)
    )
    return {
        "active_child_count": active_child_count or 0,
        "archived_child_count": archived_child_count or 0,
        "assignment_count": assignment_count or 0,
        "submission_count": submission_count or 0,
    }


@router.get("/classes", response_model=list[TeacherClassSummary])
def list_classes(
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> list[TeacherClassSummary]:
    classes = db.scalars(
        select(Class).where(Class.teacher_id == current_user.id).order_by(Class.created_at.desc())
    ).all()
    return [
        TeacherClassSummary(
            id=classroom.id,
            name=classroom.name,
            description=classroom.description,
            class_code=classroom.class_code,
            created_at=classroom.created_at,
            **_class_stats(db, classroom.id),
        )
        for classroom in classes
    ]


@router.post("/classes", response_model=TeacherClassSummary, status_code=status.HTTP_201_CREATED)
def create_class(
    payload: TeacherClassCreate,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> TeacherClassSummary:
    class_name = payload.name.strip()
    try:
        class_code = generate_unique_class_code(db, class_name)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail="CLASS_CODE_GENERATION_FAILED") from exc

    classroom = Class(
        teacher_id=current_user.id,
        name=class_name,
        description=payload.description.strip() if payload.description else None,
        class_code=class_code,
    )
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return TeacherClassSummary(
        id=classroom.id,
        name=classroom.name,
        description=classroom.description,
        class_code=classroom.class_code,
        created_at=classroom.created_at,
        **_class_stats(db, classroom.id),
    )


@router.get("/classes/{class_id}", response_model=TeacherClassDetail)
def get_class_detail(
    class_id: UUID,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> TeacherClassDetail:
    classroom = _teacher_class_or_404(db, current_user.id, class_id)
    stats = _class_stats(db, class_id)

    roster_rows = db.execute(
        select(ClassChild, Child, User)
        .join(Child, Child.id == ClassChild.child_id)
        .join(User, User.id == Child.parent_id)
        .where(ClassChild.class_id == class_id)
        .order_by(ClassChild.status.asc(), Child.display_name.asc())
    ).all()
    roster = [
        RosterChild(
            id=child.id,
            display_name=child.display_name,
            birth_year=child.birth_year,
            nickname=child.nickname,
            status=child.status,
            membership_status=link.status,
            total_stars=child.total_stars,
            total_coins=child.total_coins,
            joined_at=link.joined_at,
            parent=ParentSummary(id=parent.id, full_name=parent.full_name, email=parent.email),
        )
        for link, child, parent in roster_rows
    ]

    assignment_rows = db.execute(
        select(Assignment, Lesson, func.count(Submission.id).label("submission_count"))
        .join(Lesson, Lesson.id == Assignment.lesson_id)
        .outerjoin(Submission, Submission.assignment_id == Assignment.id)
        .where(Assignment.class_id == class_id)
        .group_by(Assignment.id, Lesson.id)
        .order_by(Assignment.created_at.desc())
    ).all()
    assignments = [
        AssignmentMini(
            id=assignment.id,
            title=assignment.title,
            status=assignment.status,
            lesson_title=lesson.title,
            max_score=float(assignment.max_score or 10),
            due_at=assignment.due_at,
            submission_count=submission_count or 0,
        )
        for assignment, lesson, submission_count in assignment_rows
    ]

    submission_rows = db.execute(
        select(Submission, Child, Assignment)
        .join(Assignment, Assignment.id == Submission.assignment_id)
        .join(Child, Child.id == Submission.child_id)
        .where(Assignment.class_id == class_id)
        .order_by(Submission.created_at.desc())
        .limit(8)
    ).all()
    recent_submissions = [
        RecentSubmissionSummary(
            id=submission.id,
            child_id=child.id,
            child_name=child.display_name,
            child_nickname=child.nickname,
            child_birth_year=child.birth_year,
            assignment_id=assignment.id,
            assignment_title=assignment.title,
            target_class=submission.target_class,
            predicted_class=submission.predicted_class,
            is_correct=submission.is_correct,
            confidence=float(submission.confidence) if submission.confidence is not None else None,
            stars_earned=submission.stars_earned,
            coins_earned=submission.coins_earned,
            created_at=submission.created_at,
        )
        for submission, child, assignment in submission_rows
    ]

    return TeacherClassDetail(
        id=classroom.id,
        name=classroom.name,
        description=classroom.description,
        class_code=classroom.class_code,
        roster=roster,
        assignments=assignments,
        recent_submissions=recent_submissions,
        **stats,
    )


@router.patch("/classes/{class_id}", response_model=TeacherClassSummary)
def update_class(
    class_id: UUID,
    payload: TeacherClassUpdate,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> TeacherClassSummary:
    classroom = _teacher_class_or_404(db, current_user.id, class_id)
    if payload.name is not None:
        classroom.name = payload.name.strip()
    if payload.description is not None:
        classroom.description = payload.description.strip() or None
    db.commit()
    db.refresh(classroom)
    return TeacherClassSummary(
        id=classroom.id,
        name=classroom.name,
        description=classroom.description,
        class_code=classroom.class_code,
        created_at=classroom.created_at,
        **_class_stats(db, classroom.id),
    )


@router.get("/children/search", response_model=ChildSearchResponse)
def search_children(
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
    q: Annotated[str, Query(min_length=1, max_length=120)] = "",
) -> ChildSearchResponse:
    query = f"%{q.strip()}%"
    rows = db.execute(
        select(Child, User)
        .join(User, User.id == Child.parent_id)
        .where(
            and_(
                Child.status == "ACTIVE",
                or_(
                    Child.display_name.ilike(query),
                    User.email.ilike(query),
                    User.full_name.ilike(query),
                ),
            )
        )
        .order_by(Child.display_name.asc())
        .limit(10)
    ).all()
    return ChildSearchResponse(
        items=[
            ChildSearchResult(
                id=child.id,
                display_name=child.display_name,
                birth_year=child.birth_year,
                nickname=child.nickname,
                status=child.status,
                total_stars=child.total_stars,
                total_coins=child.total_coins,
                parent=ParentSummary(id=parent.id, full_name=parent.full_name, email=parent.email),
            )
            for child, parent in rows
        ]
    )


@router.post("/classes/{class_id}/children", response_model=MembershipResponse, status_code=status.HTTP_201_CREATED)
def add_child_to_class(
    class_id: UUID,
    payload: MembershipCreate,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> ClassChild:
    _teacher_class_or_404(db, current_user.id, class_id)
    child = db.get(Child, payload.child_id)
    if not child or child.status != "ACTIVE":
        raise HTTPException(status_code=404, detail="CHILD_NOT_FOUND")

    membership = db.get(ClassChild, {"class_id": class_id, "child_id": payload.child_id})
    if membership:
        membership.status = "ACTIVE"
    else:
        membership = ClassChild(class_id=class_id, child_id=payload.child_id, status="ACTIVE")
        db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


@router.patch("/classes/{class_id}/children/{child_id}", response_model=MembershipResponse)
def update_child_membership(
    class_id: UUID,
    child_id: UUID,
    payload: MembershipUpdate,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> ClassChild:
    _teacher_class_or_404(db, current_user.id, class_id)
    status_value = payload.status.upper().strip()
    if status_value not in {"ACTIVE", "ARCHIVED"}:
        raise HTTPException(status_code=400, detail="INVALID_MEMBERSHIP_STATUS")

    membership = db.get(ClassChild, {"class_id": class_id, "child_id": child_id})
    if not membership:
        raise HTTPException(status_code=404, detail="MEMBERSHIP_NOT_FOUND")

    membership.status = status_value
    db.commit()
    db.refresh(membership)
    return membership


@router.get("/classes/{class_id}/children/{child_id}/profile", response_model=TeacherStudentProfile)
def get_student_profile(
    class_id: UUID,
    child_id: UUID,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> TeacherStudentProfile:
    classroom = _teacher_class_or_404(db, current_user.id, class_id)
    row = db.execute(
        select(ClassChild, Child, User)
        .join(Child, Child.id == ClassChild.child_id)
        .join(User, User.id == Child.parent_id)
        .where(ClassChild.class_id == class_id, ClassChild.child_id == child_id)
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="STUDENT_NOT_FOUND")

    membership, child, parent = row
    assignment_count = db.scalar(
        select(func.count()).select_from(Assignment).where(Assignment.class_id == class_id)
    ) or 0
    submission_count = db.scalar(
        select(func.count())
        .select_from(Submission)
        .join(Assignment, Assignment.id == Submission.assignment_id)
        .where(Assignment.class_id == class_id, Submission.child_id == child_id)
    ) or 0
    submission_rows = db.execute(
        select(Submission, Assignment)
        .join(Assignment, Assignment.id == Submission.assignment_id)
        .where(Assignment.class_id == class_id, Submission.child_id == child_id)
        .order_by(Submission.created_at.desc())
        .limit(5)
    ).all()

    age = None
    if child.birth_year:
        from datetime import datetime, timezone

        age = datetime.now(timezone.utc).year - child.birth_year

    return TeacherStudentProfile(
        id=child.id,
        display_name=child.display_name,
        nickname=child.nickname,
        birth_year=child.birth_year,
        age=age,
        avatar_url=child.avatar_url,
        profile_note=child.profile_note,
        status=child.status,
        parent=ParentSummary(id=parent.id, full_name=parent.full_name, email=parent.email),
        class_id=classroom.id,
        class_name=classroom.name,
        membership_status=membership.status,
        joined_at=membership.joined_at,
        total_stars=child.total_stars,
        total_coins=child.total_coins,
        assignment_count=int(assignment_count),
        submission_count=int(submission_count),
        latest_submissions=[
            TeacherStudentSubmissionSummary(
                id=submission.id,
                submission_type=submission.submission_type,
                assignment_id=assignment.id,
                assignment_title=assignment.title,
                score=float(submission.score) if submission.score is not None else None,
                max_score=float(submission.max_score) if submission.max_score is not None else None,
                grading_status=submission.grading_status,
                submitted_at=submission.submitted_at,
                created_at=submission.created_at,
            )
            for submission, assignment in submission_rows
        ],
    )
