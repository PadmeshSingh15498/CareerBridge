import enum
from sqlalchemy import (
    Boolean, Column, DateTime, Numeric, Enum, ForeignKey,
    Integer, String, Text, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin


class JobTypeEnum(str, enum.Enum):
    FULL_TIME = "full_time"
    INTERNSHIP = "internship"
    INTERN_TO_FTE = "intern_to_fte"


class WorkplaceTypeEnum(str, enum.Enum):
    ON_SITE = "on_site"
    HYBRID = "hybrid"
    REMOTE = "remote"


class JobStatusEnum(str, enum.Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"


class GenderPreferenceEnum(str, enum.Enum):
    ANY = "any"
    FEMALE_ONLY = "female_only"


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    posted_by = Column(String(36), ForeignKey("recruiter_profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False, index=True)
    job_type = Column(Enum(JobTypeEnum), default=JobTypeEnum.FULL_TIME, nullable=False, index=True)
    workplace_type = Column(Enum(WorkplaceTypeEnum), default=WorkplaceTypeEnum.ON_SITE, nullable=False)
    location = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=False)
    salary_min = Column(Numeric(12, 2), nullable=True)
    salary_max = Column(Numeric(12, 2), nullable=True)
    salary_currency = Column(String(10), default="INR", nullable=False)
    vacancies = Column(Integer, default=1, nullable=False)
    status = Column(Enum(JobStatusEnum), default=JobStatusEnum.PENDING_APPROVAL, nullable=False, index=True)
    application_deadline = Column(DateTime, nullable=False, index=True)
    jd_embedding = Column(Text, nullable=True)  # JSON or Base64 384-d vector

    # Relationships
    company = relationship("Company", back_populates="jobs")
    poster = relationship("RecruiterProfile", back_populates="jobs")
    skills = relationship("JobSkill", back_populates="job", cascade="all, delete-orphan")
    eligibility = relationship("JobEligibility", back_populates="job", uselist=False, cascade="all, delete-orphan")
    saved_by = relationship("SavedJob", back_populates="job", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    match_results = relationship("JobMatchResult", back_populates="job", cascade="all, delete-orphan")


class JobSkill(Base):
    __tablename__ = "job_skills"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    weight = Column(Numeric(3, 2), default=1.00, nullable=False)

    __table_args__ = (UniqueConstraint("job_id", "skill_id", name="uq_job_skill"),)

    job = relationship("Job", back_populates="skills")
    skill = relationship("Skill", back_populates="job_skills")


class JobEligibility(Base):
    __tablename__ = "job_eligibility"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), unique=True, nullable=False)
    min_cgpa = Column(Numeric(4, 2), default=0.00, nullable=False)
    max_backlogs_allowed = Column(Integer, default=0, nullable=False)
    allowed_grad_years = Column(JSON, nullable=False)  # e.g., [2025, 2026]
    allowed_departments = Column(JSON, nullable=False)  # e.g., ["Computer Science", "Information Technology"]
    gender_preference = Column(Enum(GenderPreferenceEnum), default=GenderPreferenceEnum.ANY, nullable=False)

    job = relationship("Job", back_populates="eligibility")


class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    saved_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("student_id", "job_id", name="uq_student_saved_job"),)

    student = relationship("StudentProfile", back_populates="saved_jobs")
    job = relationship("Job", back_populates="saved_by")
