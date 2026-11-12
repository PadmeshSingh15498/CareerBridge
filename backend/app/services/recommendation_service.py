"""
Recommendation Service for CareerBridge.
Interfaces between the database ORM models and the Intelligent Job Matcher.
Supplies the Opportunity Radar with personalized rankings, eligibility checks,
missing skill diagnostics, and benchmark evaluation.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Set
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.job import Job, JobSkill, JobEligibility, SavedJob, JobStatusEnum
from app.models.student import (
    StudentProfile, AcademicRecord, StudentSkill, StudentProject,
    StudentExperience, StudentCertification, Skill
)
from app.models.application import Application
from app.models.user import User, UserRole
from app.ai.job_matcher.recommendation_engine import (
    RecommendationEngine,
    JobRecommendationOutput,
)
from app.ai.job_matcher.synthetic_eval import run_synthetic_benchmark


class RecommendationService:

    @staticmethod
    def extract_student_data(db: Session, student_profile: StudentProfile) -> Dict[str, Any]:
        """
        Extracts and normalizes student data across skills, academic records,
        projects, experiences, and preferences for recommendation processing.
        """
        # Academic Record (Use latest)
        academic = None
        if student_profile.academic_records:
            academic = sorted(
                student_profile.academic_records,
                key=lambda a: (a.end_year or 0),
                reverse=True
            )[0]

        # Skills list
        skills: List[str] = []
        for ss in student_profile.skills:
            if ss.skill and ss.skill.name:
                skills.append(ss.skill.name)

        # Also incorporate skills extracted from latest resume if available
        if student_profile.resumes:
            for r in student_profile.resumes:
                if r.analysis and r.analysis.extracted_skills:
                    for es in r.analysis.extracted_skills:
                        if es and es not in skills:
                            skills.append(str(es))

        # Projects
        projects: List[Dict[str, Any]] = []
        for p in student_profile.projects:
            techs = getattr(p, "technologies_used", None) or getattr(p, "technologies", [])
            techs_list = techs if isinstance(techs, list) else []
            projects.append({
                "title": p.title,
                "description": p.description or "",
                "technologies": techs_list,
            })

        # Experience
        experiences: List[Dict[str, Any]] = []
        for e in student_profile.experiences:
            experiences.append({
                "company": e.company_name,
                "role": getattr(e, "role_title", None) or getattr(e, "role", ""),
                "responsibilities": getattr(e, "description", None) or getattr(e, "responsibilities", "") or "",
            })

        # Certifications
        certifications: List[Dict[str, Any]] = []
        for c in student_profile.certifications:
            certifications.append({
                "name": getattr(c, "title", None) or getattr(c, "name", ""),
                "issuing_organization": c.issuing_organization,
            })

        # Preferences (infer or extract from profile)
        preferred_roles = []
        if student_profile.bio:
            # Extract common role mentions from bio
            for role_name in ["Full Stack", "Backend", "Frontend", "Machine Learning", "DevOps", "Data Science", "Software Engineer"]:
                if role_name.lower() in student_profile.bio.lower():
                    preferred_roles.append(role_name)

        preferred_locations = [student_profile.city] if student_profile.city else []

        return {
            "id": student_profile.id,
            "name": student_profile.full_name,
            "degree": academic.degree if academic else None,
            "department": academic.department if academic else None,
            "cgpa": float(academic.cgpa_or_percentage) if academic and academic.cgpa_or_percentage is not None else None,
            "graduation_year": academic.end_year if academic else None,
            "active_backlogs": academic.backlogs_count if academic else 0,
            "skills": skills,
            "preferred_roles": preferred_roles,
            "preferred_locations": preferred_locations,
            "projects": projects,
            "experience": experiences,
            "certifications": certifications,
            "bio": student_profile.bio or "",
        }

    @staticmethod
    def extract_job_data(job: Job) -> Dict[str, Any]:
        """Converts Job ORM object into recommendation engine input dictionary."""
        required_skills: List[str] = []
        preferred_skills: List[str] = []

        for js in (job.skills or []):
            if js.skill and js.skill.name:
                if js.is_mandatory:
                    required_skills.append(js.skill.name)
                else:
                    preferred_skills.append(js.skill.name)

        eligibility_data = None
        if job.eligibility:
            eligibility_data = {
                "min_cgpa": float(job.eligibility.min_cgpa) if job.eligibility.min_cgpa is not None else None,
                "max_backlogs_allowed": job.eligibility.max_backlogs_allowed,
                "allowed_grad_years": list(job.eligibility.allowed_grad_years or []),
                "allowed_departments": list(job.eligibility.allowed_departments or []),
            }

        return {
            "id": job.id,
            "job_id": job.id,
            "title": job.title,
            "company_name": job.company.name if job.company else "Campus Partner",
            "location": job.location,
            "workplace_type": job.workplace_type.value if hasattr(job.workplace_type, "value") else str(job.workplace_type),
            "salary_min": float(job.salary_min) if job.salary_min is not None else None,
            "salary_max": float(job.salary_max) if job.salary_max is not None else None,
            "description": job.description or "",
            "requirements": job.requirements or "",
            "required_skills": required_skills,
            "preferred_skills": preferred_skills,
            "eligibility": eligibility_data,
            "application_deadline": job.application_deadline.isoformat() if hasattr(job.application_deadline, "isoformat") else str(job.application_deadline),
            "status": job.status.value if hasattr(job.status, "value") else str(job.status),
        }

    @classmethod
    def get_opportunity_radar(
        cls,
        db: Session,
        current_user: User,
        category: Optional[str] = None,
        min_score: Optional[int] = None,
        workplace_type: Optional[str] = None,
        location: Optional[str] = None,
        sort_by: str = "match_score",  # "match_score", "newest", "salary", "deadline"
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Generates personalized Opportunity Radar recommendations for the student.
        """
        student_profile = db.query(StudentProfile).options(
            joinedload(StudentProfile.academic_records),
            joinedload(StudentProfile.skills).joinedload(StudentSkill.skill),
            joinedload(StudentProfile.projects),
            joinedload(StudentProfile.experiences),
            joinedload(StudentProfile.certifications),
            joinedload(StudentProfile.resumes),
            joinedload(StudentProfile.applications)
        ).filter(StudentProfile.user_id == current_user.id).first()

        if not student_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found. Please complete profile setup first."
            )

        # Student data
        student_data = cls.extract_student_data(db, student_profile)

        # Get applied and saved job IDs
        applied_job_ids = {a.job_id for a in student_profile.applications if a.job_id}
        saved_jobs = db.query(SavedJob.job_id).filter(SavedJob.student_id == student_profile.id).all()
        saved_job_ids = {s[0] for s in saved_jobs}

        # Query all active, unexpired jobs
        now = datetime.utcnow()
        active_jobs = db.query(Job).options(
            joinedload(Job.company),
            joinedload(Job.skills).joinedload(JobSkill.skill),
            joinedload(Job.eligibility)
        ).filter(
            Job.status == JobStatusEnum.ACTIVE,
            Job.application_deadline >= now
        ).all()

        engine = RecommendationEngine()
        recommendations: List[JobRecommendationOutput] = []

        radar_summary = {
            "total_available": len(active_jobs),
            "excellent_match_count": 0,
            "good_match_count": 0,
            "skill_development_count": 0,
            "not_eligible_count": 0,
            "insufficient_info_count": 0,
        }

        missing_skills_frequency: Dict[str, int] = {}

        for job in active_jobs:
            job_dict = cls.extract_job_data(job)
            rec = engine.evaluate_match(student_data, job_dict)

            # Update category counts
            if rec.category == "Excellent Match":
                radar_summary["excellent_match_count"] += 1
            elif rec.category == "Good Match":
                radar_summary["good_match_count"] += 1
            elif rec.category == "Skill Development Needed":
                radar_summary["skill_development_count"] += 1
            elif rec.category == "Not Eligible":
                radar_summary["not_eligible_count"] += 1
            elif rec.category == "Insufficient Profile Information":
                radar_summary["insufficient_info_count"] += 1

            # Tally missing required skills
            for ms in rec.missing_required_skills:
                missing_skills_frequency[ms] = missing_skills_frequency.get(ms, 0) + 1

            # Apply in-memory filters
            if category:
                cat_lower = category.lower().replace("_", " ")
                if cat_lower == "excellent" and rec.category != "Excellent Match":
                    continue
                elif cat_lower == "good" and rec.category != "Good Match":
                    continue
                elif cat_lower in ["skill development", "skill gap"] and rec.category != "Skill Development Needed":
                    continue
                elif cat_lower in ["ineligible", "not eligible"] and rec.category != "Not Eligible":
                    continue
                elif cat_lower == "eligible only" and not rec.is_eligible:
                    continue

            if min_score is not None and rec.match_score < min_score:
                continue

            if workplace_type and job.workplace_type.value != workplace_type:
                continue

            if location and location.strip() and location.strip().lower() not in (job.location or "").lower():
                continue

            recommendations.append(rec)

        # Sorting
        if sort_by == "salary":
            recommendations.sort(key=lambda r: float(r.salary_range.replace("₹", "").replace(",", "").split(" - ")[-1]) if r.salary_range else 0.0, reverse=True)
        elif sort_by == "deadline":
            recommendations.sort(key=lambda r: r.application_deadline or "")
        elif sort_by == "newest":
            pass  # Retain original db order
        else:  # match_score (default)
            recommendations.sort(key=lambda r: r.match_score, reverse=True)

        top_missing = sorted(missing_skills_frequency.items(), key=lambda x: x[1], reverse=True)[:5]

        # Convert to serialized dicts
        items_out = []
        for r in recommendations[:limit]:
            d = r.model_dump()
            d["is_saved"] = r.job_id in saved_job_ids
            d["has_applied"] = r.job_id in applied_job_ids
            items_out.append(d)

        return {
            "items": items_out,
            "total": len(recommendations),
            "radar_summary": radar_summary,
            "top_missing_skills": [{"skill": s, "frequency": f} for s, f in top_missing],
            "applied_job_ids": list(applied_job_ids),
            "student_profile_readiness": {
                "name": student_data["name"],
                "cgpa": student_data["cgpa"],
                "skills_count": len(student_data["skills"]),
                "projects_count": len(student_data["projects"]),
                "has_sufficient_info": bool(student_data["skills"] or student_data["projects"]),
            }
        }

    @classmethod
    def get_job_radar_match(
        cls,
        db: Session,
        current_user: User,
        job_id: str
    ) -> Dict[str, Any]:
        """Evaluates detailed radar match for a specific job against logged-in student."""
        job = db.query(Job).options(
            joinedload(Job.company),
            joinedload(Job.skills).joinedload(JobSkill.skill),
            joinedload(Job.eligibility)
        ).filter(Job.id == job_id).first()

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        student_profile = db.query(StudentProfile).options(
            joinedload(StudentProfile.academic_records),
            joinedload(StudentProfile.skills).joinedload(StudentSkill.skill),
            joinedload(StudentProfile.projects),
            joinedload(StudentProfile.experiences),
            joinedload(StudentProfile.certifications),
            joinedload(StudentProfile.resumes),
            joinedload(StudentProfile.applications)
        ).filter(StudentProfile.user_id == current_user.id).first()

        if not student_profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

        student_data = cls.extract_student_data(db, student_profile)
        job_dict = cls.extract_job_data(job)

        engine = RecommendationEngine()
        rec = engine.evaluate_match(student_data, job_dict)

        has_applied = any(a.job_id == job.id for a in student_profile.applications)
        saved_jobs = db.query(SavedJob).filter(SavedJob.student_id == student_profile.id, SavedJob.job_id == job.id).first()

        out = rec.model_dump()
        out["is_saved"] = bool(saved_jobs)
        out["has_applied"] = has_applied
        return out

    @staticmethod
    def get_synthetic_benchmark() -> Dict[str, Any]:
        """Runs the synthetic evaluation benchmark suite and returns metrics."""
        engine = RecommendationEngine()
        return run_synthetic_benchmark(engine)
