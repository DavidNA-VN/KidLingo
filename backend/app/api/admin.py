from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from app.models.user import User
from app.schemas.audit import AuditLogPage, AuditLogPublic
from app.schemas.admin import AdminDashboardResponse, SuspiciousActivityAlert
from app.services.admin_dashboard_service import get_admin_dashboard, list_suspicious_activities
from app.services.audit_service import list_audit_events, list_related_audit_events


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/status")
def get_admin_status(current_user: Annotated[User, Depends(require_admin)]) -> dict[str, str]:
    return {
        "status": "ok",
        "service": "admin",
        "admin_id": str(current_user.id),
        "admin_email": current_user.email,
    }


@router.get("/audit-logs", response_model=AuditLogPage)
def get_audit_logs(
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
    actor_id: UUID | None = None,
    actor_query: Annotated[str | None, Query(max_length=255)] = None,
    actor_role: Annotated[str | None, Query(max_length=20)] = None,
    action: Annotated[str | None, Query(max_length=120)] = None,
    category: Annotated[str | None, Query(max_length=40)] = None,
    result: Annotated[str | None, Query(max_length=20)] = None,
    risk_level: Annotated[str | None, Query(max_length=20)] = None,
    resource_type: Annotated[str | None, Query(max_length=80)] = None,
    request_id: Annotated[str | None, Query(max_length=120)] = None,
    request_path: Annotated[str | None, Query(max_length=255)] = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> AuditLogPage:
    try:
        return list_audit_events(
            db,
            page=page,
            page_size=page_size,
            actor_id=actor_id,
            actor_query=actor_query,
            actor_role=actor_role,
            action=action,
            category=category,
            result=result,
            risk_level=risk_level,
            resource_type=resource_type,
            request_id=request_id,
            request_path=request_path,
            date_from=date_from,
            date_to=date_to,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/audit-logs/{event_id}/related", response_model=list[AuditLogPublic])
def get_related_audit_logs(
    event_id: UUID,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list[AuditLogPublic]:
    try:
        return list_related_audit_events(db, event_id=event_id, limit=limit)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/dashboard", response_model=AdminDashboardResponse)
def get_dashboard(
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    days: Annotated[int, Query(ge=3, le=30)] = 7,
) -> AdminDashboardResponse:
    return get_admin_dashboard(db, days=days)


@router.get("/suspicious-activities", response_model=list[SuspiciousActivityAlert])
def get_suspicious_activities(
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    minutes: Annotated[int, Query(ge=1, le=1440)] = 10,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list[SuspiciousActivityAlert]:
    return list_suspicious_activities(db, minutes=minutes, limit=limit)
