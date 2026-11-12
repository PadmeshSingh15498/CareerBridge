from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field


class MetricDefinitionItem(BaseModel):
    label: str
    formula: str
    description: str


class AdminDashboardMetricsResponse(BaseModel):
    total_registered_students: int
    eligible_students: int
    placed_students: int
    unplaced_students: int
    active_recruiters: int
    active_jobs: int
    total_applications: int
    interviews_scheduled: int
    placement_percentage: float
    metric_definitions: Dict[str, MetricDefinitionItem]
    pending_companies_count: int
    pending_jobs_count: int
    recent_activities: List[Dict[str, Any]]


class AcademicRecordSummary(BaseModel):
    institution_name: str
    degree: str
    department: str
    start_year: int
    end_year: int
    cgpa_or_percentage: float
    backlogs_count: int


class StudentListItem(BaseModel):
    id: str
    user_id: str
    full_name: str
    roll_number: str
    email: str
    phone_number: Optional[str] = None
    city: Optional[str] = None
    placement_status: str
    is_verified: bool
    is_active: bool
    created_at: datetime
    academic_record: Optional[AcademicRecordSummary] = None
    skills: List[str] = []
    resumes_count: int = 0
    applications_count: int = 0


class StudentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    students: List[StudentListItem]


class StudentStatusUpdateRequest(BaseModel):
    is_verified: Optional[bool] = None
    is_active: Optional[bool] = None
    placement_status: Optional[str] = None


class StudentCSVImportResult(BaseModel):
    total_rows: int
    imported_count: int
    duplicates_skipped: int
    duplicate_details: List[str]
    errors: List[str]


class RecruiterCompanyItem(BaseModel):
    id: str
    name: str
    website_url: str
    industry: str
    company_size: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    hr_contact_name: Optional[str] = None
    hr_contact_email: Optional[str] = None
    hr_contact_phone: Optional[str] = None
    verification_status: str
    is_verified: bool
    active_jobs_count: int
    total_hires_count: int
    recruiter_name: Optional[str] = None
    recruiter_email: Optional[str] = None
    created_at: datetime


class RecruiterActionRequest(BaseModel):
    action: str = Field(..., description="approve | reject | suspend | reactivate")
    reason: Optional[str] = None


class AdminJobItem(BaseModel):
    id: str
    title: str
    company_id: str
    company_name: str
    company_logo: Optional[str] = None
    job_type: str
    workplace_type: str
    location: str
    vacancies: int
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = "INR"
    status: str
    application_deadline: datetime
    created_at: datetime
    poster_name: Optional[str] = None
    poster_email: Optional[str] = None
    applicants_count: int = 0
    required_skills: List[str] = []


class JobApprovalActionRequest(BaseModel):
    action: str = Field(..., description="approve | reject | request_correction | close")
    comments: Optional[str] = None


class PlacementDriveCreateRequest(BaseModel):
    title: str
    company_id: str
    academic_year: int
    drive_date: date
    registration_deadline: datetime
    min_cgpa: float = 6.0
    max_backlogs_allowed: int = 0
    number_of_openings: int = 10
    job_roles: List[str]
    allowed_departments: List[str]
    selection_rounds: List[str]
    venue: str


class PlacementDriveUpdateRequest(BaseModel):
    title: Optional[str] = None
    academic_year: Optional[int] = None
    drive_date: Optional[date] = None
    registration_deadline: Optional[datetime] = None
    min_cgpa: Optional[float] = None
    max_backlogs_allowed: Optional[int] = None
    number_of_openings: Optional[int] = None
    job_roles: Optional[List[str]] = None
    allowed_departments: Optional[List[str]] = None
    selection_rounds: Optional[List[str]] = None
    venue: Optional[str] = None
    status: Optional[str] = None


class PlacementDriveDetailResponse(BaseModel):
    id: str
    company_id: str
    company_name: str
    company_logo: Optional[str] = None
    title: str
    academic_year: int
    drive_date: date
    registration_deadline: datetime
    min_cgpa: float
    max_backlogs_allowed: int
    number_of_openings: int
    job_roles: List[str]
    allowed_departments: List[str]
    selection_rounds: List[str]
    venue: str
    status: str
    registered_count: int
    eligible_count: int


class EligibleStudentItem(BaseModel):
    student_id: str
    full_name: str
    roll_number: str
    email: str
    department: str
    degree: str
    graduation_year: int
    cgpa: float
    backlogs_count: int
    placement_status: str
    is_registered: bool


class DepartmentPlacementMetric(BaseModel):
    department_name: str
    total_students: int
    eligible_students: int
    placed_students: int
    unplaced_students: int
    placement_rate_percent: float
    average_cgpa: float


class CompanyPlacementMetric(BaseModel):
    company_name: str
    industry: str
    openings_count: int
    hired_count: int
    average_ctc_lpa: float
    highest_ctc_lpa: float


class MonthlyTrendMetric(BaseModel):
    month_label: str
    applications_count: int
    selections_count: int


class SalaryBracketMetric(BaseModel):
    bracket_label: str
    student_count: int
    percentage: float


class FunnelConversionMetric(BaseModel):
    total_applications: int
    shortlisted_candidates: int
    interviewed_candidates: int
    selected_offers: int
    application_to_shortlist_pct: float
    shortlist_to_selection_pct: float


class ReadinessDistributionMetric(BaseModel):
    tier_name: str
    student_count: int
    percentage: float
    description: str


class InDemandSkillMetric(BaseModel):
    skill_name: str
    job_count: int
    category: str


class PlacementAnalyticsResponse(BaseModel):
    academic_year: int
    department_placements: List[DepartmentPlacementMetric]
    company_placements: List[CompanyPlacementMetric]
    monthly_trends: List[MonthlyTrendMetric]
    salary_distribution: List[SalaryBracketMetric]
    funnel_conversion: FunnelConversionMetric
    readiness_distribution: List[ReadinessDistributionMetric]
    in_demand_skills: List[InDemandSkillMetric]


class AuditLogItem(BaseModel):
    id: int
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details_json: Optional[Dict[str, Any]] = None
    timestamp: datetime

