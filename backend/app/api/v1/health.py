from fastapi import APIRouter
from app.schemas.common import ResponseEnvelope, HealthResponse
from app.core.database import test_db_connection
from app.core.config import settings

router = APIRouter()


@router.get("/health", response_model=ResponseEnvelope[HealthResponse])
def get_health_status():
    """Returns the operational status of the CareerBridge backend and database."""
    db_status = test_db_connection()
    overall_status = "healthy" if db_status.get("status") == "healthy" else "degraded"

    data = HealthResponse(
        status=overall_status,
        version="1.0.0",
        environment=settings.ENVIRONMENT,
        database=db_status,
    )

    return ResponseEnvelope(
        success=True,
        data=data,
        message="CareerBridge API is running smoothly."
    )

