from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.audit_log import AuditLog
from app.models.chat import Message
from app.models.classroom import Class
from app.models.submission import Submission
from app.models.user import User
from app.schemas.admin import (
    AdminActivityTrendPoint,
    AdminAssignmentStatusItem,
    AdminClassSubmissionItem,
    AdminDashboardMetric,
    AdminDashboardResponse,
    AdminFeatureOperations,
    AdminRiskDistributionItem,
    SuspiciousActivityAlert,
)
from app.schemas.audit import AuditLogPublic


RULES = {
    "AUTH.LOGIN_FAILED": {
        "reason": "MULTIPLE_LOGIN_FAILURES",
        "title": "Nhiều lần đăng nhập thất bại",
        "description": "Phát hiện nhiều lần đăng nhập thất bại trong thời gian ngắn.",
        "threshold": 3,
        "risk_level": "HIGH",
    },
    "AUTH.ACCESS_DENIED": {
        "reason": "REPEATED_ACCESS_DENIED",
        "title": "Truy cập bị từ chối lặp lại",
        "description": "Một tài khoản hoặc địa chỉ IP liên tục truy cập tài nguyên không được phép.",
        "threshold": 2,
        "risk_level": "HIGH",
    },
    "UPLOAD.INVALID": {
        "reason": "REPEATED_INVALID_UPLOAD",
        "title": "Upload không hợp lệ lặp lại",
        "description": "Phát hiện nhiều lần gửi file không hợp lệ.",
        "threshold": 2,
        "risk_level": "MEDIUM",
    },
    "AI.PREDICTION_FAILED": {
        "reason": "REPEATED_AI_FAILURE",
        "title": "Yêu cầu AI lỗi lặp lại",
        "description": "Phát hiện nhiều yêu cầu AI thất bại trong thời gian ngắn.",
        "threshold": 2,
        "risk_level": "MEDIUM",
    },
}


def list_suspicious_activities(
    db: Session,
    *,
    minutes: int = 10,
    limit: int = 20,
) -> list[SuspiciousActivityAlert]:
    since = datetime.now(UTC) - timedelta(minutes=minutes)
    alerts: list[SuspiciousActivityAlert] = []

    for action, rule in RULES.items():
        rows = db.execute(
            select(
                AuditLog.actor_email,
                AuditLog.actor_role,
                AuditLog.ip_address,
                AuditLog.request_path,
                func.min(AuditLog.occurred_at).label("first_seen"),
                func.max(AuditLog.occurred_at).label("last_seen"),
                func.count(AuditLog.id).label("event_count"),
            )
            .where(AuditLog.action == action, AuditLog.occurred_at >= since)
            .group_by(AuditLog.actor_email, AuditLog.actor_role, AuditLog.ip_address, AuditLog.request_path)
            .having(func.count(AuditLog.id) >= rule["threshold"])
        ).all()
        alerts.extend(
            SuspiciousActivityAlert(
                reason=rule["reason"],
                title=rule["title"],
                description=rule["description"],
                risk_level=rule["risk_level"],
                action=action,
                actor_email=actor_email,
                actor_role=actor_role,
                ip_address=ip_address,
                request_path=request_path,
                first_seen=first_seen,
                last_seen=last_seen,
                event_count=int(event_count),
            )
            for actor_email, actor_role, ip_address, request_path, first_seen, last_seen, event_count in rows
        )

    volume_rows = db.execute(
        select(
            AuditLog.actor_email,
            AuditLog.actor_role,
            AuditLog.ip_address,
            func.min(AuditLog.occurred_at).label("first_seen"),
            func.max(AuditLog.occurred_at).label("last_seen"),
            func.count(AuditLog.id).label("event_count"),
        )
        .where(
            AuditLog.occurred_at >= since,
            AuditLog.category.in_(["BUSINESS", "CHAT", "AI", "UPLOAD"]),
        )
        .group_by(AuditLog.actor_email, AuditLog.actor_role, AuditLog.ip_address)
        .having(func.count(AuditLog.id) >= 20)
    ).all()
    alerts.extend(
        SuspiciousActivityAlert(
            reason="UNUSUAL_ACTIVITY_VOLUME",
            title="Tần suất thao tác bất thường",
            description="Một tài khoản hoặc địa chỉ IP phát sinh số lượng thao tác cao trong thời gian ngắn.",
            risk_level="HIGH",
            action="ACTIVITY.HIGH_VOLUME",
            actor_email=actor_email,
            actor_role=actor_role,
            ip_address=ip_address,
            request_path=None,
            first_seen=first_seen,
            last_seen=last_seen,
            event_count=int(event_count),
        )
        for actor_email, actor_role, ip_address, first_seen, last_seen, event_count in volume_rows
    )

    risk_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    alerts.sort(key=lambda item: (risk_order.get(item.risk_level, 3), -item.last_seen.timestamp()))
    return alerts[:limit]


