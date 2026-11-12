from app.models.base import Base, generate_uuid, TimestampMixin
from app.models.user import User, UserRole, Notification, NotificationType, NotificationPreference, AuditLog
from app.models.student import (
    StudentProfile, GenderEnum, PlacementStatusEnum, AcademicRecord,
    Skill, SkillCategoryEnum, StudentSkill, ProficiencyLevelEnum,
    StudentProject, StudentCertification, StudentExperience
)
from app.models.recruiter import Company, CompanySizeEnum, RecruiterProfile
from app.models.job import (
    Job, JobTypeEnum, WorkplaceTypeEnum, JobStatusEnum,
    GenderPreferenceEnum, JobSkill, JobEligibility, SavedJob
)
from app.models.application import (
    Application, ApplicationStatusEnum, ApplicationStatusHistory,
    Interview, InterviewStatusEnum, InterviewFeedback, InterviewRecommendationEnum
)
from app.models.resume import Resume, ResumeVersion, ResumeAnalysis, ResumeAnalysisHistory
from app.models.ai import (
    JobMatchResult, SkillGapAnalysis, CareerRoadmap, RoadmapStatusEnum,
    RoadmapItem, AIConversation, ConversationContextEnum, AIMessage,
    MessageSenderRoleEnum, InterviewSession, InterviewDifficultyEnum,
    TargetRoleRequirement, CareerReadinessHistory
)
from app.models.drive import (
    PlacementDrive, DriveStatusEnum, DriveRegistration, CandidateDriveStatusEnum
)

__all__ = [
    "Base",
    "generate_uuid",
    "TimestampMixin",
    "User",
    "UserRole",
    "Notification",
    "NotificationType",
    "AuditLog",
    "StudentProfile",
    "GenderEnum",
    "PlacementStatusEnum",
    "AcademicRecord",
    "Skill",
    "SkillCategoryEnum",
    "StudentSkill",
    "ProficiencyLevelEnum",
    "StudentProject",
    "StudentCertification",
    "StudentExperience",
    "Company",
    "CompanySizeEnum",
    "RecruiterProfile",
    "Job",
    "JobTypeEnum",
    "WorkplaceTypeEnum",
    "JobStatusEnum",
    "GenderPreferenceEnum",
    "JobSkill",
    "JobEligibility",
    "SavedJob",
    "Application",
    "ApplicationStatusEnum",
    "ApplicationStatusHistory",
    "Interview",
    "InterviewStatusEnum",
    "InterviewFeedback",
    "InterviewRecommendationEnum",
    "Resume",
    "ResumeVersion",
    "ResumeAnalysis",
    "ResumeAnalysisHistory",
    "JobMatchResult",
    "SkillGapAnalysis",
    "CareerRoadmap",
    "RoadmapStatusEnum",
    "RoadmapItem",
    "AIConversation",
    "ConversationContextEnum",
    "AIMessage",
    "MessageSenderRoleEnum",
    "InterviewSession",
    "InterviewDifficultyEnum",
    "TargetRoleRequirement",
    "CareerReadinessHistory",
    "PlacementDrive",
    "DriveStatusEnum",
    "DriveRegistration",
    "CandidateDriveStatusEnum",
]

