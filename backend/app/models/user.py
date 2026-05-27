import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.child import Child
    from app.models.classroom import Class
    from app.models.chat import Conversation, Message
    from app.models.lesson import Lesson


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    classes: Mapped[list["Class"]] = relationship(back_populates="teacher", foreign_keys="Class.teacher_id")
    children: Mapped[list["Child"]] = relationship(back_populates="parent", foreign_keys="Child.parent_id")
    lessons: Mapped[list["Lesson"]] = relationship(back_populates="teacher", foreign_keys="Lesson.teacher_id")
    teacher_conversations: Mapped[list["Conversation"]] = relationship(
        back_populates="teacher", foreign_keys="Conversation.teacher_id"
    )
    parent_conversations: Mapped[list["Conversation"]] = relationship(
        back_populates="parent", foreign_keys="Conversation.parent_id"
    )
    messages: Mapped[list["Message"]] = relationship(back_populates="sender")
