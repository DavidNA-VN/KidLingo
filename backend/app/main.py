import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.assignments import router as assignments_router
from app.api.admin import router as admin_router
from app.api.ai import router as ai_router
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.dashboard import router as dashboard_router
from app.api.health import router as health_router
from app.api.lessons import router as lessons_router
from app.api.parent import router as parent_router
from app.api.submissions import router as submissions_router
from app.api.teacher import router as teacher_router
from app.api.teacher_assignments import router as teacher_assignments_router
from app.api.teacher_submissions import router as teacher_submissions_router
from app.api.uploads import router as uploads_router
from app.api.vocabulary import router as vocabulary_router
from app.core.config import get_settings
from app.ws.chat import router as chat_ws_router


settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.getenv("VERCEL"):
    app.include_router(uploads_router)
else:
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.upload_path), name="uploads")

app.include_router(health_router)
app.include_router(health_router, prefix=settings.api_v1_prefix)
app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(admin_router, prefix=settings.api_v1_prefix)
app.include_router(teacher_router, prefix=settings.api_v1_prefix)
app.include_router(parent_router, prefix=settings.api_v1_prefix)
app.include_router(teacher_assignments_router, prefix=settings.api_v1_prefix)
app.include_router(teacher_submissions_router, prefix=settings.api_v1_prefix)
app.include_router(dashboard_router, prefix=settings.api_v1_prefix)
app.include_router(vocabulary_router, prefix=settings.api_v1_prefix)
app.include_router(lessons_router, prefix=settings.api_v1_prefix)
app.include_router(assignments_router, prefix=settings.api_v1_prefix)
app.include_router(ai_router, prefix=settings.api_v1_prefix)
app.include_router(submissions_router, prefix=settings.api_v1_prefix)
app.include_router(chat_router, prefix=settings.api_v1_prefix)
app.include_router(chat_ws_router)

# Vercel Services may route requests to this backend after removing the
# public /api service prefix. Keep /v1 available for that deployment shape.
app.include_router(health_router, prefix="/v1")
app.include_router(auth_router, prefix="/v1")
app.include_router(admin_router, prefix="/v1")
app.include_router(teacher_router, prefix="/v1")
app.include_router(parent_router, prefix="/v1")
app.include_router(teacher_assignments_router, prefix="/v1")
app.include_router(teacher_submissions_router, prefix="/v1")
app.include_router(dashboard_router, prefix="/v1")
app.include_router(vocabulary_router, prefix="/v1")
app.include_router(lessons_router, prefix="/v1")
app.include_router(assignments_router, prefix="/v1")
app.include_router(ai_router, prefix="/v1")
app.include_router(submissions_router, prefix="/v1")
app.include_router(chat_router, prefix="/v1")

# Classic Vercel rewrites keep the public /api prefix in the ASGI path.
app.include_router(health_router, prefix="/api")
app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(teacher_router, prefix="/api/v1")
app.include_router(parent_router, prefix="/api/v1")
app.include_router(teacher_assignments_router, prefix="/api/v1")
app.include_router(teacher_submissions_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(vocabulary_router, prefix="/api/v1")
app.include_router(lessons_router, prefix="/api/v1")
app.include_router(assignments_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(submissions_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")


@app.get("/")
def root() -> dict[str, str]:
    return {"service": settings.app_name, "status": "ok"}
