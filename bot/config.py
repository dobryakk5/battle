from pydantic import BaseSettings, Field, AnyUrl


class BotSettings(BaseSettings):
    """Telegram bot specific configuration."""

    telegram_token: str = Field(..., env="TELEGRAM_BOT_TOKEN")
    api_base_url: AnyUrl = Field("http://localhost:8000", env="API_BASE_URL")
    admin_panel_url: AnyUrl = Field("http://localhost:3000/admin", env="ADMIN_LINK_BASE")

    class Config:
        env_file = "../backend/.env"
        case_sensitive = False


settings = BotSettings()
