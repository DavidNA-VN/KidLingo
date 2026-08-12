from __future__ import annotations

from datetime import datetime, timezone

from fastapi import UploadFile
from sqlalchemy import LargeBinary, String, Text, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.core.database import Base


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    path: Mapped[str] = mapped_column(Text, primary_key=True)
    content_type: Mapped[str] = mapped_column(String(255), nullable=False)
    data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=lambda: datetime.now(timezone.utc))


def ensure_uploaded_files_table(db: Session) -> None:
    db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS uploaded_files (
              path TEXT PRIMARY KEY,
              content_type VARCHAR(255) NOT NULL,
              data BYTEA NOT NULL,
              created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
    )


def save_upload_bytes(db: Session, path: str, content_type: str | None, data: bytes) -> str:
    normalized = _normalize_upload_path(path)
    ensure_uploaded_files_table(db)
    statement = insert(UploadedFile).values(
        path=normalized,
        content_type=content_type or "application/octet-stream",
        data=data,
    )
    statement = statement.on_conflict_do_update(
        index_elements=[UploadedFile.path],
        set_={
            "content_type": statement.excluded.content_type,
            "data": statement.excluded.data,
            "created_at": datetime.now(timezone.utc),
        },
    )
    db.execute(statement)
    return f"/uploads/{normalized}"


def save_upload_file(db: Session, path: str, file: UploadFile) -> str:
    file.file.seek(0)
    return save_upload_bytes(db, path, file.content_type, file.file.read())


def get_upload(db: Session, path: str) -> UploadedFile | None:
    normalized = _normalize_upload_path(path)
    ensure_uploaded_files_table(db)
    return db.get(UploadedFile, normalized)


def _normalize_upload_path(path: str) -> str:
    normalized = path.strip().lstrip("/")
    if normalized.startswith("uploads/"):
        normalized = normalized.removeprefix("uploads/")
    if not normalized or ".." in normalized.split("/"):
        raise ValueError("INVALID_UPLOAD_PATH")
    return normalized
