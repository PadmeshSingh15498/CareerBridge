"""
Pydantic v2 Schemas for Student Profile, Academic Records, Skills, Projects, and Experience.
"""

from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# =============================================================================
# PERSONAL INFO SCHEMAS
# =============================================================================

class PersonalInfoUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone_number: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=2000)
    city: Optional[str] = Field(None, max_length=100)
    linkedin_url: Optional[str] = Field(None, max_length=255)
    github_url: Optional[str] = Field(None, max_length=255)
    portfolio_url: Optional[str] = Field(None, max_length=255)
    gender: Optional[str] = Field(None, max_length=30)


# =============================================================================
# ACADEMIC RECORD SCHEMAS
# =============================================================================

class AcademicRecordBase(BaseModel):
    institution_name: str = Field(..., min_length=2, max_length=255)
    degree: str = Field(..., min_length=2, max_length=100)
    department: str = Field(..., min_length=2, max_length=100)
    start_year: int = Field(..., ge=1990, le=2040)
    end_year: int = Field(..., ge=1990, le=2040)
    cgpa_or_percentage: float = Field(..., ge=0.0, le=100.0)
    backlogs_count: int = Field(default=0, ge=0)


class AcademicRecordCreate(AcademicRecordBase):
    pass


class AcademicRecordUpdate(BaseModel):
    institution_name: Optional[str] = None
    degree: Optional[str] = None
    department: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    cgpa_or_percentage: Optional[float] = None
    backlogs_count: Optional[int] = None


class AcademicRecordResponse(AcademicRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# SKILL SCHEMAS
# =============================================================================

class SkillAddRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: Optional[str] = "programming_language"
    proficiency_level: Optional[str] = "intermediate"  # beginner, intermediate, advanced, expert


class SkillResponse(BaseModel):
    id: int
    name: str
    category: str
    proficiency_level: str
    is_verified: bool

    class Config:
        from_attributes = True


# =============================================================================
# PROJECT SCHEMAS
# =============================================================================

class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=5, max_length=3000)
    technologies_used: List[str] = Field(default_factory=list)
    github_url: Optional[str] = None
    live_demo_url: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    technologies_used: Optional[List[str]] = None
    github_url: Optional[str] = None
    live_demo_url: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectResponse(BaseModel):
    id: str
    title: str
    description: str
    technologies_used: List[str]
    github_url: Optional[str]
    live_demo_url: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]

    class Config:
        from_attributes = True


# =============================================================================
# CERTIFICATION SCHEMAS
# =============================================================================

class CertificationCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    issuing_organization: str = Field(..., min_length=2, max_length=200)
    issue_date: date
    expiration_date: Optional[date] = None
    credential_url: Optional[str] = None


class CertificationResponse(BaseModel):
    id: str
    title: str
    issuing_organization: str
    issue_date: date
    expiration_date: Optional[date]
    credential_url: Optional[str]

    class Config:
        from_attributes = True


# =============================================================================
# EXPERIENCE SCHEMAS
# =============================================================================

class ExperienceCreate(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=200)
    role_title: str = Field(..., min_length=2, max_length=150)
    location: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    is_current: bool = False
    description: Optional[str] = None


class ExperienceUpdate(BaseModel):
    company_name: Optional[str] = None
    role_title: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    description: Optional[str] = None


class ExperienceResponse(BaseModel):
    id: str
    company_name: str
    role_title: str
    location: Optional[str]
    start_date: date
    end_date: Optional[date]
    is_current: bool
    description: Optional[str]

    class Config:
        from_attributes = True


# =============================================================================
# PROFILE COMPLETION BREAKDOWN (DETERMINISTIC)
# =============================================================================

class SectionCompletionScore(BaseModel):
    name: str
    score: int
    max_score: int
    status: str  # complete, partial, missing


class ProfileCompletionResponse(BaseModel):
    overall_percentage: int
    sections: List[SectionCompletionScore]
    missing_items: List[str]
    recommendations: List[str]


# =============================================================================
# FULL STUDENT PROFILE RESPONSE
# =============================================================================

class FullStudentProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    roll_number: str
    email: str
    phone_number: Optional[str]
    gender: Optional[str]
    bio: Optional[str]
    city: Optional[str]
    linkedin_url: Optional[str]
    github_url: Optional[str]
    portfolio_url: Optional[str]
    placement_status: str
    academic_records: List[AcademicRecordResponse]
    skills: List[SkillResponse]
    projects: List[ProjectResponse]
    certifications: List[CertificationResponse]
    experiences: List[ExperienceResponse]
    completion: ProfileCompletionResponse
    has_resume: bool
    active_resume_id: Optional[str] = None
    ats_score: Optional[int] = None

    class Config:
        from_attributes = True

