import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, String
from app.core.database import Base


def generate_uuid() -> str:
    """Generates a UUID v4 string identifier."""
    return str(uuid.uuid4())


class TimestampMixin:
    """Mixin that adds created_at and updated_at datetime timestamps."""
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

