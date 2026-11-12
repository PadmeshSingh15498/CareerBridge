"""
REST API Router for Recruiter Workspace & Candidate Intelligence.
Company Profile, Requisition Workflow, Verification Gating, Candidate Dossiers,
Advisory Match Engine, Private Recruiter Notes, and Interview Rubrics.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.schemas.common import APIResponse
from app.schemas.recruiter import (
    CompanyProfileUpdateRequest, CompanyProfileResponse,
    RecruiterDashboardMetrics, JobDescriptionGenerateRequest,
    JobDescriptionGenerateResponse, CandidateFilterRequest,
    ApplicationStageAdvanceRequest, RecruiterNotesUpdateRequest,
    CandidateInterviewScheduleRequest, InterviewFeedbackCreateRequest
)
from app.schemas.job import JobCreateRequest
from app.services.recruiter_service import RecruiterService
from app.ai.job_desc_generator import generate_job_description

router = APIRouter(prefix="/recruiter", tags=["Recruiter Workspace & Candidate Intelligence"])


# =============================================================================
# 1. COMPANY PROFILE
# =============================================================================

@router.get("/company", response_model=APIResponse[Dict[str, Any]])
def get_company_profile(
    company_id: Optional[str] = Query(None, description="Optional company ID for admins"),
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """Retrieves organization profile, verification status, and team summary."""
    profile = RecruiterService.get_company_profile(db, current_user, company_id)
    return APIResponse(
        success=True,
        message="Company profile retrieved successfully",
        data=profile
    )


@router.put("/company", response_model=APIResponse[Dict[str, Any]])
def update_company_profile(
    payload: CompanyProfileUpdateRequest,
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """Updates company profile attributes."""
    profile = RecruiterService.update_company_profile(db, current_user, payload)
    return APIResponse(
        success=True,
        message="Company profile updated successfully",
        data=profile
    )


# =============================================================================
# 2. RECRUITER DASHBOARD METRICS
# =============================================================================

@router.get("/dashboard/metrics", response_model=APIResponse[Dict[str, Any]])
def get_dashboard_metrics(
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """Returns actual database metrics for the recruiter dashboard."""
    metrics = RecruiterService.get_dashboard_metrics(db, current_user)
    return APIResponse(
        success=True,
        message="Dashboard metrics calculated successfully",
        data=metrics
    )


# =============================================================================
# 3. AI-ASSISTED JOB DESCRIPTION GENERATOR & JOB MANAGEMENT
# =============================================================================

@router.post("/jobs/generate-description", response_model=APIResponse[Dict[str, Any]])
def generate_ai_job_description(
    payload: JobDescriptionGenerateRequest,
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"]))
):
    """
    AI-Assisted Job Description Generator.
    Recruiters must review and approve generated content prior to requisition submission.
    """
    generated = generate_job_description(
        job_title=payload.job_title,
        industry=payload.industry,
        experience_level=payload.experience_level,
        workplace_type=payload.workplace_type,
        core_skills=payload.core_skills,
        key_responsibilities=payload.key_responsibilities,
        company_context=payload.company_context
    )
    return APIResponse(
        success=True,
        message="AI job requisition generated. Please review and customize before publishing.",
        data=generated
    )


@router.get("/jobs", response_model=APIResponse[List[Dict[str, Any]]])
def list_company_jobs(
    status: Optional[str] = Query(None, description="Filter by active, draft, paused, closed"),
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """Lists all requisitions for the authenticated recruiter's company."""
    jobs = RecruiterService.list_recruiter_jobs(db, current_user, status)
    return APIResponse(
        success=True,
        message=f"Retrieved {len(jobs)} company requisitions",
        data=jobs
    )


