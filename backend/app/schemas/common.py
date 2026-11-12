from typing import Generic, Optional, TypeVar, List, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class ResponseEnvelope(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = "Operation completed successfully."
    error: Optional[ErrorDetail] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Alias for convenience
APIResponse = ResponseEnvelope


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total_records: int
    total_pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: List[T]
    pagination: PaginationMeta
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    database: dict
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

