"""
Career Intelligence & Roadmap REST API Endpoints for CareerBridge.
Provides target role discovery, skill gap evaluation, interactive roadmaps,
milestone progress updates, and transparent Career Readiness Index calculations.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_active_user, get_optional_current_user
from app.models.user import User, UserRole
from app.models.student import StudentProfile
from app.schemas.common import APIResponse
from app.services.career_intelligence_service import CareerIntelligenceService

router = APIRouter(prefix="/career-intelligence", tags=["AI Career Intelligence & Roadmaps"])


# Request Schemas
class SkillGapRequest(BaseModel):
    target_role: str = Field(..., description="Canonical or custom target role name")


class RoadmapGenerateRequest(BaseModel):
    target_role: str = Field(..., description="Canonical or custom target role name")
    force_regenerate: bool = Field(False, description="Whether to regenerate an existing active roadmap")


class MilestoneUpdateRequest(BaseModel):
    status: Optional[str] = Field(None, description="'not_started', 'in_progress', 'completed'")
    notes: Optional[str] = Field(None, description="Student learning or conceptual notes")
    evidence_url: Optional[str] = Field(None, description="GitHub URL or live project demo link")
    evidence_notes: Optional[str] = Field(None, description="Description of what was implemented")
    is_completed: Optional[bool] = Field(None, description="Toggle completed status")


class CustomRoleCreateRequest(BaseModel):
    role_name: str = Field(..., min_length=2, max_length=150)
    skills: List[str] = Field(default_factory=list, description="List of required technical skills")


def _resolve_student_id(current_user: Optional[User], db: Session) -> str:
    """Resolves student_id from current authenticated user, or defaults to first student."""
    if current_user and current_user.role == UserRole.STUDENT:
        student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if student:
            return student.id

    # Fallback to demo student or first student profile for testing / demo
    demo_user = db.query(User).filter(User.email == "student@careerbridge.com").first()
    if demo_user:
        student = db.query(StudentProfile).filter(StudentProfile.user_id == demo_user.id).first()
        if student:
            return student.id

    first_student = db.query(StudentProfile).first()
    if first_student:
        return first_student.id

    raise HTTPException(status_code=404, detail="No student profile found in database.")


# 1. Target Roles
@router.get("/roles", response_model=APIResponse[List[Dict[str, Any]]])
def list_target_roles(
    category: Optional[str] = Query(None, description="Filter roles by category"),
    db: Session = Depends(get_db)
):
    """Lists all curated and custom target career roles with competency counts."""
    category_filter = category if isinstance(category, str) else None
    roles = CareerIntelligenceService.list_target_roles(db, category=category_filter)
    return APIResponse(
        success=True,
        data=roles,
        message="Target career roles retrieved successfully."
    )


@router.get("/roles/{role_name}", response_model=APIResponse[Dict[str, Any]])
def get_target_role_detail(
    role_name: str,
    db: Session = Depends(get_db)
):
    """Retrieves exhaustive core/preferred skills and 6-stage curriculum for a target role."""
    detail = CareerIntelligenceService.get_target_role_detail(db, role_name)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Target role '{role_name}' not found.")
    return APIResponse(
        success=True,
        data=detail,
        message=f"Target role profile for '{role_name}' retrieved successfully."
    )


@router.post("/roles", response_model=APIResponse[Dict[str, Any]])
def create_custom_target_role(
    payload: CustomRoleCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Allows creating or synthesizing a custom career target role."""
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.OFFICER]
    created = CareerIntelligenceService.create_custom_target_role(
        db, payload.role_name, payload.skills, is_admin=is_admin
    )
    return APIResponse(
        success=True,
        data=created,
        message=f"Custom career role '{payload.role_name}' synthesized successfully."
    )


