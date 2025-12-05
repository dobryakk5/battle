from pydantic import Field, AnyUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class BotSettings(BaseSettings):
    """Telegram bot specific configuration."""

    telegram_token: str = Field(..., validation_alias="TELEGRAM_BOT_TOKEN")
    api_base_url: str = Field("http://localhost:8000", validation_alias="API_BASE_URL")
    admin_panel_url: str = Field("http://localhost:3003/admin", validation_alias="ADMIN_LINK_BASE")

    model_config = SettingsConfigDict(
        env_file="bot/.env",
        case_sensitive=False,
        extra="ignore"
    )


settings = BotSettings()
