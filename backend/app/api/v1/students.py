"""
REST API Router for Student Profile, Academics, Skills, Projects, and Experience.
Protected by JWT authentication and granular student ownership checks.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_active_user, require_roles
from app.models.user import User
from app.services.student_service import StudentService
from app.schemas.student import (
    PersonalInfoUpdate, AcademicRecordCreate, AcademicRecordResponse,
    SkillAddRequest, SkillResponse, ProjectCreate, ProjectUpdate, ProjectResponse,
    CertificationCreate, CertificationResponse, ExperienceCreate, ExperienceUpdate, ExperienceResponse,
    ProfileCompletionResponse, FullStudentProfileResponse
)
from app.schemas.common import APIResponse

router = APIRouter(prefix="/students", tags=["Student Profile Management"])


def _get_student(current_user: User, db: Session):
    student = StudentService.get_or_create_student_profile(current_user.id, db)
    return student


@router.get("/me/profile", response_model=APIResponse[FullStudentProfileResponse])
def get_my_full_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieves full student profile across all sections with dynamic completion analysis."""
    student = _get_student(current_user, db)
    completion = StudentService.calculate_profile_completion(student, db)

    # Active default resume info
    active_resume = None
    ats_score = None
    if student.resumes:
        active_resume = student.resumes[0]
        if active_resume.analysis:
            ats_score = active_resume.analysis.ats_score

    # Transform academic records
    academics = [
        AcademicRecordResponse(
            id=a.id,
            institution_name=a.institution_name,
            degree=a.degree,
            department=a.department,
            start_year=a.start_year,
            end_year=a.end_year,
            cgpa_or_percentage=float(a.cgpa_or_percentage),
            backlogs_count=a.backlogs_count,
            created_at=a.created_at,
        ) for a in student.academic_records
    ]

    # Transform skills
    skills = [
        SkillResponse(
            id=s.skill_id,
            name=s.skill.name if s.skill else "Skill",
            category=s.skill.category.value if s.skill else "tool",
            proficiency_level=s.proficiency_level.value,
            is_verified=s.is_verified,
        ) for s in student.skills
    ]

    # Transform projects
    projects = [
        ProjectResponse(
            id=p.id,
            title=p.title,
            description=p.description,
            technologies_used=p.technologies_used or [],
            github_url=p.github_url,
            live_demo_url=p.live_demo_url,
            start_date=p.start_date,
            end_date=p.end_date,
        ) for p in student.projects
    ]

    # Transform certifications
    certifications = [
        CertificationResponse(
            id=c.id,
            title=c.title,
            issuing_organization=c.issuing_organization,
            issue_date=c.issue_date,
            expiration_date=c.expiration_date,
            credential_url=c.credential_url,
        ) for c in student.certifications
    ]

    # Transform experience
    experiences = [
        ExperienceResponse(
            id=e.id,
            company_name=e.company_name,
            role_title=e.role_title,
            location=e.location,
            start_date=e.start_date,
            end_date=e.end_date,
            is_current=e.is_current,
            description=e.description,
        ) for e in student.experiences
    ]

    profile_data = FullStudentProfileResponse(
        id=student.id,
        user_id=student.user_id,
        full_name=student.full_name,
        roll_number=student.roll_number,
        email=current_user.email,
        phone_number=student.phone_number,
        gender=student.gender.value if student.gender else None,
        bio=student.bio,
        city=student.city,
        linkedin_url=student.linkedin_url,
        github_url=student.github_url,
        portfolio_url=student.portfolio_url,
        placement_status=student.placement_status.value,
        academic_records=academics,
        skills=skills,
        projects=projects,
        certifications=certifications,
        experiences=experiences,
        completion=completion,
        has_resume=len(student.resumes) > 0,
        active_resume_id=active_resume.id if active_resume else None,
        ats_score=ats_score,
    )

    return APIResponse(
        success=True,
        data=profile_data,
        message="Student profile retrieved successfully."
    )