# 2. Skill Gap Analysis
@router.post("/skill-gap/analyze", response_model=APIResponse[Dict[str, Any]])
def analyze_skill_gap(
    payload: SkillGapRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Evaluates student profile against target role requirements.
    Categorizes skills into Proficient, Needs Improvement, Not Yet Learned, and Unknown.
    """
    student_id = _resolve_student_id(current_user, db)
    gap_result = CareerIntelligenceService.analyze_skill_gap(db, student_id, payload.target_role)
    return APIResponse(
        success=True,
        data=gap_result,
        message=f"Skill gap evaluated against '{payload.target_role}'."
    )


@router.get("/skill-gap/latest", response_model=APIResponse[Dict[str, Any]])
def get_latest_skill_gap(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves student's most recent skill gap analysis."""
    student_id = _resolve_student_id(current_user, db)
    latest = CareerIntelligenceService.get_latest_skill_gap(db, student_id)
    return APIResponse(
        success=True,
        data=latest,
        message="Latest skill gap analysis retrieved."
    )


# 3. Personalized Career Roadmaps
@router.post("/roadmap/generate", response_model=APIResponse[Dict[str, Any]])
def generate_roadmap(
    payload: RoadmapGenerateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Generates or refreshes a personalized 6-stage career roadmap."""
    student_id = _resolve_student_id(current_user, db)
    roadmap = CareerIntelligenceService.generate_or_get_roadmap(
        db, student_id, payload.target_role, force_regenerate=payload.force_regenerate
    )
    return APIResponse(
        success=True,
        data=roadmap,
        message="Personalized career roadmap generated successfully."
    )


@router.get("/roadmap/active", response_model=APIResponse[Dict[str, Any]])
def get_active_roadmap(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves active career roadmap with milestone items, resources, and progress."""
    student_id = _resolve_student_id(current_user, db)
    roadmap = CareerIntelligenceService.get_active_roadmap(db, student_id)
    return APIResponse(
        success=True,
        data=roadmap,
        message="Active career roadmap retrieved."
    )


@router.patch("/roadmap/items/{item_id}", response_model=APIResponse[Dict[str, Any]])
def update_milestone_item(
    item_id: int,
    payload: MilestoneUpdateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates milestone progress, notes, or submits project proof-of-work evidence.
    Rigor enforcement: does not automatically claim verified skill mastery without evidence.
    """
    student_id = _resolve_student_id(current_user, db)
    updated_roadmap = CareerIntelligenceService.update_milestone_progress(
        db=db,
        student_id=student_id,
        item_id=item_id,
        status=payload.status,
        notes=payload.notes,
        evidence_url=payload.evidence_url,
        evidence_notes=payload.evidence_notes,
        is_completed=payload.is_completed
    )
    return APIResponse(
        success=True,
        data=updated_roadmap,
        message="Milestone progress and evidence recorded successfully."
    )


# 4. Career Readiness Index (CRI)
@router.get("/readiness-index", response_model=APIResponse[Dict[str, Any]])
def get_career_readiness_index(
    record_snapshot: bool = Query(True, description="Save snapshot to history"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculates transparent 6-pillar Career Readiness Index (CRI) out of 100.
    Surfaces category scores, explicit missing data notices, and highest-ROI improvement actions.
    """
    save_snap = record_snapshot if isinstance(record_snapshot, bool) else True
    student_id = _resolve_student_id(current_user, db)
    cri = CareerIntelligenceService.calculate_and_record_readiness(
        db, student_id, save_snapshot=save_snap
    )
    return APIResponse(
        success=True,
        data=cri,
        message="Career Readiness Index calculated successfully."
    )


@router.get("/readiness-index/history", response_model=APIResponse[List[Dict[str, Any]]])
def get_readiness_history(
    limit: int = Query(10, ge=1, le=50),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves historical Career Readiness Index snapshots for score trajectory."""
    limit_val = limit if isinstance(limit, int) else 10
    student_id = _resolve_student_id(current_user, db)
    history = CareerIntelligenceService.get_readiness_history(db, student_id, limit=limit_val)
    return APIResponse(
        success=True,
        data=history,
        message="Career readiness history retrieved."
    )

