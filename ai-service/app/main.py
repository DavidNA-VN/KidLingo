from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.labels import DOODLE_LABELS
from app.predictor import DoodlePredictor

ROOT_DIR = Path(__file__).resolve().parents[1]
CHECKPOINT_PATH = ROOT_DIR / "checkpoint.pt"

app = FastAPI(title="Doodle English AI Service")
predictor = DoodlePredictor(CHECKPOINT_PATH)


class PredictionRequest(BaseModel):
    image_base64: str = Field(min_length=20)
    top_k: int = Field(default=3, ge=1, le=10)


@app.on_event("startup")
def load_model() -> None:
    predictor.load()


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "Doodle English AI Service", "status": "ok"}


@app.get("/health")
def health() -> dict[str, str | bool | None | list[dict[str, str | None]]]:
    return {
        "status": "ok",
        "service": "ai-service",
        "checkpoint_exists": CHECKPOINT_PATH.exists(),
        "model_loaded": predictor.loaded,
        "model_error": predictor.error,
        "classes": DOODLE_LABELS,
    }


@app.post("/predict")
def predict(payload: PredictionRequest) -> dict:
    if not predictor.loaded:
        raise HTTPException(status_code=503, detail=predictor.error or "MODEL_NOT_LOADED")
    try:
        return predictor.predict(payload.image_base64, payload.top_k)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
