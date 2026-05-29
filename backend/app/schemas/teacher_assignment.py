from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.lesson import LessonMaterialPublic


class TeacherAssignmentUpdate(BaseModel):
    assignment_type: str | None = Field(default=None, min_length=3, max_length=30)
    title: str | None = Field(default=None, min_length=2, max_length=160)
    instructions: str | None = Field(default=None, max_length=2000)
    worksheet_file_url: str | None = Field(default=None, max_length=2000)
    answer_template_url: str | None = Field(default=None, max_length=2000)
    max_score: float | None = Field(default=None, gt=0, le=100)
    due_at: datetime | None = None
    status: str | None = Field(default=None, min_length=3, max_length=20)


class MissingChildItem(BaseModel):
    id: UUID
    display_name: str
    birth_year: int | None
    parent_name: str
    parent_email: str
    joined_at: datetime


class AssignmentSubmissionPreview(BaseModel):
    id: UUID
    child_id: UUID
    child_name: str
    submitted_at: datetime | None
    grading_status: str
    score: float | None
    max_score: float | None
    answer_file_url: str | None


class TeacherAssignmentListItem(BaseModel):
    assignment_id: UUID
    assignment_type: str
    title: str
    instructions: str | None
    worksheet_file_url: str | None
    answer_template_url: str | None
    max_score: float
    status: str
    due_at: datetime | None
    class_id: UUID
    class_name: str
    lesson_id: UUID
    lesson_title: str
    material_count: int
    assigned_child_count: int
    submitted_child_count: int
    missing_child_count: int
    correct_count: int
    incorrect_count: int
    speech_failed_count: int
    ungraded_submission_count: int
    graded_submission_count: int
    average_score: float | None
    completion_rate: float
    average_confidence: float | None
    created_at: datetime


class TeacherAssignmentDetail(TeacherAssignmentListItem):
    materials: list[LessonMaterialPublic]
    missing_children: list[MissingChildItem]
    recent_submissions: list[AssignmentSubmissionPreview] = []
