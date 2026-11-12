import enum
from sqlalchemy import (
    Column, DateTime, Numeric, Enum, ForeignKey, Integer,
    String, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin


class ApplicationStatusEnum(str, enum.Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    SHORTLISTED = "shortlisted"
    TECHNICAL_ROUND = "technical_round"
    HR_ROUND = "hr_round"
    OFFERED = "offered"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class InterviewStatusEnum(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


class InterviewRecommendationEnum(str, enum.Enum):
    STRONG_HIRE = "strong_hire"
    HIRE = "hire"
    BORDERLINE = "borderline"
    NO_HIRE = "no_hire"


class Application(Base, TimestampMixin):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="RESTRICT"), nullable=False)
    current_status = Column(Enum(ApplicationStatusEnum), default=ApplicationStatusEnum.APPLIED, nullable=False, index=True)
    cover_letter = Column(Text, nullable=True)
    recruiter_notes = Column(Text, nullable=True)  # Private internal recruiter notes (never shared with candidate)
    composite_match_score = Column(Numeric(5, 2), default=0.00, nullable=False)
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (UniqueConstraint("job_id", "student_id", name="uq_job_student_application"),)

    job = relationship("Job", back_populates="applications")
    student = relationship("StudentProfile", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")
    status_history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="application", cascade="all, delete-orphan")


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    change_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    application = relationship("Application", back_populates="status_history")


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    round_name = Column(String(100), nullable=False)
    scheduled_start = Column(DateTime, nullable=False, index=True)
    scheduled_end = Column(DateTime, nullable=False)
    meeting_link = Column(String(500), nullable=True)
    venue = Column(String(150), nullable=True)
    interviewer_name = Column(String(150), nullable=True)
    interview_mode = Column(String(50), default="virtual", nullable=False)  # virtual, in_person, phone
    instructions = Column(Text, nullable=True)
    status = Column(Enum(InterviewStatusEnum), default=InterviewStatusEnum.SCHEDULED, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    application = relationship("Application", back_populates="interviews")
    feedback = relationship("InterviewFeedback", back_populates="interview", uselist=False, cascade="all, delete-orphan")


class InterviewFeedback(Base):
    __tablename__ = "interview_feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    interview_id = Column(String(36), ForeignKey("interviews.id", ondelete="CASCADE"), unique=True, nullable=False)
    evaluator_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    technical_rating = Column(Integer, nullable=False)  # 1-5
    communication_rating = Column(Integer, nullable=False)  # 1-5
    problem_solving_rating = Column(Integer, nullable=False)  # 1-5
    recommendation = Column(Enum(InterviewRecommendationEnum), nullable=False)
    detailed_notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    interview = relationship("Interview", back_populates="feedback")
