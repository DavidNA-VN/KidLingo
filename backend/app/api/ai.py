from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_parent
from app.models.user import User
from app.schemas.learning import DoodlePredictionRequest, DoodlePredictionResponse
from app.services.ai_client import AIServiceError, predict_doodle
from app.services.doodle_vocabulary import find_doodle_item
from app.services.learning_service import get_learning_assignment

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/predict", response_model=DoodlePredictionResponse)
def predict(
    payload: DoodlePredictionRequest,
    current_user: Annotated[User, Depends(require_parent)],
    db: Annotated[Session, Depends(get_db)],
) -> DoodlePredictionResponse:
    context = get_learning_assignment(db, current_user.id, payload.child_id, payload.assignment_id)
    if not context:
        raise HTTPException(status_code=404, detail="ASSIGNMENT_NOT_FOUND")

    target_item = None
    if payload.target_class:
        target_item = find_doodle_item(payload.target_class)
        if not target_item:
            raise HTTPException(status_code=400, detail="TARGET_CLASS_NOT_SUPPORTED")

    try:
        prediction = predict_doodle(payload.image_data_url, payload.top_k)
    except AIServiceError as exc:
        detail = str(exc)
        if detail == "AI_SERVICE_UNAVAILABLE":
            detail = "AI service chưa chạy. Hãy start ai-service ở port 8001 trước khi dùng doodle prediction."
        raise HTTPException(status_code=503, detail=detail) from exc

    predicted_class = str(prediction["predicted_class"])
    predicted_from_ai = next(
        (
            item
            for item in prediction.get("top_predictions", [])
            if str(item.get("class_key", "")).strip().lower() == predicted_class.lower()
        ),
        None,
    )
    predicted_item = find_doodle_item(predicted_class) or predicted_from_ai or {
        "class_key": predicted_class,
        "english": predicted_class.replace("_", " "),
        "vi": "",
        "phonetic": None,
    }
    is_correct = bool(target_item and predicted_class == target_item["class_key"])

    return DoodlePredictionResponse(
        target_class=payload.target_class,
        predicted_class=predicted_class,
        english=str(predicted_item.get("english") or predicted_class.replace("_", " ")),
        vi=str(predicted_item.get("vi") or ""),
        phonetic=predicted_item.get("phonetic"),
        confidence=float(prediction["confidence"]),
        is_correct=is_correct,
        top_predictions=list(prediction.get("top_predictions") or []),
    )
