import enum
from sqlalchemy import (
    Boolean, Column, Date, DateTime, Numeric, Enum, ForeignKey,
    Integer, String, Text, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin


class GenderEnum(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class PlacementStatusEnum(str, enum.Enum):
    UNPLACED = "unplaced"
    PLACED = "placed"
    OPTED_OUT = "opted_out"


class SkillCategoryEnum(str, enum.Enum):
    PROGRAMMING_LANGUAGE = "programming_language"
    FRAMEWORK = "framework"
    DATABASE = "database"
    CLOUD_DEVOPS = "cloud_devops"
    MACHINE_LEARNING = "machine_learning"
    SOFT_SKILL = "soft_skill"
    TOOL = "tool"


class ProficiencyLevelEnum(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class StudentProfile(Base, TimestampMixin):
    __tablename__ = "student_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(150), nullable=False, index=True)
    roll_number = Column(String(50), unique=True, nullable=False, index=True)
    phone_number = Column(String(20), nullable=True)
    gender = Column(Enum(GenderEnum), nullable=True)
    bio = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    github_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    placement_status = Column(Enum(PlacementStatusEnum), default=PlacementStatusEnum.UNPLACED, nullable=False)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    academic_records = relationship("AcademicRecord", back_populates="student", cascade="all, delete-orphan")
    skills = relationship("StudentSkill", back_populates="student", cascade="all, delete-orphan")
    projects = relationship("StudentProject", back_populates="student", cascade="all, delete-orphan")
    certifications = relationship("StudentCertification", back_populates="student", cascade="all, delete-orphan")
    experiences = relationship("StudentExperience", back_populates="student", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="student", cascade="all, delete-orphan")
    saved_jobs = relationship("SavedJob", back_populates="student", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")
    job_match_results = relationship("JobMatchResult", back_populates="student", cascade="all, delete-orphan")
    skill_gap_analyses = relationship("SkillGapAnalysis", back_populates="student", cascade="all, delete-orphan")
    roadmaps = relationship("CareerRoadmap", back_populates="student", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSession", back_populates="student", cascade="all, delete-orphan")
    drive_registrations = relationship("DriveRegistration", back_populates="student", cascade="all, delete-orphan")
    readiness_history = relationship("CareerReadinessHistory", back_populates="student", cascade="all, delete-orphan")


class AcademicRecord(Base):
    __tablename__ = "academic_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_name = Column(String(255), nullable=False)
    degree = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False, index=True)
    start_year = Column(Integer, nullable=False)
    end_year = Column(Integer, nullable=False)
    cgpa_or_percentage = Column(Numeric(4, 2), nullable=False, index=True)
    backlogs_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    student = relationship("StudentProfile", back_populates="academic_records")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(Enum(SkillCategoryEnum), nullable=False, index=True)
    description = Column(String(255), nullable=True)

    student_skills = relationship("StudentSkill", back_populates="skill")
    job_skills = relationship("JobSkill", back_populates="skill")


class StudentSkill(Base):
    __tablename__ = "student_skills"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    proficiency_level = Column(Enum(ProficiencyLevelEnum), default=ProficiencyLevelEnum.INTERMEDIATE, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    __table_args__ = (UniqueConstraint("student_id", "skill_id", name="uq_student_skill"),)

    student = relationship("StudentProfile", back_populates="skills")
    skill = relationship("Skill", back_populates="student_skills")


class StudentProject(Base):
    __tablename__ = "student_projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    technologies_used = Column(JSON, nullable=False)
    github_url = Column(String(255), nullable=True)
    live_demo_url = Column(String(255), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    student = relationship("StudentProfile", back_populates="projects")


class StudentCertification(Base):
    __tablename__ = "student_certifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    issuing_organization = Column(String(200), nullable=False)
    issue_date = Column(Date, nullable=False)
    expiration_date = Column(Date, nullable=True)
    credential_url = Column(String(255), nullable=True)

    student = relationship("StudentProfile", back_populates="certifications")


class StudentExperience(Base):
    __tablename__ = "student_experience"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    company_name = Column(String(200), nullable=False)
    role_title = Column(String(150), nullable=False)
    location = Column(String(100), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    is_current = Column(Boolean, default=False, nullable=False)
    description = Column(Text, nullable=True)

    student = relationship("StudentProfile", back_populates="experiences")
