from datetime import datetime
from math import ceil
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AuditLogPublic(BaseModel):
    id: UUID
    occurred_at: datetime
    actor_id: UUID | None
    actor_email: str | None
    actor_role: str | None
    action: str
    category: str
    result: str
    risk_level: str
    resource_type: str | None
    resource_id: str | None
    request_id: str | None
    ip_address: str | None
    user_agent: str | None
    http_method: str | None
    request_path: str | None
    metadata: dict[str, Any] = Field(validation_alias="metadata_json")

    model_config = ConfigDict(from_attributes=True)


class AuditLogPage(BaseModel):
    items: list[AuditLogPublic]
    total: int
    page: int
    page_size: int
    pages: int

    @classmethod
    def build(cls, *, items: list[AuditLogPublic], total: int, page: int, page_size: int) -> "AuditLogPage":
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            pages=ceil(total / page_size) if total else 0,
        )
