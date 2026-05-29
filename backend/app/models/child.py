import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.chat import Conversation
    from app.models.classroom import Class
    from app.models.submission import Submission
    from app.models.user import User


class Child(Base):
    __tablename__ = "children"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    birth_year: Mapped[int | None] = mapped_column(Integer)
    nickname: Mapped[str | None] = mapped_column(String(80))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    profile_note: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")
    total_stars: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_coins: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    parent: Mapped["User"] = relationship(back_populates="children", foreign_keys=[parent_id])
    class_links: Mapped[list["ClassChild"]] = relationship(back_populates="child")
    submissions: Mapped[list["Submission"]] = relationship(back_populates="child")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="child")


class ClassChild(Base):
    __tablename__ = "class_children"

    class_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("classes.id", ondelete="CASCADE"), primary_key=True
    )
    child_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("children.id", ondelete="CASCADE"), primary_key=True
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")

    classroom: Mapped["Class"] = relationship(back_populates="child_links")
    child: Mapped["Child"] = relationship(back_populates="class_links")
