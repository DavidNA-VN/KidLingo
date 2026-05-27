from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class TeacherDashboardSummary(BaseModel):
    class_count: int
    active_child_count: int
    open_assignment_count: int
    new_submission_count: int
    review_submission_count: int
    ungraded_submission_count: int = 0
    average_completion_rate: float
    average_confidence: float | None
    average_score: float | None = None


class ClassProgressItem(BaseModel):
    class_id: UUID
    class_name: str
    class_code: str | None
    active_child_count: int
    assignment_count: int
    submitted_count: int
    missing_count: int
    ungraded_submission_count: int = 0
    graded_submission_count: int = 0
    average_score: float | None = None
    completion_rate: float


class AssignmentProgressItem(BaseModel):
    assignment_id: UUID
    assignment_type: str
    title: str
    instructions: str | None
    worksheet_file_url: str | None = None
    answer_template_url: str | None = None
    max_score: float = 10.0
    status: str
    due_at: datetime | None
    class_id: UUID
    class_name: str
    lesson_title: str
    material_count: int
    assigned_child_count: int
    submitted_child_count: int
    missing_child_count: int
    correct_count: int
    incorrect_count: int
    speech_failed_count: int
    ungraded_submission_count: int = 0
    graded_submission_count: int = 0
    average_score: float | None = None
    completion_rate: float
    average_confidence: float | None


class StatusBreakdownItem(BaseModel):
    status: str
    count: int


class SubmissionQualityItem(BaseModel):
    label: str
    count: int


class DashboardSubmissionItem(BaseModel):
    id: UUID
    submission_type: str = "DOODLE_ATTEMPT"
    child_id: UUID
    child_name: str
    class_name: str
    assignment_id: UUID
    assignment_title: str
    predicted_class: str | None
    is_correct: bool
    confidence: float | None
    speech_passed: bool
    stars_earned: int
    coins_earned: int
    grading_status: str = "NOT_REQUIRED"
    score: float | None = None
    max_score: float | None = None
    created_at: datetime
    review_reason: str | None = None


class TopStudentItem(BaseModel):
    child_id: UUID
    child_name: str
    class_id: UUID
    class_name: str
    graded_submission_count: int
    average_score: float


class TeacherDashboardResponse(BaseModel):
    summary: TeacherDashboardSummary
    class_progress: list[ClassProgressItem]
    assignment_progress: list[AssignmentProgressItem]
    status_breakdown: list[StatusBreakdownItem]
    submission_quality: list[SubmissionQualityItem]
    score_distribution: list[SubmissionQualityItem] = []
    pronunciation_pass_rate: float = 0.0
    ungraded_by_class: list[ClassProgressItem] = []
    assignment_stats_by_class: list[ClassProgressItem] = []
    top_students: list[TopStudentItem] = []
    upcoming_assignments: list[AssignmentProgressItem]
    review_submissions: list[DashboardSubmissionItem]
    recent_submissions: list[DashboardSubmissionItem]


class AssignmentStatusUpdate(BaseModel):
    status: str = Field(min_length=3, max_length=20)


class AssignmentInstructionsUpdate(BaseModel):
    instructions: str | None = Field(default=None, max_length=2000)
