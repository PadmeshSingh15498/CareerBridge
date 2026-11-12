"""
REST API Router for Application Submissions, Candidate Pipeline, Status Transitions, and Interviews.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.schemas.application import (
    ApplicationCreateRequest, ApplicationStatusUpdateRequest,
    ApplicationWithdrawRequest, InterviewScheduleRequest, ApplicationResponse
)
from app.schemas.common import APIResponse
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["Application Management & Pipeline"])


@router.post("/apply", response_model=APIResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
def apply_to_job(
    payload: ApplicationCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Submits a student job application.
    Enforces deadline, duplicate prevention, and institutional academic eligibility gating.
    Computes candidate AI match score for recruiter ranking.
    """
    app_result = ApplicationService.apply_to_job(db, current_user, payload)
    return APIResponse(
        success=True,
        message=f"Application for '{app_result.get('job_title')}' submitted successfully!",
        data=app_result
    )


@router.get("/my", response_model=APIResponse[List[Dict[str, Any]]])
def get_my_applications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieves all job applications submitted by the logged-in student."""
    apps = ApplicationService.get_student_applications(db, current_user)
    return APIResponse(
        success=True,
        message="Student applications retrieved successfully",
        data=apps
    )


@router.get("/recruiter", response_model=APIResponse[List[Dict[str, Any]]])
def get_recruiter_applications(
    job_id: Optional[str] = Query(None, description="Optional job ID filter"),
    status: Optional[str] = Query(None, description="Optional status filter"),
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """
    Retrieves candidate applications for recruiter's company or placement officer,
    ordered by AI Composite Match Score descending.
    """
    apps = ApplicationService.get_recruiter_applications(
        db=db,
        recruiter_user=current_user,
        job_id=job_id,
        status_filter=status
    )
    return APIResponse(
        success=True,
        message=f"Retrieved {len(apps)} candidate applications",
        data=apps
    )


@router.put("/{application_id}/status", response_model=APIResponse[Dict[str, Any]])
def update_application_status(
    application_id: str,
    payload: ApplicationStatusUpdateRequest,
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """
    Advances candidate official pipeline status (screening, shortlisted, technical_round, hr_round, offered, rejected).
    Records audit entry in application_status_history and notifies candidate.
    """
    updated_app = ApplicationService.update_application_status(
        db=db,
        current_user=current_user,
        application_id=application_id,
        payload=payload
    )
    return APIResponse(
        success=True,
        message=f"Application moved to status: {updated_app.get('current_status')}",
        data=updated_app
    )


@router.post("/{application_id}/withdraw", response_model=APIResponse[Dict[str, Any]])
def withdraw_application(
    application_id: str,
    payload: ApplicationWithdrawRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Allows student to voluntarily withdraw their application."""
    app_res = ApplicationService.withdraw_application(db, current_user, application_id, payload)
    return APIResponse(
        success=True,
        message="Application successfully withdrawn",
        data=app_res
    )


@router.post("/{application_id}/schedule-interview", response_model=APIResponse[Dict[str, Any]])
def schedule_interview(
    application_id: str,
    payload: InterviewScheduleRequest,
    current_user: User = Depends(require_roles(["recruiter", "admin", "tpo"])),
    db: Session = Depends(get_db)
):
    """Schedules an interview round for an applicant, saves record, and dispatches student alert."""
    app_res = ApplicationService.schedule_interview(db, current_user, application_id, payload)
    return APIResponse(
        success=True,
        message=f"Interview '{payload.round_name}' successfully scheduled",
        data=app_res
    )

