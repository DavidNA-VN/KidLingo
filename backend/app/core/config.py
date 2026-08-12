from functools import lru_cache
import os
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    app_name: str = "Doodle English Classroom API"
    api_v1_prefix: str = "/api/v1"
    environment: str = "local"

    database_url: str = Field(
        default="postgresql+psycopg://postgres:NAMANHh_0212@localhost:5434/doodle_english",
        alias="DATABASE_URL",
    )
    jwt_secret: str = Field(default="change-me-local-secret", alias="JWT_SECRET")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    upload_dir: str = Field(default="uploads", alias="UPLOAD_DIR")
    ai_service_url: str = Field(default="http://127.0.0.1:8001", alias="AI_SERVICE_URL")
    allowed_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="ALLOWED_ORIGINS",
    )

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return self.database_url

    @property
    def upload_path(self) -> Path:
        path = Path(self.upload_dir)
        if not path.is_absolute():
            if os.getenv("VERCEL") and self.upload_dir == "uploads":
                return Path("/tmp/uploads")
            return ROOT_DIR / path
        return path

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
