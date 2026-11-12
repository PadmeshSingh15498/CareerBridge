"""
REST API Router for Job Discovery, Search, Filtering, Bookmarking, and Requisition Management.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import (
    get_current_active_user, get_optional_current_user, require_roles
)
from app.models.user import User, UserRole
from app.schemas.job import (
    JobCreateRequest, JobUpdateRequest, JobItemResponse, JobDetailResponse
)
from app.schemas.common import APIResponse
from app.services.job_service import JobService
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/jobs", tags=["Job Discovery & Requisition Management"])


@router.get("", response_model=APIResponse[Dict[str, Any]])
def list_jobs(
    search: Optional[str] = Query(None, description="Search keyword in title, company, description"),
    job_type: Optional[str] = Query(None, description="full_time, internship, intern_to_fte"),
    workplace_type: Optional[str] = Query(None, description="on_site, hybrid, remote"),
    location: Optional[str] = Query(None, description="City or region filter"),
    min_salary: Optional[float] = Query(None, description="Minimum CTC filter"),
    department: Optional[str] = Query(None, description="Allowed academic department filter"),
    skill: Optional[str] = Query(None, description="Skill filter"),
    status: Optional[str] = Query(None, description="Status filter (recruiters/admins)"),
    saved_only: bool = Query(False, description="Filter only bookmarked jobs for student"),
    sort_by: str = Query("newest", description="newest, match_score, salary, deadline"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Discovers campus and enterprise job openings.
    Includes dense AI compatibility scoring and eligibility checks for authenticated students.
    """
    result = JobService.get_jobs(
        db=db,
        current_user=current_user,
        search=search,
        job_type=job_type,
        workplace_type=workplace_type,
        location=location,
        min_salary=min_salary,
        department=department,
        skill=skill,
        status_filter=status,
        saved_only=saved_only,
        sort_by=sort_by,
        page=page,
        page_size=page_size
    )
    return APIResponse(
        success=True,
        message="Jobs retrieved successfully",
        data=result
    )


@router.get("/saved/all", response_model=APIResponse[Dict[str, Any]])
def get_saved_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieves all bookmarked opportunities for the authenticated student."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can view saved jobs")

    result = JobService.get_jobs(
        db=db,
        current_user=current_user,
        saved_only=True,
        page=page,
        page_size=page_size
    )
    return APIResponse(
        success=True,
        message="Saved jobs retrieved successfully",
        data=result
    )


@router.get("/recommendations/radar", response_model=APIResponse[Dict[str, Any]])
def get_opportunity_radar(
    category: Optional[str] = Query(None, description="Filter: all, excellent, good, skill_gap, ineligible, eligible_only"),
    min_score: Optional[int] = Query(None, ge=0, le=100, description="Minimum match score threshold (0-100)"),
    workplace_type: Optional[str] = Query(None, description="on_site, hybrid, remote"),
    location: Optional[str] = Query(None, description="Location search query"),
    sort_by: str = Query("match_score", description="match_score, newest, salary, deadline"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Intelligent Job Matching & Recommendation Engine (Opportunity Radar).
    Ranks campus opportunities using Python-based exact and weighted skill matching,
    Sentence Transformer / TF-IDF semantic cosine similarity, project & experience evidence,
    and hard academic eligibility gating.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Opportunity Radar is tailored for student profiles.")

    radar_data = RecommendationService.get_opportunity_radar(
        db=db,
        current_user=current_user,
        category=category,
        min_score=min_score,
        workplace_type=workplace_type,
        location=location,
        sort_by=sort_by,
        limit=limit
    )

    return APIResponse(
        success=True,
        message="Opportunity Radar recommendations generated successfully",
        data=radar_data
    )


@router.get("/recommendations/benchmark", response_model=APIResponse[Dict[str, Any]])
def get_model_benchmark_evaluation():
    """
    Runs model evaluation across synthetic student archetypes and job requisitions.
    Reports Ranking Consistency, Precision@K, and Eligibility Accuracy without LLM calls.
    """
    metrics = RecommendationService.get_synthetic_benchmark()
    return APIResponse(
        success=True,
        message="Synthetic matching evaluation completed successfully",
        data=metrics
    )


@router.get("/{job_id}/radar-match", response_model=APIResponse[Dict[str, Any]])
def get_job_radar_match(
    job_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves detailed mathematical match breakdown for a specific job against the student.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Match details only available for students.")

    match_detail = RecommendationService.get_job_radar_match(db, current_user, job_id)
    return APIResponse(
        success=True,
        message="Detailed job match evaluation retrieved",
        data=match_detail
    )


@router.get("/{job_id}", response_model=APIResponse[Dict[str, Any]])
def get_job_detail(
    job_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns full job description, company profile, skill requirements,
    eligibility criteria, and personalized AI match breakdown.
    """
    job_detail = JobService.get_job_detail(db, job_id, current_user)
    return APIResponse(
        success=True,
        message="Job detail retrieved successfully",
        data=job_detail
    )


@router.post("", response_model=APIResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreateRequest,
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """
    Creates a new job posting.
    Recruiter postings are placed into PENDING_APPROVAL status for TPO review.
    TPO / Admin postings are published immediately.
    """
    job = JobService.create_job(db, current_user, payload)
    detail = JobService.get_job_detail(db, job.id, current_user)
    return APIResponse(
        success=True,
        message=f"Job posting '{job.title}' created with status '{job.status.value}'",
        data=detail
    )


@router.post("/{job_id}/save", response_model=APIResponse[Dict[str, Any]])
def toggle_save_job(
    job_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Toggles bookmarking of a job for the authenticated student."""
    is_saved = JobService.toggle_save_job(db, current_user, job_id)
    msg = "Job saved to your bookmarks" if is_saved else "Job removed from your bookmarks"
    return APIResponse(
        success=True,
        message=msg,
        data={"job_id": job_id, "is_saved": is_saved}
    )


@router.put("/{job_id}/approve", response_model=APIResponse[Dict[str, Any]])
def approve_job_posting(
    job_id: str,
    approved: bool = Query(True, description="True to approve, False to decline"),
    current_user: User = Depends(require_roles(["admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """Placement Officer or Administrator approves or declines a pending job requisition."""
    job = JobService.approve_job(db, current_user, job_id, approved)
    return APIResponse(
        success=True,
        message=f"Job '{job.title}' status updated to {job.status.value}",
        data={"job_id": job.id, "status": job.status.value}
    )


@router.put("/{job_id}/status", response_model=APIResponse[Dict[str, Any]])
def update_job_status(
    job_id: str,
    new_status: str = Query(..., description="active, closed, draft"),
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """Recruiter or Placement Officer closes, opens, or drafts a job opening."""
    job = JobService.update_job_status(db, current_user, job_id, new_status)
    return APIResponse(
        success=True,
        message=f"Job status successfully updated to {job.status.value}",
        data={"job_id": job.id, "status": job.status.value}
    )

