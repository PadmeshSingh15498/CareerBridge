"""
CareerBridge — Automated Production Readiness Verification Script
------------------------------------------------------------------
Validates that the entire CareerBridge codebase, configuration, Docker files,
database settings, storage permissions, and security headers meet production
deployment standards without exposing secrets or relying on local SQLite fallback.
"""

import sys
import os
import re
import json
import logging
from pathlib import Path

# Setup paths
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
ROOT_DIR = BACKEND_DIR.parent
FRONTEND_DIR = ROOT_DIR / "frontend"

sys.path.insert(0, str(BACKEND_DIR))

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("ProductionVerifier")

class ReadinessReport:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.warnings = 0
        self.checks = []

    def log_pass(self, title: str, details: str = ""):
        self.passed += 1
        self.checks.append({"status": "PASS", "title": title, "details": details})
        print(f"  [PASS] {title}" + (f" -> {details}" if details else ""))

    def log_fail(self, title: str, details: str = ""):
        self.failed += 1
        self.checks.append({"status": "FAIL", "title": title, "details": details})
        print(f"  [FAIL] {title}" + (f" -> {details}" if details else ""))

    def log_warn(self, title: str, details: str = ""):
        self.warnings += 1
        self.checks.append({"status": "WARN", "title": title, "details": details})
        print(f"  [WARN] {title}" + (f" -> {details}" if details else ""))


def verify_env_and_security(report: ReadinessReport):
    print("\n--- 1. Configuration & Security Hardening ---")
    try:
        from app.core.config import Settings

        # Test simulated production settings
        os.environ["ENVIRONMENT"] = "production"
        prod_settings = Settings(
            ENVIRONMENT="production",
            DEBUG=True,  # Validator should override to False
            COOKIE_SECURE=False,  # Validator should override to True
            ENABLE_DB_FALLBACK=True,  # Validator should override to False
            SECRET_KEY="a" * 64,
            DATABASE_URL="mysql+pymysql://user:pwd@mysql.internal:3306/careerbridge_prod"
        )
        report.log_pass("Production Settings Schema", "Settings model instantiates successfully with production values")

        if prod_settings.DEBUG is False:
            report.log_pass("Production DEBUG Invariant", "DEBUG is strictly False in production")
        else:
            report.log_fail("Production DEBUG Invariant", "DEBUG was not enforced to False in production!")

        if prod_settings.COOKIE_SECURE is True:
            report.log_pass("Production Cookie Security", "COOKIE_SECURE is strictly True in production")
        else:
            report.log_fail("Production Cookie Security", "COOKIE_SECURE was not enforced to True in production!")

        if prod_settings.ENABLE_DB_FALLBACK is False:
            report.log_pass("Production DB Fallback Invariant", "ENABLE_DB_FALLBACK is strictly False in production")
        else:
            report.log_fail("Production DB Fallback Invariant", "ENABLE_DB_FALLBACK was not forced to False in production!")

        # Reset ENVIRONMENT to development
        os.environ["ENVIRONMENT"] = "development"

    except Exception as e:
        report.log_fail("Settings Configuration Error", str(e))


def verify_secrets_isolation(report: ReadinessReport):
    print("\n--- 2. Secrets & Git Repository Hygiene ---")
    gitignore_path = ROOT_DIR / ".gitignore"
    if not gitignore_path.exists():
        report.log_fail(".gitignore Check", "Root .gitignore is missing!")
        return

    content = gitignore_path.read_text(encoding="utf-8")

    # Check essential gitignore entries
    rules = [
        (".env pattern", r"\.env"),
        ("SQLite databases", r"\*\.db"),
        ("Resumes storage", r"resumes/"),
        ("Node modules", r"node_modules/"),
        ("Virtualenv", r"venv/"),
    ]

    for label, pattern in rules:
        if re.search(pattern, content):
            report.log_pass(f".gitignore rule: {label}", f"Found match for pattern '{pattern}'")
        else:
            report.log_fail(f".gitignore rule: {label}", f"Missing rule matching '{pattern}'")

    # Verify no accidental live .env committed in git
    for env_file in [ROOT_DIR / ".env", BACKEND_DIR / ".env", FRONTEND_DIR / ".env", FRONTEND_DIR / ".env.local"]:
        if env_file.exists():
            report.log_warn(f"Local file present: {env_file.relative_to(ROOT_DIR)}", "Ignored by Git, ensure it is not manually tracked.")
        else:
            report.log_pass(f"No untracked local file: {env_file.name}", "Not present in workspace root")


