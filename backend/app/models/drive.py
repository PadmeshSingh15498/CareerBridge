import enum
from sqlalchemy import (
    Column, Date, DateTime, Numeric, Enum, ForeignKey,
    Integer, String, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin


class DriveStatusEnum(str, enum.Enum):
    UPCOMING = "upcoming"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CandidateDriveStatusEnum(str, enum.Enum):
    REGISTERED = "registered"
    SHORTLISTED = "shortlisted"
    CLEARED = "cleared"
    ELIMINATED = "eliminated"
    OFFERED = "offered"


class PlacementDrive(Base, TimestampMixin):
    __tablename__ = "placement_drives"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    academic_year = Column(Integer, nullable=False)
    drive_date = Column(Date, nullable=False, index=True)
    registration_deadline = Column(DateTime, nullable=False)
    min_cgpa = Column(Numeric(4, 2), default=6.00, nullable=False)
    max_backlogs_allowed = Column(Integer, default=0, nullable=False)
    number_of_openings = Column(Integer, default=10, nullable=False)
    job_roles = Column(JSON, nullable=True)  # e.g., ["Software Engineer", "Cloud Analyst"]
    allowed_departments = Column(JSON, nullable=False)
    selection_rounds = Column(JSON, nullable=False)  # e.g., ["Aptitude", "Coding", "TR", "HR"]
    venue = Column(String(200), nullable=False)
    status = Column(Enum(DriveStatusEnum), default=DriveStatusEnum.UPCOMING, nullable=False, index=True)

    company = relationship("Company", back_populates="placement_drives")
    registrations = relationship("DriveRegistration", back_populates="drive", cascade="all, delete-orphan")


class DriveRegistration(Base):
    __tablename__ = "drive_registrations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    drive_id = Column(String(36), ForeignKey("placement_drives.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    current_round = Column(String(100), default="Registered", nullable=False)
    status = Column(Enum(CandidateDriveStatusEnum), default=CandidateDriveStatusEnum.REGISTERED, nullable=False, index=True)
    registered_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("drive_id", "student_id", name="uq_drive_student_registration"),)

    drive = relationship("PlacementDrive", back_populates="registrations")
    student = relationship("StudentProfile", back_populates="drive_registrations")