@router.post("/jobs", response_model=APIResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreateRequest,
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """
    Creates a job requisition with verification gating.
    Unverified recruiters are routed to PENDING_APPROVAL for university TPO signoff.
    """
    detail = RecruiterService.create_job(db, current_user, payload)
    return APIResponse(
        success=True,
        message=f"Job posting '{detail.get('title')}' created successfully",
        data=detail
    )


@router.put("/jobs/{job_id}/status", response_model=APIResponse[Dict[str, Any]])
def update_job_status(
    job_id: str,
    new_status: str = Query(..., description="active, paused, closed, draft"),
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """Updates job lifecycle status (active, paused, closed, draft) with verification check."""
    result = RecruiterService.update_job_status(db, current_user, job_id, new_status)
    return APIResponse(
        success=True,
        message=f"Requisition status set to {result['status']}",
        data=result
    )


# =============================================================================
# 4. CANDIDATE MANAGEMENT & INTELLIGENCE
# =============================================================================

@router.get("/candidates", response_model=APIResponse[Dict[str, Any]])
def list_candidates(
    job_id: Optional[str] = Query(None, description="Filter by job requisition ID"),
    skill: Optional[str] = Query(None, description="Filter by technical skill"),
    min_cgpa: Optional[float] = Query(None, ge=0.0, le=10.0, description="Minimum CGPA filter"),
    degree: Optional[str] = Query(None, description="Degree filter e.g. B.Tech"),
    department: Optional[str] = Query(None, description="Department filter e.g. Computer Science"),
    graduation_year: Optional[int] = Query(None, description="Batch graduation year"),
    status: Optional[str] = Query(None, description="Application status filter"),
    search: Optional[str] = Query(None, description="Candidate name or roll number"),
    sort_by: str = Query("match_score", description="match_score, applied_at, cgpa"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """
    Candidate Management Pipeline with multi-attribute filtering.
    Calculates advisory AI compatibility score without auto-rejections.
    Restricted to candidates who applied to the recruiter's company requisitions.
    """
    filters = CandidateFilterRequest(
        job_id=job_id,
        skill=skill,
        min_cgpa=min_cgpa,
        degree=degree,
        department=department,
        graduation_year=graduation_year,
        status=status,
        search=search,
        sort_by=sort_by
    )
    result = RecruiterService.list_candidates(db, current_user, filters, page, page_size)
    return APIResponse(
        success=True,
        message=f"Retrieved {len(result['items'])} candidates",
        data=result
    )


@router.get("/candidates/{application_id}", response_model=APIResponse[Dict[str, Any]])
def get_candidate_application_detail(
    application_id: str,
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """
    Detailed candidate application dossier:
    Student profile, PyMuPDF ATS resume analysis, advisory AI compatibility breakdown,
    private internal recruiter notes, and interview status.
    """
    detail = RecruiterService.get_candidate_application_detail(db, current_user, application_id)
    return APIResponse(
        success=True,
        message="Candidate application dossier retrieved",
        data=detail
    )


# =============================================================================
# 5. WORKFLOW, STAGE TRANSITIONS, NOTES & INTERVIEW RUBRICS
# =============================================================================

@router.patch("/applications/{application_id}/stage", response_model=APIResponse[Dict[str, Any]])
def advance_application_stage(
    application_id: str,
    payload: ApplicationStageAdvanceRequest,
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """
    Advances candidate stage (screening, shortlisted, technical_round, hr_round, offered, rejected).
    Records immutable status history and alerts student.
    """
    result = RecruiterService.advance_application_stage(db, current_user, application_id, payload)
    return APIResponse(
        success=True,
        message=f"Candidate stage moved to {result['new_status']}",
        data=result
    )


@router.post("/applications/{application_id}/notes", response_model=APIResponse[Dict[str, Any]])
def update_recruiter_notes(
    application_id: str,
    payload: RecruiterNotesUpdateRequest,
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """
    Saves private internal recruiter notes for a candidate application.
    These notes are strictly confidential and never exposed to the student.
    """
    result = RecruiterService.update_recruiter_notes(db, current_user, application_id, payload.notes)
    return APIResponse(
        success=True,
        message="Recruiter private notes saved",
        data=result
    )


@router.post("/applications/{application_id}/schedule-interview", response_model=APIResponse[Dict[str, Any]])
def schedule_candidate_interview(
    application_id: str,
    payload: CandidateInterviewScheduleRequest,
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """
    Schedules an interview round (virtual/in-person/phone) with meeting links and instructions.
    Automatically notifies the student.
    """
    result = RecruiterService.schedule_candidate_interview(db, current_user, application_id, payload)
    return APIResponse(
        success=True,
        message=f"Interview '{result['round_name']}' scheduled successfully",
        data=result
    )


@router.post("/interviews/{interview_id}/feedback", response_model=APIResponse[Dict[str, Any]])
def record_interview_feedback(
    interview_id: str,
    payload: InterviewFeedbackCreateRequest,
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """
    Records interview assessment rubric (technical, communication, problem solving, recommendation).
    Marks interview status as completed.
    """
    result = RecruiterService.record_interview_feedback(db, current_user, interview_id, payload)
    return APIResponse(
        success=True,
        message="Interview feedback rubric submitted successfully",
        data=result
    )
