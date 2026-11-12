from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class JobSkillInput(BaseModel):
    name: str
    is_mandatory: bool = True
    weight: float = 1.0


class JobEligibilityInput(BaseModel):
    min_cgpa: float = Field(0.0, ge=0.0, le=10.0)
    max_backlogs_allowed: int = Field(0, ge=0)
    allowed_grad_years: List[int] = Field(default_factory=list)
    allowed_departments: List[str] = Field(default_factory=list)
    gender_preference: str = "any"


class JobCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    job_type: str = "full_time"
    workplace_type: str = "on_site"
    location: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=15)
    requirements: Optional[str] = ""
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = "INR"
    vacancies: int = Field(1, ge=1)
    application_deadline: datetime
    skills: List[JobSkillInput] = Field(default_factory=list)
    eligibility: Optional[JobEligibilityInput] = None
    recruitment_process: Optional[List[str]] = Field(
        default_factory=lambda: ["Resume Screening", "Technical Interview", "HR Discussion"]
    )

    @field_validator("salary_max")
    @classmethod
    def validate_salary(cls, v, info):
        if v is not None and "salary_min" in info.data and info.data["salary_min"] is not None:
            if v < info.data["salary_min"]:
                raise ValueError("salary_max cannot be less than salary_min")
        return v


class JobUpdateRequest(BaseModel):
    title: Optional[str] = None
    job_type: Optional[str] = None
    workplace_type: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    vacancies: Optional[int] = None
    status: Optional[str] = None
    application_deadline: Optional[datetime] = None
    skills: Optional[List[JobSkillInput]] = None
    eligibility: Optional[JobEligibilityInput] = None


class JobSkillResponse(BaseModel):
    id: Optional[int] = None
    name: str
    category: Optional[str] = None
    is_mandatory: bool = True
    weight: float = 1.0


class JobEligibilityResponse(BaseModel):
    min_cgpa: float
    max_backlogs_allowed: int
    allowed_grad_years: List[int]
    allowed_departments: List[str]
    gender_preference: str


class CompanySummaryResponse(BaseModel):
    id: str
    name: str
    website_url: str
    industry: str
    company_size: str
    headquarters: Optional[str] = None
    logo_url: Optional[str] = None
    is_verified: bool


class JobItemResponse(BaseModel):
    id: str
    title: str
    company: CompanySummaryResponse
    job_type: str
    workplace_type: str
    location: str
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = "INR"
    vacancies: int
    status: str
    application_deadline: datetime
    created_at: datetime
    skills: List[JobSkillResponse] = []
    eligibility: Optional[JobEligibilityResponse] = None
    match_score: Optional[float] = None
    is_eligible: Optional[bool] = None
    is_saved: bool = False
    has_applied: bool = False
    application_status: Optional[str] = None
    applicants_count: int = 0


class JobDetailResponse(JobItemResponse):
    description: str
    requirements: str
    posted_by_name: Optional[str] = None
    recruitment_process: List[str] = []
    match_breakdown: Optional[Dict[str, Any]] = None

