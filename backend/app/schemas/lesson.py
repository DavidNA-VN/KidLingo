from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class VocabularyItem(BaseModel):
    class_key: str
    english: str
    vi: str
    phonetic: str | None = None


class LessonCreate(BaseModel):
    class_id: UUID
    title: str = Field(min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=1000)


class LessonUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=1000)


class LessonMaterialPublic(BaseModel):
    id: UUID
    lesson_id: UUID
    type: str
    title: str
    description: str | None
    file_url: str | None
    external_url: str | None
    youtube_video_id: str | None
    vocabulary_items: list[VocabularyItem] | None
    sort_order: int
    created_at: datetime


class LessonPublic(BaseModel):
    id: UUID
    class_id: UUID | None
    title: str
    description: str | None
    material_count: int
    assignment_count: int
    created_at: datetime


class LessonDetail(LessonPublic):
    materials: list[LessonMaterialPublic]


class YoutubeMaterialCreate(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    external_url: str = Field(min_length=8, max_length=500)
    description: str | None = Field(default=None, max_length=1000)
    sort_order: int = 0


class DoodleVocabMaterialCreate(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=1000)
    vocabulary_items: list[VocabularyItem]
    sort_order: int = 0


class LessonMaterialUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=1000)
    sort_order: int | None = None
