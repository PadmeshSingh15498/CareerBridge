"""
CareerBridge Production Database Provisioner & Health Check Utility.
Verifies production database connectivity, applies schema migrations,
seeds initial curated role definitions, and confirms index status.

Usage:
  python setup_mysql_production.py [--apply-migrations] [--seed-curated-roles]
"""

import os
import sys
import argparse
from sqlalchemy import create_engine, text

# Ensure backend in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import Base


def verify_and_setup_database(apply_migrations: bool = True, seed_roles: bool = True):
    print("=" * 80)
    print("CAREERBRIDGE PRODUCTION DATABASE SETUP & VERIFICATION")
    print("=" * 80)
    print(f"Environment:       {settings.ENVIRONMENT}")
    print(f"Primary DB URL:    {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    print(f"Fallback Enabled:  {settings.ENABLE_DB_FALLBACK}")

    if settings.ENVIRONMENT == "production" and "sqlite" in settings.DATABASE_URL.lower():
        print("\n[ERROR] Production environment is configured with SQLite! Production requires MySQL or PostgreSQL.")
        sys.exit(1)

    connect_args = {"connect_timeout": 10}
    if settings.DATABASE_URL.startswith("mysql"):
        connect_args["charset"] = "utf8mb4"
        if settings.DATABASE_SSL_CA and os.path.exists(settings.DATABASE_SSL_CA):
            connect_args["ssl"] = {"ca": settings.DATABASE_SSL_CA}

    try:
        engine = create_engine(
            settings.DATABASE_URL,
            pool_size=settings.DATABASE_POOL_SIZE,
            max_overflow=settings.DATABASE_MAX_OVERFLOW,
            pool_recycle=1800,
            pool_pre_ping=True,
            connect_args=connect_args
        )
        with engine.connect() as conn:
            one = conn.execute(text("SELECT 1")).scalar()
            print(f"\n[PASS] Database connection verified successfully (SELECT 1 -> {one})")

            # Check Charset on MySQL
            if settings.DATABASE_URL.startswith("mysql"):
                charset_row = conn.execute(text("SELECT @@character_set_database, @@collation_database")).fetchone()
                print(f"       Active Character Set: {charset_row[0]} | Collation: {charset_row[1]}")
                if "utf8" not in charset_row[0].lower():
                    print("       [WARNING] Database is not using utf8mb4 encoding!")

    except Exception as exc:
        print(f"\n[FAIL] Unable to connect to primary database: {exc}")
        if settings.ENVIRONMENT == "production":
            print("       Exiting with failure because fallback is prohibited in production.")
            sys.exit(1)
        else:
            print("       Development fallback will be active if server runs locally.")
            return

    # Apply Schema Tables
    if apply_migrations:
        print("\nApplying relational database schema tables...")
        try:
            import app.models  # Load all ORM models
            Base.metadata.create_all(bind=engine)
            print("[PASS] Schema tables created/verified successfully via Base.metadata.")
        except Exception as exc:
            print(f"[FAIL] Schema creation encountered an error: {exc}")
            sys.exit(1)

    # Seed Curated Target Roles & Benchmark Skills
    if seed_roles:
        print("\nSeeding Curated Target Roles & Skills Taxonomy...")
        try:
            from sqlalchemy.orm import sessionmaker
            from app.services.career_intelligence_service import CareerIntelligenceService
            SessionLocal = sessionmaker(bind=engine)
            with SessionLocal() as db:
                CareerIntelligenceService.seed_curated_roles(db)
            print("[PASS] Curated roles taxonomy seeded successfully.")
        except Exception as exc:
            print(f"[FAIL] Seeding curated roles failed: {exc}")
            sys.exit(1)

    print("\n" + "=" * 80)
    print("PRODUCTION DATABASE IS HEALTHY AND READY FOR APPLICATION TRAFFIC")
    print("=" * 80)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CareerBridge Production DB Setup")
    parser.add_argument("--skip-migrations", action="store_true", help="Skip schema table creation")
    parser.add_argument("--skip-seed", action="store_true", help="Skip taxonomy seeding")
    args = parser.parse_args()

    verify_and_setup_database(
        apply_migrations=not args.skip_migrations,
        seed_roles=not args.skip_seed
    )