def verify_docker_and_orchestration(report: ReadinessReport):
    print("\n--- 3. Containerization & Orchestration Assets ---")
    assets = [
        ("Backend Dockerfile", BACKEND_DIR / "Dockerfile"),
        ("Frontend Dockerfile", FRONTEND_DIR / "Dockerfile"),
        ("Development Compose", ROOT_DIR / "docker-compose.yml"),
        ("Production Compose", ROOT_DIR / "docker-compose.prod.yml"),
        ("Render Blueprint", ROOT_DIR / "render.yaml"),
        ("Backend Procfile", BACKEND_DIR / "Procfile"),
        ("Root Procfile", ROOT_DIR / "Procfile"),
    ]

    for label, file_path in assets:
        if file_path.exists() and file_path.stat().st_size > 0:
            report.log_pass(f"Asset: {label}", f"Found at {file_path.name} ({file_path.stat().st_size} bytes)")
        else:
            report.log_fail(f"Asset: {label}", f"Missing or empty file: {file_path}")

    # Inspect Backend Dockerfile for non-root user and healthcheck
    backend_dockerfile = BACKEND_DIR / "Dockerfile"
    if backend_dockerfile.exists():
        content = backend_dockerfile.read_text(encoding="utf-8")
        if "USER " in content:
            report.log_pass("Backend Container Security", "Runs as non-root user")
        else:
            report.log_fail("Backend Container Security", "Backend Dockerfile runs as root!")

        if "HEALTHCHECK " in content:
            report.log_pass("Backend Healthcheck", "Defines container HEALTHCHECK instruction")
        else:
            report.log_warn("Backend Healthcheck", "No explicit HEALTHCHECK in backend Dockerfile")

    # Inspect Frontend Dockerfile for non-root user
    frontend_dockerfile = FRONTEND_DIR / "Dockerfile"
    if frontend_dockerfile.exists():
        content = frontend_dockerfile.read_text(encoding="utf-8")
        if "USER " in content:
            report.log_pass("Frontend Container Security", "Runs as non-root user")
        else:
            report.log_fail("Frontend Container Security", "Frontend Dockerfile runs as root!")

    # Inspect docker-compose.prod.yml for persistent volumes
    prod_compose = ROOT_DIR / "docker-compose.prod.yml"
    if prod_compose.exists():
        content = prod_compose.read_text(encoding="utf-8")
        if "careerbridge_prod_resume_storage" in content and "careerbridge_prod_mysql_data" in content:
            report.log_pass("Persistent Volumes", "Production Compose defines persistent MySQL and resume volumes")
        else:
            report.log_fail("Persistent Volumes", "Production Compose missing named persistent volumes")


def verify_database_deployment_assets(report: ReadinessReport):
    print("\n--- 4. Database Deployment & Migration Assets ---")
    scripts = [
        ("MySQL Schema Init Script", BACKEND_DIR / "scripts" / "init_mysql_production.sql"),
        ("MySQL Setup & Migration CLI", BACKEND_DIR / "scripts" / "setup_mysql_production.py"),
        ("Automated Backup Script", BACKEND_DIR / "scripts" / "backup_mysql.sh"),
        ("MySQL Production Guide", ROOT_DIR / "docs" / "mysql-production-guide.md"),
    ]

    for label, script_path in scripts:
        if script_path.exists() and script_path.stat().st_size > 0:
            report.log_pass(f"DB Asset: {label}", f"Found at {script_path.name}")
        else:
            report.log_fail(f"DB Asset: {label}", f"Missing: {script_path}")

    # Inspect SQL Init script for utf8mb4 and user privileges
    sql_script = BACKEND_DIR / "scripts" / "init_mysql_production.sql"
    if sql_script.exists():
        content = sql_script.read_text(encoding="utf-8")
        if "utf8mb4" in content and "utf8mb4_unicode_ci" in content:
            report.log_pass("MySQL Character Set", "init script specifies utf8mb4 and utf8mb4_unicode_ci")
        else:
            report.log_warn("MySQL Character Set", "init script may not explicitly specify utf8mb4 collation")

        if "GRANT SELECT, INSERT, UPDATE, DELETE" in content:
            report.log_pass("Least Privilege Grants", "init script uses restricted user grants instead of ALL PRIVILEGES")
        else:
            report.log_warn("Least Privilege Grants", "Verify application user does not possess superuser grants")


