from __future__ import annotations

from collections.abc import Mapping, Sequence
from datetime import date, datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from fastapi import Request
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogPage, AuditLogPublic
from app.services.audit_rules import resolve_risk_level


class AuditAction(StrEnum):
    AUTH_LOGIN_SUCCESS = "AUTH.LOGIN_SUCCESS"
    AUTH_LOGIN_FAILED = "AUTH.LOGIN_FAILED"
    AUTH_ACCESS_DENIED = "AUTH.ACCESS_DENIED"
    AUTH_REGISTER_SUCCESS = "AUTH.REGISTER_SUCCESS"
    AUTH_REGISTER_REJECTED = "AUTH.REGISTER_REJECTED"
    CLASS_CREATED = "CLASS.CREATED"
    CLASS_UPDATED = "CLASS.UPDATED"
    CHILD_PROFILE_CREATED = "CHILD.PROFILE_CREATED"
    CHILD_PROFILE_UPDATED = "CHILD.PROFILE_UPDATED"
    CHILD_JOINED_CLASS = "CHILD.JOINED_CLASS"
    LESSON_CREATED = "LESSON.CREATED"
    LESSON_UPDATED = "LESSON.UPDATED"
    LESSON_MATERIAL_UPLOADED = "LESSON.MATERIAL_UPLOADED"
    LESSON_MATERIAL_DELETED = "LESSON.MATERIAL_DELETED"
    ASSIGNMENT_CREATED = "ASSIGNMENT.CREATED"
    ASSIGNMENT_UPDATED = "ASSIGNMENT.UPDATED"
    ASSIGNMENT_FILE_UPLOADED = "ASSIGNMENT.FILE_UPLOADED"
    SUBMISSION_UPLOADED = "SUBMISSION.UPLOADED"
    SUBMISSION_GRADED = "SUBMISSION.GRADED"
    CHAT_CONVERSATION_CREATED = "CHAT.CONVERSATION_CREATED"
    CHAT_MESSAGE_SENT = "CHAT.MESSAGE_SENT"
    AI_PREDICTION_REQUESTED = "AI.PREDICTION_REQUESTED"
    AI_PREDICTION_FAILED = "AI.PREDICTION_FAILED"
    UPLOAD_INVALID = "UPLOAD.INVALID"


SENSITIVE_KEYS = {
    "authorization",
    "access_token",
    "refresh_token",
    "token",
    "jwt",
    "password",
    "password_hash",
    "cookie",
    "set-cookie",
    "image_data_url",
    "image_base64",
    "canvas_image_data_url",
    "file_bytes",
    "raw_file",
}

REDACTED = "[REDACTED]"
MAX_SANITIZE_DEPTH = 6
MAX_STRING_LENGTH = 2000


def sanitize_metadata(value: Any, *, depth: int = 0) -> Any:
    if depth >= MAX_SANITIZE_DEPTH:
        return "[MAX_DEPTH]"
    if value is None or isinstance(value, (bool, int, float)):
        return value
    if isinstance(value, (UUID, date, datetime)):
        return str(value)
    if isinstance(value, str):
        return value if len(value) <= MAX_STRING_LENGTH else f"{value[:MAX_STRING_LENGTH]}...[TRUNCATED]"
    if isinstance(value, Mapping):
        return {
            str(key): REDACTED if str(key).lower() in SENSITIVE_KEYS else sanitize_metadata(item, depth=depth + 1)
            for key, item in value.items()
        }
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return [sanitize_metadata(item, depth=depth + 1) for item in value]
    if isinstance(value, (bytes, bytearray)):
        return REDACTED
    return str(value)


def get_request_context(request: Request | None) -> dict[str, str | None]:
    if not request:
        return {}
    # Do not trust X-Forwarded-For until the deployment defines trusted proxies.
    ip_address = request.client.host if request.client else None
    return {
        "request_id": request.headers.get("x-request-id"),
        "ip_address": ip_address,
        "user_agent": request.headers.get("user-agent"),
        "http_method": request.method,
        "request_path": request.url.path,
    }


