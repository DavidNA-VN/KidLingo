import shutil
from pathlib import Path
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import require_teacher
from app.models.assignment import Assignment
from app.models.classroom import Class
from app.models.lesson import Lesson, LessonMaterial
from app.models.user import User
from app.schemas.lesson import (
    DoodleVocabMaterialCreate,
    LessonCreate,
    LessonDetail,
    LessonMaterialUpdate,
    LessonMaterialPublic,
    LessonPublic,
    LessonUpdate,
    YoutubeMaterialCreate,
)
from app.services.vocabulary import VOCABULARY_CLASS_KEYS
from app.services.youtube_service import extract_youtube_video_id

router = APIRouter(prefix="/lessons", tags=["lessons"])


def _lesson_or_404(db: Session, teacher_id: UUID, lesson_id: UUID) -> Lesson:
    lesson = db.get(Lesson, lesson_id)
    if not lesson or lesson.teacher_id != teacher_id:
        raise HTTPException(status_code=404, detail="LESSON_NOT_FOUND")
    return lesson


def _teacher_class_or_404(db: Session, teacher_id: UUID, class_id: UUID) -> Class:
    classroom = db.get(Class, class_id)
    if not classroom or classroom.teacher_id != teacher_id:
        raise HTTPException(status_code=404, detail="CLASS_NOT_FOUND")
    return classroom


def _material_or_404(db: Session, lesson_id: UUID, material_id: UUID) -> LessonMaterial:
    material = db.get(LessonMaterial, material_id)
    if not material or material.lesson_id != lesson_id:
        raise HTTPException(status_code=404, detail="MATERIAL_NOT_FOUND")
    return material


def _material_to_public(material: LessonMaterial) -> LessonMaterialPublic:
    return LessonMaterialPublic(
        id=material.id,
        lesson_id=material.lesson_id,
        type=material.type,
        title=material.title,
        description=material.description,
        file_url=material.file_url,
        external_url=material.external_url,
        youtube_video_id=material.youtube_video_id,
        vocabulary_items=material.vocabulary_items,
        sort_order=material.sort_order,
        created_at=material.created_at,
    )


def _lesson_public(db: Session, lesson: Lesson) -> LessonPublic:
    material_count = db.scalar(
        select(func.count()).select_from(LessonMaterial).where(LessonMaterial.lesson_id == lesson.id)
    )
    assignment_count = db.scalar(
        select(func.count()).select_from(Assignment).where(Assignment.lesson_id == lesson.id)
    )
    return LessonPublic(
        id=lesson.id,
        class_id=lesson.class_id,
        title=lesson.title,
        description=lesson.description,
        material_count=material_count or 0,
        assignment_count=assignment_count or 0,
        created_at=lesson.created_at,
    )


@router.get("", response_model=list[LessonPublic])
def list_lessons(
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
    class_id: Annotated[UUID | None, Query()] = None,
) -> list[LessonPublic]:
    filters = [Lesson.teacher_id == current_user.id]
    if class_id:
        _teacher_class_or_404(db, current_user.id, class_id)
        filters.append(Lesson.class_id == class_id)
    lessons = db.scalars(select(Lesson).where(*filters).order_by(Lesson.created_at.desc())).all()
    return [_lesson_public(db, lesson) for lesson in lessons]


