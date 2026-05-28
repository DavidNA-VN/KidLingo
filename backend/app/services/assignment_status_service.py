from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.assignment import Assignment


def close_overdue_assignments(
    db: Session,
    *,
    assignment_ids: list[UUID] | None = None,
    class_ids: list[UUID] | None = None,
) -> int:
    now = datetime.now(timezone.utc)
    filters = [
        Assignment.status == "PUBLISHED",
        Assignment.due_at.is_not(None),
        Assignment.due_at < now,
    ]
    if assignment_ids is not None:
        if not assignment_ids:
            return 0
        filters.append(Assignment.id.in_(assignment_ids))
    if class_ids is not None:
        if not class_ids:
            return 0
        filters.append(Assignment.class_id.in_(class_ids))

    assignments = db.scalars(select(Assignment).where(*filters)).all()
    for assignment in assignments:
        assignment.status = "CLOSED"
    if assignments:
        db.commit()
    return len(assignments)
