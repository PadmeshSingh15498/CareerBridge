from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer,
    String, Text, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin


class Resume(Base, TimestampMixin):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(100), default="application/pdf", nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)

    student = relationship("StudentProfile", back_populates="resumes")
    versions = relationship("ResumeVersion", back_populates="resume", cascade="all, delete-orphan")
    analysis = relationship("ResumeAnalysis", back_populates="resume", uselist=False, cascade="all, delete-orphan")
    analysis_history = relationship("ResumeAnalysisHistory", back_populates="resume", cascade="all, delete-orphan", order_by="desc(ResumeAnalysisHistory.created_at)")
    applications = relationship("Application", back_populates="resume")


class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    file_path = Column(String(500), nullable=False)
    changelog_notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("resume_id", "version_number", name="uq_resume_version"),)

    resume = relationship("Resume", back_populates="versions")


class ResumeAnalysis(Base):
    __tablename__ = "resume_analysis"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), unique=True, nullable=False)
    raw_text = Column(Text, nullable=False)
    ats_score = Column(Integer, default=0, nullable=False)
    section_score = Column(Integer, default=0, nullable=False)
    metric_score = Column(Integer, default=0, nullable=False)
    skill_score = Column(Integer, default=0, nullable=False)
    format_score = Column(Integer, default=0, nullable=False)
    extracted_skills = Column(JSON, nullable=False)  # e.g., ["Python", "FastAPI"]
    missing_recommended_skills = Column(JSON, nullable=True)
    improvements_json = Column(JSON, nullable=False)  # Array of improvement hints
    dense_embedding = Column(Text, nullable=True)  # JSON or base64 384-d vector
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    resume = relationship("Resume", back_populates="analysis")


class ResumeAnalysisHistory(Base):
    __tablename__ = "resume_analysis_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    target_job_id = Column(String(36), ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    overall_score = Column(Integer, nullable=False)
    structure_score = Column(Integer, default=0, nullable=False)
    skills_score = Column(Integer, default=0, nullable=False)
    projects_score = Column(Integer, default=0, nullable=False)
    experience_score = Column(Integer, default=0, nullable=False)
    education_score = Column(Integer, default=0, nullable=False)
    achievements_score = Column(Integer, default=0, nullable=False)
    readability_score = Column(Integer, default=0, nullable=False)
    strengths_json = Column(JSON, nullable=False)
    weaknesses_json = Column(JSON, nullable=False)
    improvement_suggestions_json = Column(JSON, nullable=False)
    suggested_edits_json = Column(JSON, nullable=False)
    job_relevance_json = Column(JSON, nullable=True)
    engine_type = Column(String(50), default="nlp_intelligence", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    resume = relationship("Resume", back_populates="analysis_history")
    job = relationship("Job")


