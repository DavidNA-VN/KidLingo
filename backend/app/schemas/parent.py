from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.lesson import LessonMaterialPublic


class ParentChildCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=120)
    birth_year: int = Field(ge=2010, le=2030)
    nickname: str | None = Field(default=None, max_length=80)
    avatar_url: str | None = Field(default=None, max_length=1000)
    profile_note: str | None = Field(default=None, max_length=2000)


class ParentChildUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    birth_year: int | None = Field(default=None, ge=2010, le=2030)
    nickname: str | None = Field(default=None, max_length=80)
    avatar_url: str | None = Field(default=None, max_length=1000)
    profile_note: str | None = Field(default=None, max_length=2000)
    status: str | None = Field(default=None, min_length=3, max_length=20)


class ParentChildPublic(BaseModel):
    id: UUID
    display_name: str
    birth_year: int | None
    nickname: str | None
    avatar_url: str | None
    profile_note: str | None
    status: str
    total_stars: int
    total_coins: int
    class_count: int
    published_assignment_count: int
    created_at: datetime


class JoinClassRequest(BaseModel):
    class_code: str = Field(min_length=2, max_length=30)


class ParentClassPublic(BaseModel):
    class_id: UUID
    name: str
    description: str | None
    class_code: str | None
    teacher_name: str
    membership_status: str
    joined_at: datetime
    published_assignment_count: int


class ParentJoinClassResponse(BaseModel):
    class_id: UUID
    child_id: UUID
    class_name: str
    class_code: str | None
    membership_status: str
    joined_at: datetime
    already_joined: bool


class ParentAssignmentListItem(BaseModel):
    assignment_id: UUID
    title: str
    instructions: str | None
    status: str
    due_at: datetime | None
    class_id: UUID
    class_name: str
    teacher_name: str
    lesson_id: UUID
    lesson_title: str
    lesson_description: str | None
    material_count: int
    assignment_type: str
    worksheet_file_url: str | None
    answer_template_url: str | None
    max_score: float
    submitted: bool
    latest_submission_at: datetime | None
    latest_is_correct: bool | None
    latest_confidence: float | None
    latest_score: float | None = None
    latest_max_score: float | None = None
    latest_grading_status: str | None = None
    latest_feedback: str | None = None


class ParentAssignmentDetail(ParentAssignmentListItem):
    materials: list[LessonMaterialPublic]


class ParentDashboardSummary(BaseModel):
    child_count: int
    active_child_count: int
    class_count: int
    published_assignment_count: int
    submitted_assignment_count: int
    total_submissions: int
    correct_submissions: int
    total_stars: int
    total_coins: int
    latest_submission_at: datetime | None


class ParentSubmissionHistoryItem(BaseModel):
    id: UUID
    submission_type: str
    assignment_id: UUID
    assignment_title: str
    class_name: str
    lesson_title: str
    target_class: str | None
    predicted_class: str | None
    confidence: float | None
    is_correct: bool
    speech_passed: bool
    speech_transcript: str | None
    stars_earned: int
    coins_earned: int
    answer_file_url: str | None = None
    submitted_at: datetime | None = None
    graded_at: datetime | None = None
    score: float | None = None
    max_score: float | None = None
    grading_status: str | None = None
    returned_at: datetime | None = None
    teacher_feedback: str | None
    reviewed_at: datetime | None
    created_at: datetime


class ParentProgressSummary(BaseModel):
    child_id: UUID
    display_name: str
    total_stars: int
    total_coins: int
    class_count: int
    published_assignment_count: int
    submitted_assignment_count: int
    pending_assignment_count: int
    total_submissions: int
    correct_submissions: int
    incorrect_submissions: int
    speech_passed_count: int
    average_confidence: float | None
    latest_submission_at: datetime | None
    recent_submissions: list[ParentSubmissionHistoryItem]
