import logging
import sys
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base, test_db_connection
from app.api.v1.api import api_router
from app.schemas.common import ResponseEnvelope, ErrorDetail

# Configure structured logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("careerbridge")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle hook for startup and shutdown events."""
    logger.info("Initializing CareerBridge Backend Services...")
    # Auto-create all relational tables on startup if not in automated test run
    if not os.getenv("PYTEST_CURRENT_TEST") and not os.getenv("TESTING"):
        try:
            import app.models  # Ensure all model tables are registered with Base.metadata
            Base.metadata.create_all(bind=engine)
            db_check = test_db_connection()
            logger.info(f"Database schema initialized successfully. Status: {db_check}")

            # Seed curated roles and ensure Phase 10 tables
            from app.core.database import SessionLocal
            from app.services.career_intelligence_service import CareerIntelligenceService
            with SessionLocal() as db:
                CareerIntelligenceService.seed_curated_roles(db)
        except Exception as exc:
            logger.error(f"Error during database initialization: {exc}")

    yield

    logger.info("Shutting down CareerBridge services...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CareerBridge — From Potential to Placement. AI-powered career guidance and campus placement platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Centralized Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Standardized handler for controlled HTTP exceptions."""
    logger.warning(f"HTTP {exc.status_code} on {request.method} {request.url.path}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content=ResponseEnvelope(
            success=False,
            data=None,
            message=str(exc.detail),
            error=ErrorDetail(
                code=f"HTTP_{exc.status_code}",
                message=str(exc.detail),
                details=None
            )
        ).model_dump(mode="json")
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Standardized handler for Pydantic input validation failures."""
    errors = exc.errors()
    formatted_errors = [
        {"field": ".".join(str(loc) for loc in err["loc"]), "message": err["msg"]}
        for err in errors
    ]
    logger.warning(f"Validation error on {request.method} {request.url.path}: {formatted_errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ResponseEnvelope(
            success=False,
            data=None,
            message="Request body or query parameters validation failed.",
            error=ErrorDetail(
                code="VALIDATION_ERROR",
                message="One or more fields failed schema validation.",
                details=formatted_errors
            )
        ).model_dump(mode="json")
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Centralized fallback for unhandled 500 runtime exceptions."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ResponseEnvelope(
            success=False,
            data=None,
            message="An unexpected internal server error occurred.",
            error=ErrorDetail(
                code="INTERNAL_SERVER_ERROR",
                message=str(exc) if settings.DEBUG else "Please contact system administrator.",
                details=None
            )
        ).model_dump(mode="json")
    )


# Root Health Check
@app.get("/health", tags=["Health"])
def root_health_check():
    """Root quick health check."""
    db_status = test_db_connection()
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "database": db_status
    }


# Include V1 REST Router
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

