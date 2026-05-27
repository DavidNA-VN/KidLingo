import random
import string

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.classroom import Class


def _prefix_from_name(name: str) -> str:
    letters = "".join(ch for ch in name.upper() if ch.isalnum())
    if len(letters) >= 3:
        return letters[:3]
    return (letters + "CLS")[:3]


def generate_unique_class_code(db: Session, class_name: str) -> str:
    prefix = _prefix_from_name(class_name)
    alphabet = string.ascii_uppercase + string.digits
    for _ in range(20):
        suffix = "".join(random.choices(alphabet, k=4))
        code = f"{prefix}-{suffix}"
        exists = db.scalar(select(Class.id).where(Class.class_code == code))
        if not exists:
            return code
    raise RuntimeError("Could not generate unique class code")
