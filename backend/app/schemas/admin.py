from datetime import datetime

from pydantic import BaseModel

from app.schemas.audit import AuditLogPublic


class SuspiciousActivityAlert(BaseModel):
    reason: str
    title: str
    description: str
    risk_level: str
    action: str
    actor_email: str | None
    actor_role: str | None
    ip_address: str | None
    request_path: str | None
    first_seen: datetime
    last_seen: datetime
    event_count: int


class AdminDashboardMetric(BaseModel):
    key: str
    label: str
    value: int
    delta: int
    delta_label: str


class AdminActivityTrendPoint(BaseModel):
    date: str
    label: str
    audit_events: int
    login_failures: int
    submissions: int
    ai_predictions: int
    messages: int


class AdminRiskDistributionItem(BaseModel):
    risk_level: str
    count: int
    percentage: float


class AdminClassSubmissionItem(BaseModel):
    class_name: str
    submission_count: int


class AdminAssignmentStatusItem(BaseModel):
    status: str
    count: int


class AdminFeatureOperations(BaseModel):
    submissions_by_class: list[AdminClassSubmissionItem]
    assignment_statuses: list[AdminAssignmentStatusItem]


class AdminDashboardResponse(BaseModel):
    generated_at: datetime
    days: int
    metrics: list[AdminDashboardMetric]
    activity_trend: list[AdminActivityTrendPoint]
    timeline: list[AuditLogPublic]
    suspicious_activities: list[SuspiciousActivityAlert]
    risk_distribution: list[AdminRiskDistributionItem]
    feature_operations: AdminFeatureOperations
