from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TeacherClassCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)


class TeacherClassUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)


class TeacherClassSummary(BaseModel):
    id: UUID
    name: str
    description: str | None
    class_code: str | None
    active_child_count: int
    archived_child_count: int
    assignment_count: int
    submission_count: int
    created_at: datetime


class ParentSummary(BaseModel):
    id: UUID
    full_name: str
    email: str


class RosterChild(BaseModel):
    id: UUID
    display_name: str
    birth_year: int | None
    status: str
    membership_status: str
    total_stars: int
    total_coins: int
    joined_at: datetime
    parent: ParentSummary


class RecentSubmissionSummary(BaseModel):
    id: UUID
    child_id: UUID
    child_name: str
    assignment_id: UUID
    assignment_title: str
    target_class: str | None
    predicted_class: str | None
    is_correct: bool
    confidence: float | None
    stars_earned: int
    coins_earned: int
    created_at: datetime


class AssignmentMini(BaseModel):
    id: UUID
    title: str
    status: str
    lesson_title: str
    max_score: float
    due_at: datetime | None
    submission_count: int


class TeacherClassDetail(BaseModel):
    id: UUID
    name: str
    description: str | None
    class_code: str | None
    active_child_count: int
    archived_child_count: int
    assignment_count: int
    submission_count: int
    roster: list[RosterChild]
    assignments: list[AssignmentMini]
    recent_submissions: list[RecentSubmissionSummary]


class ChildSearchResult(BaseModel):
    id: UUID
    display_name: str
    birth_year: int | None
    status: str
    total_stars: int
    total_coins: int
    parent: ParentSummary


class ChildSearchResponse(BaseModel):
    items: list[ChildSearchResult]


class MembershipCreate(BaseModel):
    child_id: UUID


class MembershipUpdate(BaseModel):
    status: str


class MembershipResponse(BaseModel):
    class_id: UUID
    child_id: UUID
    status: str
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)
