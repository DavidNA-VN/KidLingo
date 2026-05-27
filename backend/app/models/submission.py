import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.assignment import Assignment
    from app.models.child import Child
    from app.models.user import User


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    child_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("children.id", ondelete="CASCADE"), nullable=False)
    submission_type: Mapped[str] = mapped_column(String(30), nullable=False, default="PDF_ANSWER")
    answer_file_url: Mapped[str | None] = mapped_column(Text)
    target_class: Mapped[str | None] = mapped_column(String(60))
    predicted_class: Mapped[str | None] = mapped_column(String(60))
    confidence: Mapped[float | None] = mapped_column(Numeric(5, 4))
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    top_predictions: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB)
    canvas_image_url: Mapped[str | None] = mapped_column(Text)
    speech_transcript: Mapped[str | None] = mapped_column(Text)
    speech_passed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    stars_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    coins_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    graded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    graded_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    score: Mapped[float | None] = mapped_column(Numeric(5, 2))
    max_score: Mapped[float | None] = mapped_column(Numeric(5, 2))
    grading_status: Mapped[str] = mapped_column(String(30), nullable=False, default="SUBMITTED")
    returned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    teacher_feedback: Mapped[str | None] = mapped_column(Text)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    assignment: Mapped["Assignment"] = relationship(back_populates="submissions")
    child: Mapped["Child"] = relationship(back_populates="submissions")
    reviewer: Mapped["User | None"] = relationship(foreign_keys=[reviewed_by])
    grader: Mapped["User | None"] = relationship(foreign_keys=[graded_by])
