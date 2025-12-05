from pathlib import Path

from pydantic import Field, PostgresDsn
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    environment: str = Field("development", env="ENVIRONMENT")
    database_url: PostgresDsn = Field(
        "postgresql+asyncpg://postgres:password@localhost:5432/battle",
        env="DATABASE_URL",
    )
    telegram_bot_token: str = Field("", env="TELEGRAM_BOT_TOKEN")
    admin_link_base: str = Field("http://localhost:3003/admin", env="ADMIN_LINK_BASE")

    class Config:
        env_file = str(Path(__file__).resolve().parents[1] / ".env")
        case_sensitive = False


settings = Settings()
