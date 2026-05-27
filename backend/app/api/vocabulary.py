from fastapi import APIRouter

from app.services.vocabulary import VOCABULARY_CLASSES

router = APIRouter(prefix="/vocabulary", tags=["vocabulary"])


@router.get("/classes")
def vocabulary_classes() -> list[dict[str, str]]:
    return VOCABULARY_CLASSES
