"""
Recruiter Service Layer for CareerBridge.
Orchestrates Company Profile Management, Verification Gating,
Recruiter Dashboard Analytics, Requisition Lifecycle, Candidate Intelligence,
Advisory AI Match Breakdown, Private Recruiter Notes, and Interview Rubrics.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import func, or_, and_, desc, asc
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.recruiter import Company, RecruiterProfile, CompanySizeEnum
from app.models.job import (
    Job, JobSkill, JobEligibility, SavedJob,
    JobTypeEnum, WorkplaceTypeEnum, JobStatusEnum, GenderPreferenceEnum
)
from app.models.student import (
    StudentProfile, AcademicRecord, StudentSkill, StudentProject,
    StudentExperience, StudentCertification, Skill, SkillCategoryEnum
)
from app.models.resume import Resume, ResumeAnalysis
from app.models.application import (
    Application, ApplicationStatusHistory, Interview, InterviewFeedback,
    ApplicationStatusEnum, InterviewStatusEnum, InterviewRecommendationEnum
)
from app.models.user import User, UserRole, Notification, NotificationType
from app.schemas.recruiter import (
    CompanyProfileUpdateRequest, CandidateFilterRequest,
    ApplicationStageAdvanceRequest, CandidateInterviewScheduleRequest,
    InterviewFeedbackCreateRequest
)
from app.schemas.job import JobCreateRequest, JobUpdateRequest
from app.services.job_service import JobService
from app.ai.matching import evaluate_candidate_for_job
from app.ai.taxonomy import normalize_skill_name


class RecruiterService:

    @staticmethod
    def _get_recruiter_profile(db: Session, user: User) -> Tuple[RecruiterProfile, Company]:
        """Resolves recruiter profile and associated company with authorization checks."""
        if user.role not in [UserRole.RECRUITER, UserRole.TPO, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access restricted to authorized recruiters and placement officials."
            )

        recruiter = db.query(RecruiterProfile).options(
            joinedload(RecruiterProfile.company)
        ).filter(RecruiterProfile.user_id == user.id).first()

        if not recruiter:
            # If admin or TPO accessing recruiter view without profile, find first company or raise
            if user.role in [UserRole.TPO, UserRole.ADMIN]:
                comp = db.query(Company).first()
                if not comp:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No registered organization found.")
                return None, comp
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recruiter profile not configured. Please complete company setup."
            )

        return recruiter, recruiter.company

    # =========================================================================
    # 1. COMPANY PROFILE MANAGEMENT
    # =========================================================================

    @staticmethod
    def get_company_profile(db: Session, user: User, company_id: Optional[str] = None) -> Dict[str, Any]:
        """Retrieves company profile, verification state, and team size."""
        if company_id and user.role in [UserRole.TPO, UserRole.ADMIN]:
            company = db.query(Company).filter(Company.id == company_id).first()
            if not company:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found.")
        else:
            _, company = RecruiterService._get_recruiter_profile(db, user)

        recruiters_cnt = db.query(func.count(RecruiterProfile.id)).filter(
            RecruiterProfile.company_id == company.id
        ).scalar() or 1

        v_status = getattr(company, "verification_status", None)
        if not v_status:
            v_status = "verified" if company.is_verified else "pending_verification"

        is_v = bool(company.is_verified or v_status == "verified")

        return {
            "id": company.id,
            "name": company.name,
            "website_url": company.website_url,
            "industry": company.industry,
            "company_size": company.company_size.value if hasattr(company.company_size, "value") else str(company.company_size),
            "headquarters": company.headquarters,
            "logo_url": company.logo_url,
            "description": company.description or f"{company.name} is a premier campus recruitment partner on CareerBridge.",
            "hr_contact_name": company.hr_contact_name,
            "hr_contact_email": company.hr_contact_email,
            "hr_contact_phone": company.hr_contact_phone,
            "is_verified": is_v,
            "verification_status": v_status,
            "created_at": company.created_at,
            "can_publish_jobs": is_v,
            "recruiters_count": recruiters_cnt
        }

    @staticmethod
    def update_company_profile(
        db: Session,
        user: User,
        payload: CompanyProfileUpdateRequest
    ) -> Dict[str, Any]:
        """Updates company details with uniqueness checks."""
        _, company = RecruiterService._get_recruiter_profile(db, user)

        if payload.name and payload.name.strip() != company.name:
            existing = db.query(Company).filter(
                Company.name.ilike(payload.name.strip()),
                Company.id != company.id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"An organization with the name '{payload.name.strip()}' is already registered."
                )
            company.name = payload.name.strip()

        if payload.website_url is not None:
            company.website_url = payload.website_url.strip()
        if payload.industry is not None:
            company.industry = payload.industry.strip()
        if payload.company_size is not None:
            if payload.company_size in CompanySizeEnum._value2member_map_:
                company.company_size = CompanySizeEnum(payload.company_size)
        if payload.headquarters is not None:
            company.headquarters = payload.headquarters.strip()
        if payload.logo_url is not None:
            company.logo_url = payload.logo_url.strip()
        if payload.description is not None:
            company.description = payload.description.strip()
        if payload.hr_contact_name is not None:
            company.hr_contact_name = payload.hr_contact_name.strip()
        if payload.hr_contact_email is not None:
            company.hr_contact_email = payload.hr_contact_email.strip()
        if payload.hr_contact_phone is not None:
            company.hr_contact_phone = payload.hr_contact_phone.strip()

        db.commit()
        db.refresh(company)
        return RecruiterService.get_company_profile(db, user, company.id)

    # =========================================================================
    # 2. RECRUITER DASHBOARD METRICS
    # =========================================================================

    @staticmethod
    def get_dashboard_metrics(db: Session, user: User) -> Dict[str, Any]:
        """Calculates real-time pipeline metrics and requisition stats for recruiter dashboard."""
        _, company = RecruiterService._get_recruiter_profile(db, user)

        # 1. Metric Counts
        active_jobs_cnt = db.query(func.count(Job.id)).filter(
            Job.company_id == company.id,
            Job.status == JobStatusEnum.ACTIVE
        ).scalar() or 0

        total_apps_cnt = db.query(func.count(Application.id)).join(Job).filter(
            Job.company_id == company.id
        ).scalar() or 0

        shortlisted_cnt = db.query(func.count(Application.id)).join(Job).filter(
            Job.company_id == company.id,
            Application.current_status == ApplicationStatusEnum.SHORTLISTED
        ).scalar() or 0

        interviews_scheduled_cnt = db.query(func.count(Interview.id)).join(Application).join(Job).filter(
            Job.company_id == company.id,
            Interview.status == InterviewStatusEnum.SCHEDULED
        ).scalar() or 0

        selected_cnt = db.query(func.count(Application.id)).join(Job).filter(
            Job.company_id == company.id,
            Application.current_status == ApplicationStatusEnum.OFFERED
        ).scalar() or 0

        # 2. Pipeline Breakdown
        pipeline_rows = db.query(
            Application.current_status,
            func.count(Application.id)
        ).join(Job).filter(
            Job.company_id == company.id
        ).group_by(Application.current_status).all()

        pipeline_map = {
            "applied": 0,
            "screening": 0,
            "shortlisted": 0,
            "technical_round": 0,
            "hr_round": 0,
            "offered": 0,
            "rejected": 0,
            "withdrawn": 0
        }
        for st, count in pipeline_rows:
            st_val = st.value if hasattr(st, "value") else str(st)
            pipeline_map[st_val] = count

        # 3. Recent Applications (Top 5)
        recent_apps = db.query(Application).options(
            joinedload(Application.job),
            joinedload(Application.student).joinedload(StudentProfile.academic_records),
            joinedload(Application.student).joinedload(StudentProfile.user)
        ).join(Job).filter(
            Job.company_id == company.id
        ).order_by(desc(Application.applied_at)).limit(5).all()

        recent_list = []
        for a in recent_apps:
            std = a.student
            acad = std.academic_records[0] if (std and std.academic_records) else None
            recent_list.append({
                "application_id": a.id,
                "candidate_name": std.full_name if std else "Candidate",
                "candidate_email": std.user.email if (std and std.user) else None,
                "roll_number": std.roll_number if std else None,
                "department": acad.department if acad else None,
                "cgpa": float(acad.cgpa_or_percentage) if acad and acad.cgpa_or_percentage is not None else None,
                "job_id": a.job_id,
                "job_title": a.job.title if a.job else "Requisition",
                "match_score": float(a.composite_match_score) if a.composite_match_score is not None else 0.0,
                "current_status": a.current_status.value if hasattr(a.current_status, "value") else str(a.current_status),
                "applied_at": a.applied_at
            })

        # 4. Active Requisitions Summary
        active_jobs = db.query(Job).options(
            joinedload(Job.applications)
        ).filter(
            Job.company_id == company.id,
            Job.status == JobStatusEnum.ACTIVE
        ).order_by(desc(Job.created_at)).limit(6).all()

        active_reqs = []
        for j in active_jobs:
            active_reqs.append({
                "id": j.id,
                "title": j.title,
                "vacancies": j.vacancies,
                "location": j.location,
                "application_deadline": j.application_deadline,
                "applicants_count": len(j.applications) if j.applications else 0
            })

        v_status = getattr(company, "verification_status", None) or ("verified" if company.is_verified else "pending_verification")

        return {
            "active_jobs_count": active_jobs_cnt,
            "total_applications_count": total_apps_cnt,
            "shortlisted_candidates_count": shortlisted_cnt,
            "interviews_scheduled_count": interviews_scheduled_cnt,
            "selected_candidates_count": selected_cnt,
            "is_company_verified": bool(company.is_verified or v_status == "verified"),
            "verification_status": v_status,
            "pipeline_breakdown": pipeline_map,
            "recent_applications": recent_list,
            "active_requisitions": active_reqs
        }

    # =========================================================================
    # 3. JOB REQUISITION MANAGEMENT
    # =========================================================================

    @staticmethod
    def list_recruiter_jobs(
        db: Session,
        user: User,
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Lists all requisitions for recruiter's company."""
        _, company = RecruiterService._get_recruiter_profile(db, user)

        query = db.query(Job).options(
            joinedload(Job.company),
            joinedload(Job.skills).joinedload(JobSkill.skill),
            joinedload(Job.eligibility),
            joinedload(Job.applications)
        ).filter(Job.company_id == company.id)

        if status_filter:
            query = query.filter(Job.status == status_filter.lower())

        jobs = query.order_by(desc(Job.created_at)).all()
        return [JobService._format_job_item(j) for j in jobs]

    @staticmethod
    def create_job(db: Session, user: User, payload: JobCreateRequest) -> Dict[str, Any]:
        """
        Creates job requisition with verification gating.
        Unverified recruiters cannot publish directly to ACTIVE; routed to PENDING_APPROVAL.
        """
        recruiter, company = RecruiterService._get_recruiter_profile(db, user)

        is_verified = bool(company.is_verified or getattr(company, "verification_status", "") == "verified")

        # Call underlying JobService
        job = JobService.create_job(db, user, payload)

        # Enforce verification status check
        if not is_verified and job.status == JobStatusEnum.ACTIVE:
            job.status = JobStatusEnum.PENDING_APPROVAL
            db.commit()
            db.refresh(job)

        detail = JobService.get_job_detail(db, job.id, user)
        if not is_verified:
            detail["verification_notice"] = (
                "Your organization verification is pending approval by the Placement Cell. "
                "This requisition has been submitted for university TPO review."
            )
        return detail

    @staticmethod
    def update_job_status(db: Session, user: User, job_id: str, new_status: str) -> Dict[str, Any]:
        """Updates job status (active, paused, closed, draft) with verification gating."""
        _, company = RecruiterService._get_recruiter_profile(db, user)

        job = db.query(Job).filter(Job.id == job_id, Job.company_id == company.id).first()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requisition not found in your organization.")

        status_clean = new_status.lower()
        if status_clean not in JobStatusEnum._value2member_map_:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid requisition status: {new_status}")

        target_enum = JobStatusEnum(status_clean)
        is_verified = bool(company.is_verified or getattr(company, "verification_status", "") == "verified")

        if target_enum == JobStatusEnum.ACTIVE and not is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot publish active requisitions while organization verification is pending. Please contact the university placement cell."
            )

        job.status = target_enum
        db.commit()
        db.refresh(job)
        return {"job_id": job.id, "status": job.status.value, "title": job.title}

    # =========================================================================
    # 4. CANDIDATE MANAGEMENT & INTELLIGENCE
    # =========================================================================

    @staticmethod
    def list_candidates(
        db: Session,
        user: User,
        filters: CandidateFilterRequest,
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """
        Lists applicants across the recruiter's company requisitions.
        Supports rich multi-attribute filtering (skills, CGPA, degree, department, batch, status, search).
        Calculates advisory match breakdown without automated AI auto-rejection.
        """
        _, company = RecruiterService._get_recruiter_profile(db, user)

        # Base query joined with company's jobs
        query = db.query(Application).options(
            joinedload(Application.job),
            joinedload(Application.student).joinedload(StudentProfile.academic_records),
            joinedload(Application.student).joinedload(StudentProfile.skills).joinedload(StudentSkill.skill),
            joinedload(Application.student).joinedload(StudentProfile.projects),
            joinedload(Application.student).joinedload(StudentProfile.experiences),
            joinedload(Application.student).joinedload(StudentProfile.user),
            joinedload(Application.resume)
        ).join(Job, Application.job_id == Job.id).filter(
            Job.company_id == company.id
        )

        # 1. Job filter
        if filters.job_id:
            query = query.filter(Application.job_id == filters.job_id)

        # 2. Status filter
        if filters.status:
            query = query.filter(Application.current_status == filters.status.lower())

        candidates = query.all()

        # Apply in-memory filters for academic and skill criteria
        filtered_items = []
        for app in candidates:
            std = app.student
            if not std:
                continue

            acad = std.academic_records[0] if std.academic_records else None
            cgpa = float(acad.cgpa_or_percentage) if acad and acad.cgpa_or_percentage is not None else 0.0
            degree = acad.degree if acad else ""
            department = acad.department if acad else ""
            grad_year = getattr(acad, "end_year", None) if acad else None
            backlogs_cnt = getattr(acad, "backlogs_count", 0) if acad else 0
            institution = acad.institution_name if acad else "University Partner"

            # Minimum CGPA filter
            if filters.min_cgpa is not None and cgpa < filters.min_cgpa:
                continue

            # Degree filter
            if filters.degree and filters.degree.strip():
                if filters.degree.lower() not in degree.lower():
                    continue

            # Department filter
            if filters.department and filters.department.strip():
                if filters.department.lower() not in department.lower():
                    continue

            # Graduation year filter
            if filters.graduation_year is not None and grad_year != filters.graduation_year:
                continue

            # Candidate Skills
            skills_list = [s.skill.name for s in (std.skills or []) if s.skill]

            # Skill filter
            if filters.skill and filters.skill.strip():
                skill_req = filters.skill.strip().lower()
                if not any(skill_req in s.lower() for s in skills_list):
                    continue

            # Keyword search (name, email, roll number)
            if filters.search and filters.search.strip():
                sq = filters.search.strip().lower()
                s_name = (std.full_name or "").lower()
                s_email = (std.user.email if std.user else "").lower()
                s_roll = (std.roll_number or "").lower()
                if sq not in s_name and sq not in s_email and sq not in s_roll:
                    continue

            # Advisory recommendation classification
            score = float(app.composite_match_score) if app.composite_match_score is not None else 0.0
            if score >= 85:
                advisory = "Excellent Match"
            elif score >= 70:
                advisory = "Strong Match"
            elif score >= 55:
                advisory = "Moderate Match"
            else:
                advisory = "Exploratory"

            # Check academic eligibility against job
            elig = app.job.eligibility if app.job else None
            is_eligible = True
            if elig:
                if cgpa < float(elig.min_cgpa):
                    is_eligible = False
                if backlogs_cnt > elig.max_backlogs_allowed:
                    is_eligible = False

            filtered_items.append({
                "application_id": app.id,
                "job_id": app.job_id,
                "job_title": app.job.title if app.job else "Requisition",
                "student_id": std.id,
                "full_name": std.full_name,
                "email": std.user.email if std.user else None,
                "roll_number": std.roll_number,
                "university": institution,
                "degree": degree,
                "department": department,
                "graduation_year": grad_year,
                "cgpa": cgpa,
                "backlogs": backlogs_cnt,
                "skills": skills_list[:8],
                "projects_count": len(std.projects) if std.projects else 0,
                "experience_count": len(std.experiences) if std.experiences else 0,
                "resume_id": app.resume_id,
                "resume_file_url": app.resume.file_path if app.resume else None,
                "current_status": app.current_status.value if hasattr(app.current_status, "value") else str(app.current_status),
                "composite_match_score": score,
                "advisory_recommendation": advisory,
                "is_academically_eligible": is_eligible,
                "has_recruiter_notes": bool(app.recruiter_notes and app.recruiter_notes.strip()),
                "applied_at": app.applied_at
            })

        # Sorting
        if filters.sort_by == "cgpa":
            filtered_items.sort(key=lambda x: x["cgpa"], reverse=True)
        elif filters.sort_by == "applied_at":
            filtered_items.sort(key=lambda x: x["applied_at"], reverse=True)
        else:  # match_score default
            filtered_items.sort(key=lambda x: x["composite_match_score"], reverse=True)

        total = len(filtered_items)
        start_idx = (page - 1) * page_size
        paged = filtered_items[start_idx:start_idx + page_size]

        return {
            "items": paged,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 1
        }

    @staticmethod
    def get_candidate_application_detail(
        db: Session,
        user: User,
        application_id: str
    ) -> Dict[str, Any]:
        """
        Retrieves full candidate application dossier.
        Enforces cross-company boundary: recruiters only access applicants to their own jobs.
        Includes extracted resume, PyMuPDF ATS metrics, private recruiter notes,
        and advisory AI match breakdown with explicit non-binding disclaimer.
        """
        _, company = RecruiterService._get_recruiter_profile(db, user)

        app = db.query(Application).options(
            joinedload(Application.job).joinedload(Job.company),
            joinedload(Application.job).joinedload(Job.skills).joinedload(JobSkill.skill),
            joinedload(Application.job).joinedload(Job.eligibility),
            joinedload(Application.student).joinedload(StudentProfile.user),
            joinedload(Application.student).joinedload(StudentProfile.academic_records),
            joinedload(Application.student).joinedload(StudentProfile.skills).joinedload(StudentSkill.skill),
            joinedload(Application.student).joinedload(StudentProfile.projects),
            joinedload(Application.student).joinedload(StudentProfile.experiences),
            joinedload(Application.student).joinedload(StudentProfile.certifications),
            joinedload(Application.resume).joinedload(Resume.analysis),
            joinedload(Application.status_history),
            joinedload(Application.interviews).joinedload(Interview.feedback)
        ).filter(Application.id == application_id).first()

        if not app:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application dossier not found.")

        # Cross-company isolation guard
        if user.role == UserRole.RECRUITER and app.job.company_id != company.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Candidate did not apply to your organization's requisition."
            )

        std = app.student
        acad = std.academic_records[0] if (std and std.academic_records) else None

        # Build full candidate profile representation
        skills_detailed = []
        for ss in (std.skills or []):
            if ss.skill:
                skills_detailed.append({
                    "id": ss.skill.id,
                    "name": ss.skill.name,
                    "category": ss.skill.category.value if hasattr(ss.skill.category, "value") else str(ss.skill.category),
                    "proficiency": ss.proficiency_level,
                    "is_verified": ss.is_verified
                })

        projects_list = []
        for p in (std.projects or []):
            projects_list.append({
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "technologies": p.technologies_used or [],
                "github_url": p.github_url,
                "live_url": p.live_demo_url,
                "start_date": p.start_date,
                "end_date": p.end_date
            })

        experiences_list = []
        for e in (std.experiences or []):
            experiences_list.append({
                "id": e.id,
                "company_name": e.company_name,
                "role_title": e.role_title,
                "location": e.location,
                "description": e.description,
                "start_date": e.start_date,
                "end_date": e.end_date,
                "is_current": e.is_current
            })

        certifications_list = []
        for c in (std.certifications or []):
            certifications_list.append({
                "id": c.id,
                "name": c.title,
                "issuing_organization": c.issuing_organization,
                "issue_date": c.issue_date,
                "credential_url": c.credential_url
            })

        # Resume Extraction & ATS Metrics
        resume_data = None
        resume_analysis = None
        if app.resume:
            resume_data = {
                "id": app.resume.id,
                "file_name": app.resume.file_name,
                "file_path": app.resume.file_path,
                "uploaded_at": app.resume.created_at
            }
            if app.resume.analysis:
                ra = app.resume.analysis
                resume_analysis = {
                    "ats_overall_score": float(getattr(ra, "ats_score", 0.0) or 0.0),
                    "structure_score": float(getattr(ra, "section_score", 0.0) or 0.0),
                    "content_score": float(getattr(ra, "metric_score", 0.0) or 0.0),
                    "skills_score": float(getattr(ra, "skill_score", 0.0) or 0.0),
                    "readability_score": float(getattr(ra, "format_score", 0.0) or 0.0),
                    "detected_skills": getattr(ra, "extracted_skills", []) or [],
                    "strengths": ["ATS-Optimized format", "Strong technical keyword alignment"],
                    "improvements": getattr(ra, "improvements_json", []) or []
                }

        # Deterministic Advisory Match Breakdown (Phase 9 engine)
        resume_raw = ""
        if app.resume:
            if app.resume.analysis and getattr(app.resume.analysis, "raw_text", None):
                resume_raw = app.resume.analysis.raw_text
            elif hasattr(app.resume, "raw_text") and app.resume.raw_text:
                resume_raw = app.resume.raw_text

        match_eval = evaluate_candidate_for_job(std, app.job, resume_text=resume_raw)

        # Timeline History
        history_list = []
        for h in sorted(app.status_history or [], key=lambda x: x.created_at):
            history_list.append({
                "id": h.id,
                "previous_status": h.previous_status,
                "new_status": h.new_status,
                "changed_by_user_id": h.changed_by_user_id,
                "change_reason": h.change_reason,
                "created_at": h.created_at
            })

        # Interviews and Feedback
        interviews_list = []
        for iv in sorted(app.interviews or [], key=lambda x: x.scheduled_start):
            fb_data = None
            if iv.feedback:
                fb_data = {
                    "id": iv.feedback.id,
                    "technical_rating": iv.feedback.technical_rating,
                    "communication_rating": iv.feedback.communication_rating,
                    "problem_solving_rating": iv.feedback.problem_solving_rating,
                    "recommendation": iv.feedback.recommendation.value if hasattr(iv.feedback.recommendation, "value") else str(iv.feedback.recommendation),
                    "detailed_notes": iv.feedback.detailed_notes,
                    "submitted_at": iv.feedback.submitted_at
                }

            interviews_list.append({
                "id": iv.id,
                "round_name": iv.round_name,
                "scheduled_start": iv.scheduled_start,
                "scheduled_end": iv.scheduled_end,
                "meeting_link": iv.meeting_link,
                "venue": iv.venue,
                "interviewer_name": iv.interviewer_name,
                "interview_mode": getattr(iv, "interview_mode", "virtual"),
                "instructions": getattr(iv, "instructions", None),
                "status": iv.status.value if hasattr(iv.status, "value") else str(iv.status),
                "feedback": fb_data,
                "created_at": iv.created_at
            })

        return {
            "application_id": app.id,
            "job_id": app.job_id,
            "job_title": app.job.title,
            "current_status": app.current_status.value if hasattr(app.current_status, "value") else str(app.current_status),
            "cover_letter": app.cover_letter,
            "applied_at": app.applied_at,
            "candidate": {
                "student_id": std.id,
                "full_name": std.full_name,
                "email": std.user.email if std.user else None,
                "phone": std.phone_number,
                "roll_number": std.roll_number,
                "university": acad.institution_name if acad else "University Partner",
                "degree": acad.degree if acad else None,
                "department": acad.department if acad else None,
                "graduation_year": getattr(acad, "end_year", None) if acad else None,
                "cgpa": float(acad.cgpa_or_percentage) if acad and acad.cgpa_or_percentage is not None else None,
                "active_backlogs": getattr(acad, "backlogs_count", 0) if acad else 0,
                "linkedin_url": std.linkedin_url,
                "github_url": std.github_url,
                "portfolio_url": std.portfolio_url,
                "skills": skills_detailed,
                "projects": projects_list,
                "experiences": experiences_list,
                "certifications": certifications_list
            },
            "resume": resume_data,
            "resume_analysis": resume_analysis,
            "ai_match_breakdown": {
                "composite_score": float(app.composite_match_score) if app.composite_match_score is not None else match_eval.get("composite_score", 0.0),
                "exact_skills_matched": match_eval.get("exact_skills_matched", []),
                "partial_skills_matched": match_eval.get("partial_skills_matched", []),
                "missing_skills": match_eval.get("missing_skills", []),
                "skill_match_percentage": match_eval.get("skill_match_percentage", 0.0),
                "semantic_similarity_percentage": match_eval.get("semantic_similarity_percentage", 0.0),
                "is_eligible": match_eval.get("is_eligible", True),
                "eligibility_reasons": match_eval.get("eligibility_breakdown", {}).get("reasons_if_ineligible", []),
                "advisory_banner": (
                    "DECISION SUPPORT ADVISORY: Match scores and skill comparisons are algorithmically generated "
                    "as non-binding recommendations. Qualified human recruiters must conduct all evaluation rounds."
                )
            },
            "recruiter_notes": app.recruiter_notes or "",  # Strictly internal
            "status_history": history_list,
            "interviews": interviews_list
        }

    # =========================================================================
    # 5. APPLICATION WORKFLOW, STAGES, NOTES & INTERVIEW RUBRICS
    # =========================================================================

    @staticmethod
    def advance_application_stage(
        db: Session,
        user: User,
        application_id: str,
        payload: ApplicationStageAdvanceRequest
    ) -> Dict[str, Any]:
        """
        Advances candidate stage (screening, shortlisted, technical_round, hr_round, offered, rejected).
        Appends immutable audit history and dispatches candidate notification.
        """
        _, company = RecruiterService._get_recruiter_profile(db, user)

        app = db.query(Application).options(
            joinedload(Application.job),
            joinedload(Application.student).joinedload(StudentProfile.user)
        ).filter(Application.id == application_id).first()

        if not app:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

        if user.role == UserRole.RECRUITER and app.job.company_id != company.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized.")

        new_status_str = payload.new_status.lower()
        if new_status_str not in ApplicationStatusEnum._value2member_map_:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status: {payload.new_status}")

        old_status_val = app.current_status.value if hasattr(app.current_status, "value") else str(app.current_status)
        new_enum = ApplicationStatusEnum(new_status_str)

        app.current_status = new_enum
        if payload.internal_notes:
            app.recruiter_notes = payload.internal_notes

        # Audit History
        reason_txt = payload.change_reason or f"Advanced to {new_enum.value.replace('_', ' ').title()}"
        history = ApplicationStatusHistory(
            application_id=app.id,
            previous_status=old_status_val,
            new_status=new_enum.value,
            changed_by_user_id=user.id,
            change_reason=reason_txt,
            created_at=datetime.utcnow()
        )
        db.add(history)

        # Notify student
        if app.student and app.student.user:
            disp_status = new_enum.value.replace("_", " ").title()
            ntype = NotificationType.SUCCESS if new_status_str in ["shortlisted", "offered"] else NotificationType.INFO
            db.add(Notification(
                user_id=app.student.user_id,
                title="Application Status Updated",
                message=f"Your application for '{app.job.title}' moved to '{disp_status}'.",
                category="application_status",
                notification_type=ntype,
                action_url="/student/applications"
            ))

        db.commit()
        db.refresh(app)
        return {
            "application_id": app.id,
            "new_status": app.current_status.value,
            "change_reason": reason_txt,
            "updated_at": datetime.utcnow()
        }

    @staticmethod
    def update_recruiter_notes(
        db: Session,
        user: User,
        application_id: str,
        notes: str
    ) -> Dict[str, Any]:
        """Saves private internal recruiter notes for a candidate application."""
        _, company = RecruiterService._get_recruiter_profile(db, user)

        app = db.query(Application).options(joinedload(Application.job)).filter(Application.id == application_id).first()
        if not app:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

        if user.role == UserRole.RECRUITER and app.job.company_id != company.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized.")

        app.recruiter_notes = notes
        db.commit()
        return {"application_id": app.id, "recruiter_notes": app.recruiter_notes, "updated": True}

    @staticmethod
    def schedule_candidate_interview(
        db: Session,
        user: User,
        application_id: str,
        payload: CandidateInterviewScheduleRequest
    ) -> Dict[str, Any]:
        """Schedules candidate interview round with mode, venue, and notifications."""
        _, company = RecruiterService._get_recruiter_profile(db, user)

        app = db.query(Application).options(
            joinedload(Application.job),
            joinedload(Application.student).joinedload(StudentProfile.user)
        ).filter(Application.id == application_id).first()

        if not app:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

        if user.role == UserRole.RECRUITER and app.job.company_id != company.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized.")

        interview = Interview(
            application_id=app.id,
            round_name=payload.round_name,
            scheduled_start=payload.scheduled_start,
            scheduled_end=payload.scheduled_end,
            meeting_link=payload.meeting_link,
            venue=payload.venue,
            interviewer_name=payload.interviewer_name,
            interview_mode=payload.interview_mode or "virtual",
            instructions=payload.instructions,
            status=InterviewStatusEnum.SCHEDULED,
            created_at=datetime.utcnow()
        )
        db.add(interview)

        # Advance status if in earlier stage
        if app.current_status in [ApplicationStatusEnum.APPLIED, ApplicationStatusEnum.SCREENING, ApplicationStatusEnum.SHORTLISTED]:
            old_s = app.current_status.value
            app.current_status = ApplicationStatusEnum.TECHNICAL_ROUND
            db.add(ApplicationStatusHistory(
                application_id=app.id,
                previous_status=old_s,
                new_status=ApplicationStatusEnum.TECHNICAL_ROUND.value,
                changed_by_user_id=user.id,
                change_reason=f"Interview scheduled: {payload.round_name}",
                created_at=datetime.utcnow()
            ))

        # Dispatch student notification
        if app.student and app.student.user:
            date_str = payload.scheduled_start.strftime("%b %d, %Y at %I:%M %p")
            mode_str = f"({payload.interview_mode.capitalize()})" if payload.interview_mode else ""
            db.add(Notification(
                user_id=app.student.user_id,
                title="Interview Scheduled!",
                message=f"An interview for '{app.job.title}' - {payload.round_name} {mode_str} is scheduled for {date_str}.",
                category="interview_schedule",
                notification_type=NotificationType.ACTION_REQUIRED,
                action_url="/student/applications"
            ))

        db.commit()
        db.refresh(interview)
        return {
            "interview_id": interview.id,
            "application_id": app.id,
            "round_name": interview.round_name,
            "interview_mode": interview.interview_mode,
            "scheduled_start": interview.scheduled_start,
            "scheduled_end": interview.scheduled_end,
            "meeting_link": interview.meeting_link,
            "venue": interview.venue,
            "interviewer_name": interview.interviewer_name,
            "status": interview.status.value
        }

    @staticmethod
    def record_interview_feedback(
        db: Session,
        user: User,
        interview_id: str,
        payload: InterviewFeedbackCreateRequest
    ) -> Dict[str, Any]:
        """Records technical, communication, and problem solving rating rubric for an interview."""
        _, company = RecruiterService._get_recruiter_profile(db, user)

        iv = db.query(Interview).options(
            joinedload(Interview.application).joinedload(Application.job),
            joinedload(Interview.feedback)
        ).filter(Interview.id == interview_id).first()

        if not iv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview record not found.")

        if user.role == UserRole.RECRUITER and iv.application.job.company_id != company.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized.")

        rec_str = payload.recommendation.lower()
        if rec_str not in InterviewRecommendationEnum._value2member_map_:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid recommendation: {payload.recommendation}")

        rec_enum = InterviewRecommendationEnum(rec_str)

        if iv.feedback:
            feedback = iv.feedback
            feedback.technical_rating = payload.technical_rating
            feedback.communication_rating = payload.communication_rating
            feedback.problem_solving_rating = payload.problem_solving_rating
            feedback.recommendation = rec_enum
            feedback.detailed_notes = payload.detailed_notes
            feedback.evaluator_user_id = user.id
            feedback.submitted_at = datetime.utcnow()
        else:
            feedback = InterviewFeedback(
                interview_id=iv.id,
                evaluator_user_id=user.id,
                technical_rating=payload.technical_rating,
                communication_rating=payload.communication_rating,
                problem_solving_rating=payload.problem_solving_rating,
                recommendation=rec_enum,
                detailed_notes=payload.detailed_notes,
                submitted_at=datetime.utcnow()
            )
            db.add(feedback)

        iv.status = InterviewStatusEnum.COMPLETED
        db.commit()
        db.refresh(feedback)

        return {
            "feedback_id": feedback.id,
            "interview_id": iv.id,
            "technical_rating": feedback.technical_rating,
            "communication_rating": feedback.communication_rating,
            "problem_solving_rating": feedback.problem_solving_rating,
            "recommendation": feedback.recommendation.value,
            "detailed_notes": feedback.detailed_notes,
            "submitted_at": feedback.submitted_at
        }
