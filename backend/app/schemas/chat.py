from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    parent_id: UUID
    class_id: UUID | None = None
    child_id: UUID | None = None
    context_message: str | None = Field(default=None, max_length=1200)


class ClassGroupConversationCreate(BaseModel):
    class_id: UUID
    context_message: str | None = Field(default=None, max_length=1200)


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class ConversationSummary(BaseModel):
    id: UUID
    conversation_type: str
    teacher_id: UUID
    teacher_name: str
    parent_id: UUID | None
    parent_name: str | None
    parent_email: str | None
    class_id: UUID | None
    class_name: str | None
    child_id: UUID | None
    child_name: str | None
    last_message: str | None
    last_message_at: datetime | None
    message_count: int
    created_at: datetime
    updated_at: datetime


class ClassGroupMember(BaseModel):
    child_id: UUID
    child_name: str
    parent_id: UUID
    parent_name: str
    parent_email: str
    membership_status: str


class ClassGroupMembersResponse(BaseModel):
    conversation_id: UUID
    class_id: UUID
    class_name: str
    members: list[ClassGroupMember]


class MessagePublic(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    sender_name: str
    sender_role: str
    body: str
    read_at: datetime | None
    created_at: datetime
    is_mine: bool = False
