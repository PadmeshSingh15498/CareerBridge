"""
Context Builder for BridgeAI Career Assistant.
Extracts and structures authorized student profile dimensions for prompt grounding.
Strictly enforces cross-student data isolation: only the authenticated student's data is retrieved.
"""

from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.user import User, UserRole
from app.models.student import (
    StudentProfile, AcademicRecord, StudentSkill, Skill,
    StudentProject, StudentCertification, StudentExperience
)
from app.models.resume import Resume, ResumeAnalysis
from app.models.application import Application
from app.models.job import Job
from app.models.recruiter import Company
from app.models.ai import SkillGapAnalysis, CareerRoadmap, CareerReadinessHistory
from app.services.career_intelligence_service import CareerIntelligenceService


def build_student_context_prompt(db: Session, user: User) -> str:
    """
    Constructs a rich, grounded context string containing authorized dimensions
    of the current student. Enforces cross-student isolation.
    """
    if user.role != UserRole.STUDENT:
        # For non-student or demo role, provide high-level context
        return "Role Context: Institutional Reviewer / Placement Officer Workspace."

    student = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not student:
        return "Student Context: Profile incomplete. Advise student to complete academic and skills onboarding."

    # 1. Academic Record
    academic = db.query(AcademicRecord).filter(AcademicRecord.student_id == student.id).first()
    cgpa_str = f"{academic.cgpa_or_percentage}/10.0" if academic and academic.cgpa_or_percentage else "Not recorded"
    dept_str = academic.department if academic else "Engineering"
    deg_str = academic.degree if academic else "Undergraduate"
    grad_year = academic.end_year if academic else 2026
    backlogs = academic.backlogs_count if academic else 0

    # 2. Skills
    student_skills = db.query(StudentSkill).filter(StudentSkill.student_id == student.id).all()
    skills_list = []
    for ss in student_skills:
        sk = db.query(Skill).filter(Skill.id == ss.skill_id).first()
        if sk:
            ver = "Verified" if ss.is_verified else "Self-Declared"
            prof = ss.proficiency_level.value if hasattr(ss.proficiency_level, "value") else str(ss.proficiency_level)
            skills_list.append(f"{sk.name} ({prof.capitalize()}, {ver})")
    skills_summary = ", ".join(skills_list[:12]) if skills_list else "None added yet"

    # 3. Projects
    projects = db.query(StudentProject).filter(StudentProject.student_id == student.id).limit(3).all()
    project_strs = []
    for p in projects:
        techs = getattr(p, "technologies_used", None) or getattr(p, "technologies", [])
        tech_str = ", ".join(techs) if isinstance(techs, list) else str(techs)
        gh = f" [GitHub: {p.github_url}]" if p.github_url else ""
        project_strs.append(f"- {p.title} (Tech: {tech_str}){gh}")
    projects_summary = "\n".join(project_strs) if project_strs else "No projects added yet"

    # 4. Resume & ATS Analysis
    resume = db.query(Resume).filter(Resume.student_id == student.id).order_by(Resume.created_at.desc()).first()
    ats_score = "Unanalyzed"
    if resume:
        ra = db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume.id).first()
        if ra:
            ats_score = f"{ra.ats_score}/100"

    # 5. Career Readiness Index (CRI)
    cri = CareerIntelligenceService.calculate_and_record_readiness(db, student.id, save_snapshot=False)
    cri_score = cri.get("overall_score", 0.0)
    cri_tier = cri.get("tier", "Progressing")

    # 6. Latest Skill Gap Analysis
    latest_gap = db.query(SkillGapAnalysis).filter(
        SkillGapAnalysis.student_id == student.id
    ).order_by(desc(SkillGapAnalysis.created_at)).first()

    target_role_str = latest_gap.target_role if latest_gap else "Software Developer"
    readiness_str = f"{latest_gap.readiness_percentage}%" if latest_gap else "Calculating"
    critical_missing = []
    if latest_gap and latest_gap.critical_missing_skills:
        for s in latest_gap.critical_missing_skills[:4]:
            if isinstance(s, dict):
                critical_missing.append(s.get("skill_name", ""))
            else:
                critical_missing.append(str(s))
    gaps_str = ", ".join(critical_missing) if critical_missing else "None identified"

    # 7. Active Roadmap
    active_roadmap = db.query(CareerRoadmap).filter(
        CareerRoadmap.student_id == student.id,
        CareerRoadmap.status == "active"
    ).order_by(desc(CareerRoadmap.created_at)).first()
    roadmap_summary = f"{active_roadmap.title} (Target: {active_roadmap.target_role})" if active_roadmap else "No active roadmap"

    # 8. Active Applications
    apps = db.query(Application).filter(Application.student_id == student.id).limit(3).all()
    app_strs = []
    for a in apps:
        j = db.query(Job).filter(Job.id == a.job_id).first()
        comp = db.query(Company).filter(Company.id == j.company_id).first() if j else None
        comp_name = comp.name if comp else "Corporate"
        role_name = j.title if j else "Software Role"
        status_val = a.current_status.value if hasattr(a.current_status, "value") else str(a.current_status)
        app_strs.append(f"- {role_name} at {comp_name} (Status: {status_val.replace('_', ' ').title()})")
    apps_summary = "\n".join(app_strs) if app_strs else "No active applications"

    return (
        "=== AUTHORIZED STUDENT PROFILE & PLACEMENT CONTEXT ===\n"
        f"Candidate Name: {student.full_name}\n"
        f"Academic Standing: {deg_str} in {dept_str} (Batch of {grad_year})\n"
        f"CGPA: {cgpa_str} (Active Backlogs: {backlogs})\n"
        f"Placement Eligibility: {'Eligible' if backlogs == 0 else 'Conditional - Has Backlogs'}\n"
        f"Career Readiness Index (CRI): {cri_score}/100 (Tier: {cri_tier})\n"
        f"Primary Target Role: {target_role_str} (Readiness: {readiness_str})\n"
        f"Verified Technical Skills: {skills_summary}\n"
        f"Identified Skill Gaps to Bridge: {gaps_str}\n"
        f"Featured Projects:\n{projects_summary}\n"
        f"Resume ATS Score: {ats_score}\n"
        f"Active Learning Roadmap: {roadmap_summary}\n"
        f"Active Campus Applications:\n{apps_summary}\n"
        "======================================================"
    )
