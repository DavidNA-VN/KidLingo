from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.file_storage import get_upload

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.get("/{file_path:path}")
def read_upload(file_path: str, db: Annotated[Session, Depends(get_db)]) -> Response:
    stored = get_upload(db, file_path)
    if not stored:
        raise HTTPException(status_code=404, detail="UPLOAD_NOT_FOUND")
    filename = stored.path.rsplit("/", 1)[-1]
    return Response(
        content=stored.data,
        media_type=stored.content_type,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
