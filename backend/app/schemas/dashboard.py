from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict


# Student Dashboard Schemas
class StudentReadinessBreakdown(BaseModel):
    resume_health: int
    skill_coverage: int
    interview_preparedness: int
    academic_eligibility: int
    model_config = ConfigDict(from_attributes=True)


class StudentProfileCompletion(BaseModel):
    percentage: int
    missing_items: List[str]
    model_config = ConfigDict(from_attributes=True)


class ResumeHealthInfo(BaseModel):
    ats_score: int
    sections_score: int
    skills_score: int
    metrics_score: int
    formatting_score: int
    actionable_tips: List[str]
    file_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class RecommendedJobItem(BaseModel):
    id: str
    title: str
    company_name: str
    company_logo: Optional[str] = None
    location: str
    workplace_type: str
    salary_range: str
    match_percentage: float
    deadline: str
    top_matching_skills: List[str]
    model_config = ConfigDict(from_attributes=True)


class ActiveApplicationItem(BaseModel):
    id: str
    job_id: str
    job_title: str
    company_name: str
    status: str
    composite_match_score: float
    applied_at: str
    model_config = ConfigDict(from_attributes=True)


class UpcomingInterviewItem(BaseModel):
    id: str
    company_name: str
    round_name: str
    scheduled_start: str
    interviewer_name: Optional[str] = None
    meeting_link: Optional[str] = None
    venue: Optional[str] = None
    status: str
    model_config = ConfigDict(from_attributes=True)


class SkillGapSummary(BaseModel):
    target_role: str
    readiness_percentage: float
    critical_missing_skills: List[str]
    secondary_missing_skills: List[str]
    verified_skills: List[str]
    summary: str
    model_config = ConfigDict(from_attributes=True)


class RoadmapMilestoneItem(BaseModel):
    week_number: int
    milestone_title: str
    description: str
    suggested_project: Optional[str] = None
    is_completed: bool
    model_config = ConfigDict(from_attributes=True)


class StudentRoadmapPreview(BaseModel):
    title: str
    target_role: str
    current_week: int
    total_weeks: int
    progress_percentage: int
    milestones: List[RoadmapMilestoneItem]
    model_config = ConfigDict(from_attributes=True)


class ActivityItem(BaseModel):
    id: str
    timestamp: str
    title: str
    description: str
    badge: str
    badge_variant: str  # lime, orange, neutral
    model_config = ConfigDict(from_attributes=True)


class StudentQuickStats(BaseModel):
    applications_count: int
    interviews_count: int
    offers_count: int
    verified_skills_count: int
    model_config = ConfigDict(from_attributes=True)


class StudentDashboardResponse(BaseModel):
    student_name: str
    email: str
    roll_number: str
    department: str
    institution: str
    cgpa: float
    placement_status: str
    career_readiness_score: int
    readiness_breakdown: StudentReadinessBreakdown
    profile_completion: StudentProfileCompletion
    resume_health: ResumeHealthInfo
    recommended_jobs: List[RecommendedJobItem]
    active_applications: List[ActiveApplicationItem]
    upcoming_interviews: List[UpcomingInterviewItem]
    skill_gap_summary: SkillGapSummary
    career_roadmap: StudentRoadmapPreview
    recent_activities: List[ActivityItem]
    quick_stats: StudentQuickStats
    is_demo: bool = False
    model_config = ConfigDict(from_attributes=True)


# Recruiter Dashboard Schemas
class RecruiterPipelineStages(BaseModel):
    applied: int
    screening: int
    shortlisted: int
    technical_round: int
    hr_round: int
    offered: int
    rejected: int
    model_config = ConfigDict(from_attributes=True)


class RecruiterStats(BaseModel):
    active_jobs_count: int
    total_applicants_count: int
    shortlisted_count: int
    interviews_scheduled_count: int
    offers_extended_count: int
    model_config = ConfigDict(from_attributes=True)


class RecruiterJobItem(BaseModel):
    id: str
    title: str
    job_type: str
    location: str
    workplace_type: str
    salary_range: str
    applicants_count: int
    vacancies: int
    status: str
    deadline: str
    model_config = ConfigDict(from_attributes=True)


class RecruiterApplicantItem(BaseModel):
    id: str
    candidate_name: str
    candidate_email: str
    candidate_department: str
    candidate_cgpa: float
    job_title: str
    composite_match_score: float
    current_status: str
    applied_at: str
    model_config = ConfigDict(from_attributes=True)


class JobPerformanceMetrics(BaseModel):
    total_views: int
    application_rate_percent: float
    shortlist_rate_percent: float
    interview_conversion_percent: float
    model_config = ConfigDict(from_attributes=True)


class CandidateMatchInsight(BaseModel):
    candidate_name: str
    job_title: str
    department: str
    cgpa: float
    match_score: float
    top_strengths: List[str]
    status: str
    model_config = ConfigDict(from_attributes=True)


class RecruiterDashboardResponse(BaseModel):
    recruiter_name: str
    company_name: str
    company_logo: Optional[str] = None
    designation: str
    stats: RecruiterStats
    pipeline: RecruiterPipelineStages
    active_jobs: List[RecruiterJobItem]
    recent_applications: List[RecruiterApplicantItem]
    job_performance: JobPerformanceMetrics
    candidate_matching_insights: List[CandidateMatchInsight]
    upcoming_interviews: List[UpcomingInterviewItem]
    is_demo: bool = False
    model_config = ConfigDict(from_attributes=True)


# Placement Officer (Admin / TPO) Dashboard Schemas
class AdminOverviewStats(BaseModel):
    total_students: int
    eligible_students: int
    placed_students: int
    unplaced_students: int
    placement_rate_percent: float
    active_companies: int
    active_job_openings: int
    total_applications: int
    average_package_lpa: float
    highest_package_lpa: float
    model_config = ConfigDict(from_attributes=True)


class DepartmentPlacementStat(BaseModel):
    department_name: str
    total_students: int
    placed_students: int
    unplaced_students: int
    placement_rate_percent: float
    average_cgpa: float
    model_config = ConfigDict(from_attributes=True)


class CompanyRecruitmentStat(BaseModel):
    company_name: str
    logo_url: Optional[str] = None
    industry: str
    openings_count: int
    hired_count: int
    average_ctc_lpa: float
    highest_ctc_lpa: float
    status: str
    model_config = ConfigDict(from_attributes=True)


class PlacementDriveItem(BaseModel):
    id: str
    title: str
    company_name: str
    drive_date: str
    registration_deadline: str
    min_cgpa: float
    allowed_departments: List[str]
    selection_rounds: List[str]
    venue: str
    status: str
    model_config = ConfigDict(from_attributes=True)


class PendingActionsOverview(BaseModel):
    pending_recruiters_count: int
    pending_jobs_count: int
    model_config = ConfigDict(from_attributes=True)


class AdminDashboardResponse(BaseModel):
    institution_name: str
    academic_year: int
    stats: AdminOverviewStats
    department_stats: List[DepartmentPlacementStat]
    company_recruitment: List[CompanyRecruitmentStat]
    placement_drives: List[PlacementDriveItem]
    pending_actions: PendingActionsOverview
    recent_activity: List[ActivityItem]
    is_demo: bool = False
    model_config = ConfigDict(from_attributes=True)

