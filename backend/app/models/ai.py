import enum
from sqlalchemy import (
    Boolean, Column, DateTime, Numeric, Enum, ForeignKey,
    Integer, String, Text, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin


class RoadmapStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class ConversationContextEnum(str, enum.Enum):
    GENERAL = "general"
    RESUME_REVIEW = "resume_review"
    INTERVIEW_STRATEGY = "interview_strategy"
    JOB_ADVICE = "job_advice"


class MessageSenderRoleEnum(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class InterviewDifficultyEnum(str, enum.Enum):
    ENTRY_LEVEL = "entry_level"
    MID_LEVEL = "mid_level"
    SENIOR = "senior"


class JobMatchResult(Base):
    __tablename__ = "job_match_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    semantic_similarity = Column(Numeric(5, 4), nullable=False)
    skill_overlap_ratio = Column(Numeric(5, 4), nullable=False)
    final_match_percentage = Column(Numeric(5, 2), nullable=False, index=True)
    matched_skills = Column(JSON, nullable=False)
    missing_skills = Column(JSON, nullable=False)
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("student_id", "job_id", name="uq_student_job_match"),)

    student = relationship("StudentProfile", back_populates="job_match_results")
    job = relationship("Job", back_populates="match_results")


class SkillGapAnalysis(Base):
    __tablename__ = "skill_gap_analysis"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    target_role = Column(String(150), nullable=False)
    target_job_id = Column(String(36), ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)
    critical_missing_skills = Column(JSON, nullable=False)
    secondary_missing_skills = Column(JSON, nullable=False)
    readiness_percentage = Column(Numeric(5, 2), nullable=False)
    summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    student = relationship("StudentProfile", back_populates="skill_gap_analyses")
    roadmaps = relationship("CareerRoadmap", back_populates="gap_analysis", cascade="all, delete-orphan")


class CareerRoadmap(Base):
    __tablename__ = "career_roadmaps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    gap_analysis_id = Column(String(36), ForeignKey("skill_gap_analysis.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    target_role = Column(String(150), nullable=False)
    total_weeks = Column(Integer, default=6, nullable=False)
    status = Column(Enum(RoadmapStatusEnum), default=RoadmapStatusEnum.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    student = relationship("StudentProfile", back_populates="roadmaps")
    gap_analysis = relationship("SkillGapAnalysis", back_populates="roadmaps")
    items = relationship("RoadmapItem", back_populates="roadmap", cascade="all, delete-orphan")


class RoadmapItem(Base):
    __tablename__ = "roadmap_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    roadmap_id = Column(String(36), ForeignKey("career_roadmaps.id", ondelete="CASCADE"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)
    milestone_title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    learning_resources = Column(JSON, nullable=False)  # array of links/docs
    suggested_project = Column(String(255), nullable=True)
    skill_name = Column(String(100), nullable=True)
    priority = Column(String(50), default="high", nullable=True)
    estimated_time = Column(String(50), default="1-2 weeks", nullable=True)
    practical_exercise = Column(Text, nullable=True)
    status = Column(String(50), default="not_started", nullable=False)
    student_notes = Column(Text, nullable=True)
    evidence_url = Column(String(500), nullable=True)
    evidence_notes = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    roadmap = relationship("CareerRoadmap", back_populates="items")


class TargetRoleRequirement(Base):
    __tablename__ = "target_roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    role_name = Column(String(150), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    core_skills = Column(JSON, nullable=False)  # list of {name, proficiency, importance}
    preferred_skills = Column(JSON, nullable=False)
    technical_fundamentals = Column(JSON, nullable=False)
    tools = Column(JSON, nullable=False)
    frameworks = Column(JSON, nullable=False)
    curated_stages = Column(JSON, nullable=False)
    is_curated = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class CareerReadinessHistory(Base):
    __tablename__ = "career_readiness_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    overall_score = Column(Numeric(5, 2), nullable=False)
    technical_skills_score = Column(Numeric(5, 2), nullable=False)
    projects_score = Column(Numeric(5, 2), nullable=False)
    resume_quality_score = Column(Numeric(5, 2), nullable=False)
    academic_eligibility_score = Column(Numeric(5, 2), nullable=False)
    interview_prep_score = Column(Numeric(5, 2), nullable=False)
    certifications_score = Column(Numeric(5, 2), nullable=False)
    breakdown_json = Column(JSON, nullable=False)
    missing_data_json = Column(JSON, nullable=False)
    improvement_tips_json = Column(JSON, nullable=False)
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    student = relationship("StudentProfile", back_populates="readiness_history")


class AIConversation(Base, TimestampMixin):
    __tablename__ = "ai_conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), default="New Career Discussion", nullable=False)
    context_type = Column(Enum(ConversationContextEnum), default=ConversationContextEnum.GENERAL, nullable=False)

    user = relationship("User", back_populates="ai_conversations")
    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan")


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_role = Column(Enum(MessageSenderRoleEnum), nullable=False)
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=True)  # source: gemini/mock, token counts
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    conversation = relationship("AIConversation", back_populates="messages")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    target_role = Column(String(150), nullable=False)
    company_target = Column(String(150), default="General Tech", nullable=False)
    interview_type = Column(String(50), default="technical", nullable=False)
    difficulty = Column(Enum(InterviewDifficultyEnum), default=InterviewDifficultyEnum.ENTRY_LEVEL, nullable=False)
    topics = Column(JSON, nullable=True)
    current_question_index = Column(Integer, default=0, nullable=False)
    total_questions = Column(Integer, default=5, nullable=False)
    status = Column(String(50), default="in_progress", nullable=False)
    questions_json = Column(JSON, nullable=False)
    answers_json = Column(JSON, nullable=True)
    feedback_json = Column(JSON, nullable=True)
    detailed_scores = Column(JSON, nullable=True)
    missing_concepts = Column(JSON, nullable=True)
    improvements = Column(JSON, nullable=True)
    weak_topics = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    overall_score = Column(Integer, nullable=True)  # 0 to 100
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    student = relationship("StudentProfile", back_populates="interview_sessions")
