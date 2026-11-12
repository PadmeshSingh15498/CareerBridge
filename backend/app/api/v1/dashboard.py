from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import HTTPAuthorizationCredentials

from app.core.database import get_db
from app.core.permissions import security_scheme
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.schemas.dashboard import (
    StudentDashboardResponse,
    RecruiterDashboardResponse,
    AdminDashboardResponse
)
from app.services.dashboard_service import DashboardService

router = APIRouter()


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Extracts user if valid Bearer token provided, otherwise gracefully returns None.
    Allows demo inspection as well as authenticated access.
    """
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None


@router.get("/student", response_model=StudentDashboardResponse, summary="Get student workspace metrics")
def get_student_dashboard(
    demo: bool = False,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Returns personalized career intelligence for student workspace:
    Readiness index, resume health, applications, interviews, skill gaps, and roadmap.
    """
    target_user = None if demo else user
    return DashboardService.get_student_dashboard(db, target_user)


@router.get("/recruiter", response_model=RecruiterDashboardResponse, summary="Get recruiter workspace metrics")
def get_recruiter_dashboard(
    demo: bool = False,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Returns recruitment pipeline, job performance, applicants, and candidate matches.
    """
    target_user = None if demo else user
    return DashboardService.get_recruiter_dashboard(db, target_user)


@router.get("/admin", response_model=AdminDashboardResponse, summary="Get placement officer institutional metrics")
def get_admin_dashboard(
    db: Session = Depends(get_db),
):
    """
    Returns university-wide cohort placement metrics, department breakdowns, drives, and partner performance.
    """
    return DashboardService.get_admin_dashboard(db)