def record_audit_event(
    db: Session,
    *,
    action: str | AuditAction,
    actor: User | None = None,
    actor_email: str | None = None,
    actor_role: str | None = None,
    result: str = "SUCCESS",
    risk_level: str | None = None,
    category: str = "BUSINESS",
    resource_type: str | None = None,
    resource_id: str | UUID | None = None,
    request_context: Mapping[str, Any] | None = None,
    metadata: Mapping[str, Any] | None = None,
) -> AuditLog:
    action_value = str(action).upper().strip()
    result_value = result.upper().strip()
    category_value = category.upper().strip()
    context = sanitize_metadata(dict(request_context or {}))
    safe_metadata = sanitize_metadata(dict(metadata or {}))

    event = AuditLog(
        actor_id=actor.id if actor else None,
        actor_email=(actor.email if actor else actor_email),
        actor_role=(actor.role if actor else actor_role),
        action=action_value,
        category=category_value,
        result=result_value,
        risk_level=resolve_risk_level(action=action_value, result=result_value, risk_level=risk_level),
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        request_id=context.get("request_id"),
        ip_address=context.get("ip_address"),
        user_agent=context.get("user_agent"),
        http_method=context.get("http_method"),
        request_path=context.get("request_path"),
        metadata_json=safe_metadata,
    )
    db.add(event)
    return event


def commit_audit_event(db: Session, **kwargs: Any) -> AuditLog:
    event = record_audit_event(db, **kwargs)
    db.commit()
    db.refresh(event)
    return event


def list_audit_events(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 25,
    actor_id: UUID | None = None,
    actor_query: str | None = None,
    actor_role: str | None = None,
    action: str | None = None,
    category: str | None = None,
    result: str | None = None,
    risk_level: str | None = None,
    resource_type: str | None = None,
    request_id: str | None = None,
    request_path: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> AuditLogPage:
    filters = []
    if date_from and date_to and date_from > date_to:
        raise ValueError("date_from must be before or equal to date_to")
    if actor_id:
        filters.append(AuditLog.actor_id == actor_id)
    if actor_query:
        query = f"%{actor_query.strip()}%"
        filters.append(
            or_(
                AuditLog.actor_email.ilike(query),
                AuditLog.actor_id.in_(select(User.id).where(User.full_name.ilike(query))),
            )
        )
    if actor_role:
        filters.append(AuditLog.actor_role == actor_role.upper().strip())
    if action:
        filters.append(AuditLog.action == action.upper().strip())
    if category:
        filters.append(AuditLog.category == category.upper().strip())
    if result:
        filters.append(AuditLog.result == result.upper().strip())
    if risk_level:
        filters.append(AuditLog.risk_level == resolve_risk_level(action="", result="", risk_level=risk_level))
    if resource_type:
        filters.append(AuditLog.resource_type == resource_type.upper().strip())
    if request_id:
        filters.append(AuditLog.request_id == request_id.strip())
    if request_path:
        filters.append(AuditLog.request_path.ilike(f"%{request_path.strip()}%"))
    if date_from:
        filters.append(AuditLog.occurred_at >= date_from)
    if date_to:
        filters.append(AuditLog.occurred_at <= date_to)

    total = db.scalar(select(func.count(AuditLog.id)).where(*filters)) or 0
    rows = db.scalars(
        select(AuditLog)
        .where(*filters)
        .order_by(AuditLog.occurred_at.desc(), AuditLog.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return AuditLogPage.build(
        items=[AuditLogPublic.model_validate(row) for row in rows],
        total=int(total),
        page=page,
        page_size=page_size,
    )


def list_related_audit_events(db: Session, *, event_id: UUID, limit: int = 20) -> list[AuditLogPublic]:
    event = db.get(AuditLog, event_id)
    if not event:
        raise ValueError("Audit event not found")

    related_filters = []
    if event.request_id:
        related_filters.append(AuditLog.request_id == event.request_id)
    if event.resource_type and event.resource_id:
        related_filters.append(
            (AuditLog.resource_type == event.resource_type) & (AuditLog.resource_id == event.resource_id)
        )
    if event.actor_id:
        related_filters.append(AuditLog.actor_id == event.actor_id)
    elif event.actor_email:
        related_filters.append(AuditLog.actor_email == event.actor_email)

    if not related_filters:
        return [AuditLogPublic.model_validate(event)]

    rows = db.scalars(
        select(AuditLog)
        .where(or_(*related_filters))
        .order_by(AuditLog.occurred_at.desc(), AuditLog.id.desc())
        .limit(limit)
    ).all()
    return [AuditLogPublic.model_validate(row) for row in rows]
