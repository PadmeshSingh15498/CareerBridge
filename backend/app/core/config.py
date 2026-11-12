import os
import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CareerBridge"
    ENVIRONMENT: str = "development"  # development | testing | production
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    LOG_LEVEL: str = "INFO"

    # JWT Authentication
    SECRET_KEY: str = "careerbridge_dev_secret_key_hs256_very_secure_string_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ADMIN_INVITE_TOKEN: str = "careerbridge_tpo_master_invite_token_2026"

    # Cookie Security
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    # Database Configuration (MySQL 8 Production / Cloud Managed)
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = ""
    MYSQL_DATABASE: str = "careerbridge"
    DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/careerbridge"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 40
    DATABASE_SSL_CA: str = ""

    # Graceful Fallback (allowed in development/testing only)
    ENABLE_DB_FALLBACK: bool = True
    FALLBACK_DATABASE_URL: str = "sqlite:///./careerbridge.db"

    # CORS Whitelist
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            try:
                return json.loads(v)
            except Exception:
                return [i.strip() for i in v.strip("[]").replace('"', "").replace("'", "").split(",")]
        return v

    # AI & LLM Configuration
    GEMINI_API_KEY: str = ""
    AI_MOCK_FALLBACK: bool = True

    # Storage Paths
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    STORAGE_DIR: str = os.path.join(BASE_DIR, "storage", "resumes")

    @field_validator("DEBUG", mode="before")
    @classmethod
    def enforce_production_debug(cls, v: bool, info) -> bool:
        env = os.getenv("ENVIRONMENT", "development").lower()
        if env == "production":
            return False
        return v

    @field_validator("COOKIE_SECURE", mode="before")
    @classmethod
    def enforce_production_cookies(cls, v: bool, info) -> bool:
        env = os.getenv("ENVIRONMENT", "development").lower()
        if env == "production":
            return True
        return v

    @field_validator("ENABLE_DB_FALLBACK", mode="before")
    @classmethod
    def enforce_production_db_fallback(cls, v: bool, info) -> bool:
        env = os.getenv("ENVIRONMENT", "development").lower()
        if env == "production":
            return False  # Strict requirement: Never silently fallback to local SQLite in production
        return v

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

# Ensure storage directory exists
os.makedirs(settings.STORAGE_DIR, exist_ok=True)

