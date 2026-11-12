import os
import logging
from typing import Generator
from sqlalchemy import create_engine, text, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()


def get_engine():
    """
    Initializes the database engine.
    First attempts connection to the configured primary MySQL database with connection pooling.
    If MySQL server is unavailable and fallback is enabled, gracefully falls back to local SQLite.
    """
    primary_url = settings.DATABASE_URL
    is_mysql = primary_url.startswith("mysql")
    is_postgres = primary_url.startswith("postgresql") or primary_url.startswith("postgres")

    try:
        if is_mysql:
            # Production MySQL connection pool configuration
            connect_args = {
                "connect_timeout": 10,
                "charset": "utf8mb4"
            }
            if settings.DATABASE_SSL_CA and os.path.exists(settings.DATABASE_SSL_CA):
                connect_args["ssl"] = {"ca": settings.DATABASE_SSL_CA}

            engine = create_engine(
                primary_url,
                pool_size=settings.DATABASE_POOL_SIZE,
                max_overflow=settings.DATABASE_MAX_OVERFLOW,
                pool_recycle=1800,
                pool_pre_ping=True,
                connect_args=connect_args,
                echo=settings.DEBUG and settings.ENVIRONMENT == "development",
            )
            # Test immediate connectivity
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info(f"Connected successfully to MySQL production database: {settings.MYSQL_DATABASE}")
            return engine, "mysql"

        elif is_postgres:
            # PostgreSQL cloud deployment (Render, AWS RDS, Supabase)
            engine = create_engine(
                primary_url,
                pool_size=settings.DATABASE_POOL_SIZE,
                max_overflow=settings.DATABASE_MAX_OVERFLOW,
                pool_recycle=1800,
                pool_pre_ping=True,
                echo=settings.DEBUG and settings.ENVIRONMENT == "development",
            )
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Connected successfully to PostgreSQL database")
            return engine, "postgresql"

        else:
            engine = create_engine(primary_url, echo=False)
            return engine, "sqlite"

    except Exception as e:
        if settings.ENVIRONMENT != "production" and settings.ENABLE_DB_FALLBACK:
            logger.warning(
                f"Primary database connection failed ({e}). "
                f"Development fallback active: using SQLite database at {settings.FALLBACK_DATABASE_URL}."
            )
            fallback_engine = create_engine(
                settings.FALLBACK_DATABASE_URL,
                connect_args={"check_same_thread": False, "timeout": 30},
                echo=False,
            )
            try:
                with fallback_engine.connect() as conn:
                    conn.execute(text("PRAGMA journal_mode=WAL"))
                    conn.execute(text("PRAGMA synchronous=NORMAL"))
            except Exception:
                pass
            return fallback_engine, "sqlite"
        else:
            logger.error(f"FATAL: Production database connection failed: {e}. SQLite fallback is disabled in production.")
            raise e


engine, active_db_dialect = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enforces SQLite foreign key constraints and WAL configuration on every connection."""
    if active_db_dialect == "sqlite":
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA foreign_keys=ON")
        except Exception:
            pass
        finally:
            cursor.close()


def get_db() -> Generator:
    """Dependency that yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_db_connection() -> dict:
    """Performs a live health check on the active database."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            return {
                "status": "healthy" if result == 1 else "unhealthy",
                "dialect": active_db_dialect,
                "detail": f"Connected to {active_db_dialect.upper()}"
            }
    except Exception as exc:
        return {
            "status": "unhealthy",
            "dialect": active_db_dialect,
            "detail": str(exc)
        }