@router.post("", response_model=LessonPublic, status_code=status.HTTP_201_CREATED)
def create_lesson(
    payload: LessonCreate,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> LessonPublic:
    _teacher_class_or_404(db, current_user.id, payload.class_id)
    lesson = Lesson(
        teacher_id=current_user.id,
        class_id=payload.class_id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        vocabulary_items=[],
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return _lesson_public(db, lesson)


@router.get("/{lesson_id}", response_model=LessonDetail)
def get_lesson(
    lesson_id: UUID,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> LessonDetail:
    lesson = _lesson_or_404(db, current_user.id, lesson_id)
    public = _lesson_public(db, lesson)
    materials = db.scalars(
        select(LessonMaterial)
        .where(LessonMaterial.lesson_id == lesson.id)
        .order_by(LessonMaterial.sort_order.asc(), LessonMaterial.created_at.asc())
    ).all()
    return LessonDetail(**public.model_dump(), materials=[_material_to_public(material) for material in materials])


@router.patch("/{lesson_id}", response_model=LessonPublic)
def update_lesson(
    lesson_id: UUID,
    payload: LessonUpdate,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> LessonPublic:
    lesson = _lesson_or_404(db, current_user.id, lesson_id)
    if payload.title is not None:
        lesson.title = payload.title.strip()
    if payload.description is not None:
        lesson.description = payload.description.strip() or None
    db.commit()
    db.refresh(lesson)
    return _lesson_public(db, lesson)


@router.post("/{lesson_id}/materials/pdf", response_model=LessonMaterialPublic, status_code=status.HTTP_201_CREATED)
def upload_pdf_material(
    lesson_id: UUID,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
    file: Annotated[UploadFile, File()],
    title: Annotated[str, Form()],
    description: Annotated[str | None, Form()] = None,
    sort_order: Annotated[int, Form()] = 0,
) -> LessonMaterialPublic:
    _lesson_or_404(db, current_user.id, lesson_id)
    if file.content_type != "application/pdf" and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="INVALID_FILE_TYPE")

    settings = get_settings()
    target_dir = settings.upload_path / "lesson-materials"
    target_dir.mkdir(parents=True, exist_ok=True)
    safe_name = f"{uuid4()}.pdf"
    target_path = target_dir / safe_name
    with target_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    material = LessonMaterial(
        lesson_id=lesson_id,
        type="PDF",
        title=title.strip(),
        description=description.strip() if description else None,
        file_url=f"/uploads/lesson-materials/{safe_name}",
        sort_order=sort_order,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return _material_to_public(material)


@router.post("/{lesson_id}/materials/youtube", response_model=LessonMaterialPublic, status_code=status.HTTP_201_CREATED)
def add_youtube_material(
    lesson_id: UUID,
    payload: YoutubeMaterialCreate,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> LessonMaterialPublic:
    _lesson_or_404(db, current_user.id, lesson_id)
    video_id = extract_youtube_video_id(payload.external_url)
    if not video_id:
        raise HTTPException(status_code=400, detail="INVALID_YOUTUBE_URL")

    material = LessonMaterial(
        lesson_id=lesson_id,
        type="YOUTUBE_VIDEO",
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        external_url=payload.external_url.strip(),
        youtube_video_id=video_id,
        sort_order=payload.sort_order,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return _material_to_public(material)


@router.post("/{lesson_id}/materials/doodle-vocab", response_model=LessonMaterialPublic, status_code=status.HTTP_201_CREATED)
def add_doodle_vocab_material(
    lesson_id: UUID,
    payload: DoodleVocabMaterialCreate,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> LessonMaterialPublic:
    _lesson_or_404(db, current_user.id, lesson_id)
    class_keys = {item.class_key for item in payload.vocabulary_items}
    invalid_keys = sorted(class_keys - VOCABULARY_CLASS_KEYS)
    if invalid_keys:
        raise HTTPException(status_code=400, detail=f"INVALID_VOCABULARY_CLASS: {', '.join(invalid_keys)}")

    material = LessonMaterial(
        lesson_id=lesson_id,
        type="DOODLE_VOCAB",
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        vocabulary_items=[item.model_dump() for item in payload.vocabulary_items],
        sort_order=payload.sort_order,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return _material_to_public(material)


@router.patch("/{lesson_id}/materials/{material_id}", response_model=LessonMaterialPublic)
def update_material(
    lesson_id: UUID,
    material_id: UUID,
    payload: LessonMaterialUpdate,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> LessonMaterialPublic:
    _lesson_or_404(db, current_user.id, lesson_id)
    material = _material_or_404(db, lesson_id, material_id)
    if payload.title is not None:
        material.title = payload.title.strip()
    if payload.description is not None:
        material.description = payload.description.strip() or None
    if payload.sort_order is not None:
        material.sort_order = payload.sort_order
    db.commit()
    db.refresh(material)
    return _material_to_public(material)


@router.delete("/{lesson_id}/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(
    lesson_id: UUID,
    material_id: UUID,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    _lesson_or_404(db, current_user.id, lesson_id)
    material = _material_or_404(db, lesson_id, material_id)
    db.delete(material)
    db.commit()