@router.put("/me/profile/personal", response_model=APIResponse[Dict[str, Any]])
def update_personal_profile(
    payload: PersonalInfoUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Updates student personal information (phone, location, bio, links)."""
    student = _get_student(current_user, db)
    updated = StudentService.update_personal_info(student.id, payload, db)
    return APIResponse(
        success=True,
        data={
            "id": updated.id,
            "full_name": updated.full_name,
            "phone_number": updated.phone_number,
            "city": updated.city,
            "bio": updated.bio,
            "linkedin_url": updated.linkedin_url,
            "github_url": updated.github_url,
            "portfolio_url": updated.portfolio_url,
        },
        message="Personal information updated successfully."
    )


@router.put("/me/profile/academic", response_model=APIResponse[AcademicRecordResponse])
def update_academic_record(
    payload: AcademicRecordCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Updates student academic records (institution, degree, department, CGPA, backlogs)."""
    student = _get_student(current_user, db)
    rec = StudentService.add_or_update_academic_record(student.id, payload, db)
    return APIResponse(
        success=True,
        data=AcademicRecordResponse(
            id=rec.id,
            institution_name=rec.institution_name,
            degree=rec.degree,
            department=rec.department,
            start_year=rec.start_year,
            end_year=rec.end_year,
            cgpa_or_percentage=float(rec.cgpa_or_percentage),
            backlogs_count=rec.backlogs_count,
            created_at=rec.created_at,
        ),
        message="Academic record updated successfully."
    )


@router.post("/me/skills", response_model=APIResponse[SkillResponse])
def add_student_skill(
    payload: SkillAddRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Adds a categorized skill to the student profile."""
    student = _get_student(current_user, db)
    ss = StudentService.add_skill(student.id, payload, db)
    return APIResponse(
        success=True,
        data=SkillResponse(
            id=ss.skill_id,
            name=ss.skill.name if ss.skill else payload.name,
            category=ss.skill.category.value if ss.skill else (payload.category or "tool"),
            proficiency_level=ss.proficiency_level.value,
            is_verified=ss.is_verified,
        ),
        message=f"Skill '{payload.name}' added successfully."
    )


@router.delete("/me/skills/{skill_id}", response_model=APIResponse[bool])
def remove_student_skill(
    skill_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Removes a skill from the student profile."""
    student = _get_student(current_user, db)
    success = StudentService.remove_skill(student.id, skill_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Skill not found on profile.")
    return APIResponse(success=True, data=True, message="Skill removed successfully.")


@router.post("/me/projects", response_model=APIResponse[ProjectResponse])
def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Creates a technical project entry."""
    student = _get_student(current_user, db)
    p = StudentService.create_project(student.id, payload, db)
    return APIResponse(
        success=True,
        data=ProjectResponse(
            id=p.id,
            title=p.title,
            description=p.description,
            technologies_used=p.technologies_used or [],
            github_url=p.github_url,
            live_demo_url=p.live_demo_url,
            start_date=p.start_date,
            end_date=p.end_date,
        ),
        message="Project created successfully."
    )


@router.put("/me/projects/{project_id}", response_model=APIResponse[ProjectResponse])
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Updates an existing project."""
    student = _get_student(current_user, db)
    p = StudentService.update_project(student.id, project_id, payload, db)
    return APIResponse(
        success=True,
        data=ProjectResponse(
            id=p.id,
            title=p.title,
            description=p.description,
            technologies_used=p.technologies_used or [],
            github_url=p.github_url,
            live_demo_url=p.live_demo_url,
            start_date=p.start_date,
            end_date=p.end_date,
        ),
        message="Project updated successfully."
    )


@router.delete("/me/projects/{project_id}", response_model=APIResponse[bool])
def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Deletes a project record."""
    student = _get_student(current_user, db)
    success = StudentService.delete_project(student.id, project_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found.")
    return APIResponse(success=True, data=True, message="Project deleted successfully.")


@router.post("/me/certifications", response_model=APIResponse[CertificationResponse])
def create_certification(
    payload: CertificationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Adds a professional certification."""
    student = _get_student(current_user, db)
    c = StudentService.create_certification(student.id, payload, db)
    return APIResponse(
        success=True,
        data=CertificationResponse(
            id=c.id,
            title=c.title,
            issuing_organization=c.issuing_organization,
            issue_date=c.issue_date,
            expiration_date=c.expiration_date,
            credential_url=c.credential_url,
        ),
        message="Certification added successfully."
    )


@router.delete("/me/certifications/{cert_id}", response_model=APIResponse[bool])
def delete_certification(
    cert_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Deletes a certification record."""
    student = _get_student(current_user, db)
    success = StudentService.delete_certification(student.id, cert_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Certification not found.")
    return APIResponse(success=True, data=True, message="Certification deleted successfully.")


@router.post("/me/experience", response_model=APIResponse[ExperienceResponse])
def create_experience(
    payload: ExperienceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Adds work or internship experience."""
    student = _get_student(current_user, db)
    e = StudentService.create_experience(student.id, payload, db)
    return APIResponse(
        success=True,
        data=ExperienceResponse(
            id=e.id,
            company_name=e.company_name,
            role_title=e.role_title,
            location=e.location,
            start_date=e.start_date,
            end_date=e.end_date,
            is_current=e.is_current,
            description=e.description,
        ),
        message="Experience record added successfully."
    )


@router.put("/me/experience/{exp_id}", response_model=APIResponse[ExperienceResponse])
def update_experience(
    exp_id: str,
    payload: ExperienceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Updates work experience."""
    student = _get_student(current_user, db)
    e = StudentService.update_experience(student.id, exp_id, payload, db)
    return APIResponse(
        success=True,
        data=ExperienceResponse(
            id=e.id,
            company_name=e.company_name,
            role_title=e.role_title,
            location=e.location,
            start_date=e.start_date,
            end_date=e.end_date,
            is_current=e.is_current,
            description=e.description,
        ),
        message="Experience record updated successfully."
    )


@router.delete("/me/experience/{exp_id}", response_model=APIResponse[bool])
def delete_experience(
    exp_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Deletes work experience record."""
    student = _get_student(current_user, db)
    success = StudentService.delete_experience(student.id, exp_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Experience record not found.")
    return APIResponse(success=True, data=True, message="Experience record deleted successfully.")


@router.get("/me/completion", response_model=APIResponse[ProfileCompletionResponse])
def get_profile_completion(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieves dynamic profile completion percentage with missing criteria checklist."""
    student = _get_student(current_user, db)
    completion = StudentService.calculate_profile_completion(student, db)
    return APIResponse(
        success=True,
        data=completion,
        message="Profile completion evaluated successfully."
    )
