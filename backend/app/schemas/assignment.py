from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.lesson import LessonMaterialPublic


class AssignmentCreate(BaseModel):
    class_id: UUID
    lesson_id: UUID
    assignment_type: str = Field(default="PDF_ASSIGNMENT", max_length=30)
    title: str = Field(min_length=2, max_length=160)
    instructions: str | None = Field(default=None, max_length=2000)
    worksheet_file_url: str | None = Field(default=None, max_length=2000)
    answer_template_url: str | None = Field(default=None, max_length=2000)
    max_score: float = Field(default=10.0, gt=0, le=100)
    due_at: datetime | None = None
    status: str = "DRAFT"


class AssignmentUpdate(BaseModel):
    assignment_type: str | None = Field(default=None, max_length=30)
    title: str | None = Field(default=None, min_length=2, max_length=160)
    instructions: str | None = Field(default=None, max_length=2000)
    worksheet_file_url: str | None = Field(default=None, max_length=2000)
    answer_template_url: str | None = Field(default=None, max_length=2000)
    max_score: float | None = Field(default=None, gt=0, le=100)
    due_at: datetime | None = None
    status: str | None = None


class AssignmentPublic(BaseModel):
    id: UUID
    class_id: UUID
    lesson_id: UUID
    assignment_type: str
    title: str
    instructions: str | None
    worksheet_file_url: str | None
    answer_template_url: str | None
    max_score: float
    due_at: datetime | None
    status: str
    class_name: str
    lesson_title: str
    material_count: int
    submission_count: int
    created_at: datetime


class AssignmentDetail(AssignmentPublic):
    materials: list[LessonMaterialPublic]
