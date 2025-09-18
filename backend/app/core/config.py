from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_JWKS_URL: str
    SUPABASE_ISSUER: str

    # Comma-separated list of allowed origins for production
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # Simple environment flag to distinguish dev vs prod
    # Expected values: "development" (default), "production", "staging", etc.
    ENVIRONMENT: str = "development"

    # Whether to allow credentials in CORS (effective only when not using "*")
    CORS_ALLOW_CREDENTIALS: bool = False

    class Config:
        env_file = ".env"


settings = Settings()


def _is_development() -> bool:
    env = (settings.ENVIRONMENT or "").strip().lower()
    return env in {"development", "dev", "local"}


def cors_origins() -> List[str]:
    # In development, be permissive to ease local development
    if _is_development():
        return ["*"]
    # In non-development environments, use the configured origin list
    return [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]


def cors_allow_credentials() -> bool:
    # Do not allow credentials when wildcard origin is used
    if _is_development():
        return False
    return bool(settings.CORS_ALLOW_CREDENTIALS)