def _count(db: Session, model: type) -> int:
    return int(db.scalar(select(func.count()).select_from(model)) or 0)


def _period_delta(
    db: Session,
    model: type,
    column,
    *,
    since: datetime,
    previous_since: datetime,
    filters: tuple = (),
) -> int:
    current = db.scalar(select(func.count()).select_from(model).where(column >= since, *filters)) or 0
    previous = db.scalar(
        select(func.count()).select_from(model).where(column >= previous_since, column < since, *filters)
    ) or 0
    return int(current - previous)


def _daily_counts(db: Session, column, *, since: datetime, filters: tuple = ()) -> dict[str, int]:
    day = func.date_trunc("day", column).label("day")
    rows = db.execute(
        select(day, func.count().label("total"))
        .where(column >= since, *filters)
        .group_by(day)
        .order_by(day)
    ).all()
    return {row.day.date().isoformat(): int(row.total) for row in rows}


def _dashboard_metrics(
    db: Session,
    *,
    since: datetime,
    previous_since: datetime,
    alert_count: int,
    days: int,
) -> list[AdminDashboardMetric]:
    active_users = db.scalar(
        select(func.count(distinct(AuditLog.actor_id))).where(
            AuditLog.actor_id.is_not(None),
            AuditLog.occurred_at >= since,
        )
    ) or 0
    ai_predictions = db.scalar(
        select(func.count(AuditLog.id)).where(AuditLog.action == "AI.PREDICTION_REQUESTED")
    ) or 0
    pdf_submissions = db.scalar(
        select(func.count(Submission.id)).where(Submission.submission_type == "PDF_ANSWER")
    ) or 0
    return [
        AdminDashboardMetric(
            key="users",
            label="Người dùng",
            value=_count(db, User),
            delta=_period_delta(db, User, User.created_at, since=since, previous_since=previous_since),
            delta_label="so với kỳ trước",
        ),
        AdminDashboardMetric(
            key="active_users",
            label="Người dùng hoạt động",
            value=int(active_users),
            delta=int(active_users),
            delta_label=f"trong {days} ngày",
        ),
        AdminDashboardMetric(
            key="classes",
            label="Lớp học",
            value=_count(db, Class),
            delta=_period_delta(db, Class, Class.created_at, since=since, previous_since=previous_since),
            delta_label="so với kỳ trước",
        ),
        AdminDashboardMetric(
            key="assignments",
            label="Bài tập",
            value=_count(db, Assignment),
            delta=_period_delta(db, Assignment, Assignment.created_at, since=since, previous_since=previous_since),
            delta_label="so với kỳ trước",
        ),
        AdminDashboardMetric(
            key="submissions",
            label="Bài nộp PDF",
            value=int(pdf_submissions),
            delta=_period_delta(
                db,
                Submission,
                Submission.created_at,
                since=since,
                previous_since=previous_since,
                filters=(Submission.submission_type == "PDF_ANSWER",),
            ),
            delta_label="so với kỳ trước",
        ),
        AdminDashboardMetric(
            key="ai_predictions",
            label="AI predictions",
            value=int(ai_predictions),
            delta=_period_delta(
                db,
                AuditLog,
                AuditLog.occurred_at,
                since=since,
                previous_since=previous_since,
                filters=(AuditLog.action == "AI.PREDICTION_REQUESTED",),
            ),
            delta_label="sự kiện audit so với kỳ trước",
        ),
        AdminDashboardMetric(
            key="messages",
            label="Tin nhắn",
            value=_count(db, Message),
            delta=_period_delta(db, Message, Message.created_at, since=since, previous_since=previous_since),
            delta_label="so với kỳ trước",
        ),
        AdminDashboardMetric(
            key="security_alerts",
            label="Cảnh báo bảo mật",
            value=alert_count,
            delta=alert_count,
            delta_label="cần điều tra trong 24 giờ",
        ),
    ]


