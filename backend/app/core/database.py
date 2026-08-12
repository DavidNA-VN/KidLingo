from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


@lru_cache
def get_engine():
    settings = get_settings()
    return create_engine(settings.sqlalchemy_database_url, pool_pre_ping=True)


@lru_cache
def get_session_local():
    return sessionmaker(bind=get_engine(), autoflush=False, autocommit=False)


class _SessionLocalProxy:
    def __call__(self, *args, **kwargs):
        return get_session_local()(*args, **kwargs)


SessionLocal = _SessionLocalProxy()


def get_db() -> Generator[Session, None, None]:
    db = get_session_local()()
    try:
        yield db
    finally:
        db.close()


def check_database() -> dict[str, str]:
    with get_engine().connect() as connection:
        row = connection.execute(
            text("SELECT current_database() AS database, current_user AS username")
        ).mappings().one()
    return {"database": row["database"], "username": row["username"]}
