"""
Pydantic Schemas for Recruiter Workspace, Company Profiles,
AI Job Description Generator, Candidate Intelligence, and Interview Workflows.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, EmailStr


class CompanyProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    website_url: Optional[str] = Field(None, max_length=255)
    industry: Optional[str] = Field(None, max_length=100)
    company_size: Optional[str] = Field(None, max_length=50)
    headquarters: Optional[str] = Field(None, max_length=150)
    logo_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    hr_contact_name: Optional[str] = Field(None, max_length=150)
    hr_contact_email: Optional[str] = Field(None, max_length=255)
    hr_contact_phone: Optional[str] = Field(None, max_length=50)


class CompanyProfileResponse(BaseModel):
    id: str
    name: str
    website_url: str
    industry: str
    company_size: str
    headquarters: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    hr_contact_name: Optional[str] = None
    hr_contact_email: Optional[str] = None
    hr_contact_phone: Optional[str] = None
    is_verified: bool
    verification_status: str
    created_at: datetime
    can_publish_jobs: bool
    recruiters_count: int = 1


class RecruiterDashboardMetrics(BaseModel):
    active_jobs_count: int
    total_applications_count: int
    shortlisted_candidates_count: int
    interviews_scheduled_count: int
    selected_candidates_count: int
    is_company_verified: bool
    verification_status: str
    pipeline_breakdown: Dict[str, int]
    recent_applications: List[Dict[str, Any]]
    active_requisitions: List[Dict[str, Any]]


class JobDescriptionGenerateRequest(BaseModel):
    job_title: str = Field(..., min_length=2, max_length=150)
    industry: Optional[str] = "Technology & Software"
    experience_level: Optional[str] = "Entry Level / Campus Grad"
    workplace_type: Optional[str] = "Hybrid"
    core_skills: List[str] = Field(default_factory=list)
    key_responsibilities: Optional[str] = None
    company_context: Optional[str] = None


class JobDescriptionGenerateResponse(BaseModel):
    job_title: str
    summary: str
    responsibilities: List[str]
    qualifications: List[str]
    preferred_qualifications: List[str]
    benefits_culture: List[str]
    suggested_skills: List[str]
    formatted_description: str
    formatted_requirements: str


class CandidateFilterRequest(BaseModel):
    job_id: Optional[str] = None
    skill: Optional[str] = None
    min_cgpa: Optional[float] = None
    degree: Optional[str] = None
    department: Optional[str] = None
    graduation_year: Optional[int] = None
    status: Optional[str] = None
    search: Optional[str] = None
    sort_by: str = "match_score"  # match_score, applied_at, cgpa


class CandidateListItem(BaseModel):
    application_id: str
    job_id: str
    job_title: str
    student_id: str
    full_name: str
    email: Optional[str] = None
    roll_number: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    department: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = None
    backlogs: int = 0
    skills: List[str] = []
    projects_count: int = 0
    experience_count: int = 0
    resume_id: str
    resume_file_url: Optional[str] = None
    current_status: str
    composite_match_score: float
    advisory_recommendation: str  # Excellent, Strong, Moderate, Exploratory
    is_academically_eligible: bool
    has_recruiter_notes: bool = False
    applied_at: datetime


class ApplicationStageAdvanceRequest(BaseModel):
    new_status: str = Field(..., min_length=2, max_length=50)
    change_reason: Optional[str] = Field(None, max_length=255)
    internal_notes: Optional[str] = None


class RecruiterNotesUpdateRequest(BaseModel):
    notes: str


class CandidateInterviewScheduleRequest(BaseModel):
    round_name: str = Field(..., min_length=2, max_length=100)
    scheduled_start: datetime
    scheduled_end: datetime
    interview_mode: str = Field("virtual", max_length=50)  # virtual, in_person, phone
    meeting_link: Optional[str] = None
    venue: Optional[str] = None
    interviewer_name: Optional[str] = None
    instructions: Optional[str] = None


class InterviewFeedbackCreateRequest(BaseModel):
    technical_rating: int = Field(..., ge=1, le=5)
    communication_rating: int = Field(..., ge=1, le=5)
    problem_solving_rating: int = Field(..., ge=1, le=5)
    recommendation: str = Field(..., max_length=50)  # strong_hire, hire, borderline, no_hire
    detailed_notes: Optional[str] = None