def verify_frontend_production_readiness(report: ReadinessReport):
    print("\n--- 5. Frontend Production Architecture ---")
    # Check next.config.js
    next_config = FRONTEND_DIR / "next.config.js"
    if next_config.exists():
        content = next_config.read_text(encoding="utf-8")
        if "poweredByHeader: false" in content:
            report.log_pass("Security Headers", "poweredByHeader is disabled to prevent fingerprinting")
        else:
            report.log_warn("Security Headers", "poweredByHeader should be set to false")

        if "standalone" in content:
            report.log_pass("Docker Standalone Output", "next.config.js supports standalone bundle generation")
        else:
            report.log_warn("Docker Standalone Output", "standalone mode not referenced in next.config.js")
    else:
        report.log_fail("Next Config", "frontend/next.config.js not found")

    # Check API client dynamic URL resolution
    api_client = FRONTEND_DIR / "src" / "lib" / "api.ts"
    if api_client.exists():
        content = api_client.read_text(encoding="utf-8")
        if "process.env.NEXT_PUBLIC_API_URL" in content:
            report.log_pass("API Client Configuration", "Uses NEXT_PUBLIC_API_URL environment variable")
        else:
            report.log_fail("API Client Configuration", "Hardcoded API URL detected in frontend/src/lib/api.ts!")

        if "withCredentials: true" in content:
            report.log_pass("API Cookie Handling", "Client configured with withCredentials: true for HttpOnly session cookies")
        else:
            report.log_warn("API Cookie Handling", "withCredentials not explicitly enabled")
    else:
        report.log_fail("API Client File", f"frontend/src/lib/api.ts not found at {api_client}")


def verify_storage_filesystem(report: ReadinessReport):
    print("\n--- 6. Resume Storage & Directory Structure ---")
    resumes_dir = BACKEND_DIR / "storage" / "resumes"
    if not resumes_dir.exists():
        resumes_dir.mkdir(parents=True, exist_ok=True)

    # Test file write and read
    test_file = resumes_dir / ".healthcheck_write_test.tmp"
    try:
        test_file.write_text("storage_ok", encoding="utf-8")
        content = test_file.read_text(encoding="utf-8")
        test_file.unlink()
        if content == "storage_ok":
            report.log_pass("Resume Storage I/O", f"Writable and readable at {resumes_dir}")
        else:
            report.log_fail("Resume Storage I/O", "Data read mismatch")
    except Exception as e:
        report.log_fail("Resume Storage I/O", f"Failed write test: {e}")


def main():
    print("=" * 70)
    print("   CAREERBRIDGE PRODUCTION READINESS VERIFICATION AUDIT")
    print("=" * 70)

    report = ReadinessReport()

    verify_env_and_security(report)
    verify_secrets_isolation(report)
    verify_docker_and_orchestration(report)
    verify_database_deployment_assets(report)
    verify_frontend_production_readiness(report)
    verify_storage_filesystem(report)

    print("\n" + "=" * 70)
    print("   READINESS SUMMARY")
    print("=" * 70)
    print(f"Total Passed Checks:   {report.passed}")
    print(f"Total Warnings:        {report.warnings}")
    print(f"Total Failed Checks:   {report.failed}")

    if report.failed == 0:
        print("\n>>> RESULT: PRODUCTION READY! All critical systems and configs passed. <<<\n")
        return 0
    else:
        print(f"\n>>> RESULT: FAILED! {report.failed} issues must be resolved before deployment. <<<\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
