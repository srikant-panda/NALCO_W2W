from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = Field(
        "postgresql+asyncpg://admin:admin@localhost:5432/nalco_w2w",
        alias="DATABASE_URL",
    )
    default_schema_name: str = Field("nalco", alias="DEFAULT_SCHEMA_NAME")
    frontend_url: str = Field("http://localhost:5173", alias="FRONTEND_URL")
    supabase_url: str = Field("", alias="SUPABASE_URL")
    supabase_jwt_audience: str = Field("authenticated", alias="SUPABASE_JWT_AUDIENCE")
    role_claim_path: str = Field("app_metadata.role", alias="ROLE_CLAIM_PATH")
    auth_disabled: bool = Field(False, alias="AUTH_DISABLED")
    jwt_secret: str = Field("dev-local-jwt-secret-change-me", alias="JWT_SECRET")
    jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    jwt_expires_minutes: int = Field(480, alias="JWT_EXPIRES_MINUTES")
    refresh_token_expires_days: int = Field(7, alias="REFRESH_TOKEN_EXPIRES_DAYS")
    app_version: str = Field("2.1.0", alias="APP_VERSION")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