def _activity_trend(db: Session, *, since: datetime, days: int) -> list[AdminActivityTrendPoint]:
    audit_events = _daily_counts(db, AuditLog.occurred_at, since=since)
    login_failures = _daily_counts(
        db,
        AuditLog.occurred_at,
        since=since,
        filters=(AuditLog.action == "AUTH.LOGIN_FAILED",),
    )
    ai_predictions = _daily_counts(
        db,
        AuditLog.occurred_at,
        since=since,
        filters=(AuditLog.action == "AI.PREDICTION_REQUESTED",),
    )
    submissions = _daily_counts(db, Submission.created_at, since=since)
    messages = _daily_counts(db, Message.created_at, since=since)
    start_date = since.date()
    return [
        AdminActivityTrendPoint(
            date=(start_date + timedelta(days=offset)).isoformat(),
            label=(start_date + timedelta(days=offset)).strftime("%d/%m"),
            audit_events=audit_events.get((start_date + timedelta(days=offset)).isoformat(), 0),
            login_failures=login_failures.get((start_date + timedelta(days=offset)).isoformat(), 0),
            submissions=submissions.get((start_date + timedelta(days=offset)).isoformat(), 0),
            ai_predictions=ai_predictions.get((start_date + timedelta(days=offset)).isoformat(), 0),
            messages=messages.get((start_date + timedelta(days=offset)).isoformat(), 0),
        )
        for offset in range(days)
    ]


def _risk_distribution(db: Session, *, since: datetime) -> list[AdminRiskDistributionItem]:
    risk_levels = ("LOW", "MEDIUM", "HIGH")
    rows = db.execute(
        select(AuditLog.risk_level, func.count(AuditLog.id).label("total"))
        .where(AuditLog.occurred_at >= since)
        .group_by(AuditLog.risk_level)
    ).all()
    counts = {row.risk_level: int(row.total) for row in rows}
    total = sum(counts.values())
    return [
        AdminRiskDistributionItem(
            risk_level=risk_level,
            count=counts.get(risk_level, 0),
            percentage=round((counts.get(risk_level, 0) / total * 100) if total else 0, 1),
        )
        for risk_level in risk_levels
    ]


def _feature_operations(db: Session) -> AdminFeatureOperations:
    submission_rows = db.execute(
        select(Class.name, func.count(Submission.id).label("total"))
        .join(Assignment, Assignment.class_id == Class.id)
        .outerjoin(Submission, Submission.assignment_id == Assignment.id)
        .group_by(Class.id, Class.name)
        .order_by(func.count(Submission.id).desc(), Class.name)
        .limit(6)
    ).all()
    assignment_rows = db.execute(
        select(Assignment.status, func.count(Assignment.id).label("total"))
        .group_by(Assignment.status)
        .order_by(func.count(Assignment.id).desc(), Assignment.status)
    ).all()
    return AdminFeatureOperations(
        submissions_by_class=[
            AdminClassSubmissionItem(class_name=row.name, submission_count=int(row.total))
            for row in submission_rows
        ],
        assignment_statuses=[
            AdminAssignmentStatusItem(status=row.status, count=int(row.total))
            for row in assignment_rows
        ],
    )


def get_admin_dashboard(db: Session, *, days: int = 7) -> AdminDashboardResponse:
    now = datetime.now(UTC)
    since = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - 1)
    previous_since = since - timedelta(days=days)
    alerts = list_suspicious_activities(db, minutes=1440, limit=100)
    timeline_rows = db.scalars(
        select(AuditLog)
        .where(AuditLog.occurred_at >= since)
        .order_by(AuditLog.occurred_at.desc(), AuditLog.id.desc())
        .limit(16)
    ).all()
    return AdminDashboardResponse(
        generated_at=now,
        days=days,
        metrics=_dashboard_metrics(
            db,
            since=since,
            previous_since=previous_since,
            alert_count=len(alerts),
            days=days,
        ),
        activity_trend=_activity_trend(db, since=since, days=days),
        timeline=[AuditLogPublic.model_validate(row) for row in timeline_rows],
        suspicious_activities=alerts[:8],
        risk_distribution=_risk_distribution(db, since=since),
        feature_operations=_feature_operations(db),
    )
