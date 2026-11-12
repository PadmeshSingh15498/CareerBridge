"""
Job Service for CareerBridge.
Handles recruiter job requisitions, student discovery, search, eligibility gating,
bookmarking, and administrative job approvals.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import func, or_, and_, desc, asc
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.job import (
    Job, JobSkill, JobEligibility, SavedJob,
    JobTypeEnum, WorkplaceTypeEnum, JobStatusEnum, GenderPreferenceEnum
)
from app.models.recruiter import Company, RecruiterProfile
from app.models.student import StudentProfile, Skill, StudentSkill, SkillCategoryEnum
from app.models.application import Application
from app.models.user import User, UserRole, Notification, NotificationType
from app.schemas.job import JobCreateRequest, JobUpdateRequest
from app.ai.taxonomy import normalize_skill_name
from app.ai.matching import evaluate_candidate_for_job


class JobService:

    @staticmethod
    def _format_job_item(
        job: Job,
        match_result: Optional[Dict[str, Any]] = None,
        is_saved: bool = False,
        has_applied: bool = False,
        app_status: Optional[str] = None
    ) -> Dict[str, Any]:
        """Formats a Job ORM instance into standard response dict."""
        company_data = {
            "id": job.company.id if job.company else "",
            "name": job.company.name if job.company else "CareerBridge Partner",
            "website_url": job.company.website_url if job.company else "",
            "industry": job.company.industry if job.company else "Technology",
            "company_size": job.company.company_size.value if job.company and hasattr(job.company.company_size, "value") else "51-200",
            "headquarters": job.company.headquarters if job.company else None,
            "logo_url": job.company.logo_url if job.company else None,
            "is_verified": job.company.is_verified if job.company else True,
        }

        skills_data = []
        for js in (job.skills or []):
            if js.skill:
                skills_data.append({
                    "id": js.skill.id,
                    "name": js.skill.name,
                    "category": js.skill.category.value if hasattr(js.skill.category, "value") else str(js.skill.category),
                    "is_mandatory": js.is_mandatory,
                    "weight": float(js.weight),
                })

        eligibility_data = None
        if job.eligibility:
            eligibility_data = {
                "min_cgpa": float(job.eligibility.min_cgpa),
                "max_backlogs_allowed": job.eligibility.max_backlogs_allowed,
                "allowed_grad_years": list(job.eligibility.allowed_grad_years or []),
                "allowed_departments": list(job.eligibility.allowed_departments or []),
                "gender_preference": job.eligibility.gender_preference.value if hasattr(job.eligibility.gender_preference, "value") else str(job.eligibility.gender_preference),
            }

        applicants_cnt = len(job.applications) if hasattr(job, "applications") and job.applications is not None else 0

        match_score = None
        is_eligible = None
        if match_result:
            match_score = match_result.get("composite_score")
            is_eligible = match_result.get("is_eligible")

        return {
            "id": job.id,
            "title": job.title,
            "company": company_data,
            "job_type": job.job_type.value if hasattr(job.job_type, "value") else str(job.job_type),
            "workplace_type": job.workplace_type.value if hasattr(job.workplace_type, "value") else str(job.workplace_type),
            "location": job.location,
            "salary_min": float(job.salary_min) if job.salary_min is not None else None,
            "salary_max": float(job.salary_max) if job.salary_max is not None else None,
            "salary_currency": job.salary_currency or "INR",
            "vacancies": job.vacancies,
            "status": job.status.value if hasattr(job.status, "value") else str(job.status),
            "application_deadline": job.application_deadline,
            "created_at": job.created_at,
            "skills": skills_data,
            "eligibility": eligibility_data,
            "match_score": match_score,
            "is_eligible": is_eligible,
            "is_saved": is_saved,
            "has_applied": has_applied,
            "application_status": app_status,
            "applicants_count": applicants_cnt,
        }

    @staticmethod
    def create_job(db: Session, current_user: User, payload: JobCreateRequest) -> Job:
        """Creates a new job posting with skills and eligibility requirements."""
        if current_user.role not in [UserRole.RECRUITER, UserRole.TPO, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only authorized recruiters and placement officers can post jobs"
            )

        # Resolve company and poster
        company_id = None
        poster_id = None

        if current_user.role == UserRole.RECRUITER:
            recruiter = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == current_user.id).first()
            if not recruiter:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Recruiter profile not found. Please complete recruiter setup first."
                )
            company_id = recruiter.company_id
            poster_id = recruiter.id
        else:
            # TPO / Admin posting on behalf of campus partner
            recruiter = db.query(RecruiterProfile).first()
            if recruiter:
                company_id = recruiter.company_id
                poster_id = recruiter.id
            else:
                comp = db.query(Company).first()
                if not comp:
                    comp = Company(name="Campus Partner", website_url="https://careerbridge.edu", industry="Technology")
                    db.add(comp)
                    db.flush()
                recruiter = RecruiterProfile(user_id=current_user.id, company_id=comp.id, designation="Placement Coordinator")
                db.add(recruiter)
                db.flush()
                company_id = comp.id
                poster_id = recruiter.id

        # Validate deadline
        deadline = payload.application_deadline
        if deadline.tzinfo is not None:
            deadline = deadline.replace(tzinfo=None)
        if deadline <= datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Application deadline must be a future date and time"
            )

        # Status: TPO/Admin posts are immediately ACTIVE, Recruiters are PENDING_APPROVAL unless approved
        initial_status = JobStatusEnum.ACTIVE if current_user.role in [UserRole.TPO, UserRole.ADMIN] else JobStatusEnum.PENDING_APPROVAL

        # Format requirements string
        reqs = payload.requirements or ""
        if payload.recruitment_process:
            reqs += "\n\nRecruitment Process:\n" + "\n".join(f"- {stage}" for stage in payload.recruitment_process)

        # Create Job
        job = Job(
            company_id=company_id,
            posted_by=poster_id,
            title=payload.title,
            job_type=JobTypeEnum(payload.job_type) if payload.job_type in JobTypeEnum._value2member_map_ else JobTypeEnum.FULL_TIME,
            workplace_type=WorkplaceTypeEnum(payload.workplace_type) if payload.workplace_type in WorkplaceTypeEnum._value2member_map_ else WorkplaceTypeEnum.ON_SITE,
            location=payload.location,
            description=payload.description,
            requirements=reqs,
            salary_min=payload.salary_min,
            salary_max=payload.salary_max,
            salary_currency=payload.salary_currency,
            vacancies=payload.vacancies,
            status=initial_status,
            application_deadline=deadline,
        )
        db.add(job)
        db.flush()

        # Add Skills
        for skill_in in payload.skills:
            clean_name, category_str = normalize_skill_name(skill_in.name)
            # Find or create skill in master taxonomy
            db_skill = db.query(Skill).filter(Skill.name.ilike(clean_name)).first()
            if not db_skill:
                cat_enum = SkillCategoryEnum(category_str) if category_str in SkillCategoryEnum._value2member_map_ else SkillCategoryEnum.TOOL
                db_skill = Skill(name=clean_name, category=cat_enum)
                db.add(db_skill)
                db.flush()

            job_skill = JobSkill(
                job_id=job.id,
                skill_id=db_skill.id,
                is_mandatory=skill_in.is_mandatory,
                weight=skill_in.weight
            )
            db.add(job_skill)

        # Add Eligibility
        elig_in = payload.eligibility
        if elig_in:
            g_pref = GenderPreferenceEnum(elig_in.gender_preference) if elig_in.gender_preference in GenderPreferenceEnum._value2member_map_ else GenderPreferenceEnum.ANY
            job_elig = JobEligibility(
                job_id=job.id,
                min_cgpa=elig_in.min_cgpa,
                max_backlogs_allowed=elig_in.max_backlogs_allowed,
                allowed_grad_years=elig_in.allowed_grad_years,
                allowed_departments=elig_in.allowed_departments,
                gender_preference=g_pref
            )
            db.add(job_elig)
        else:
            # Default open eligibility
            job_elig = JobEligibility(
                job_id=job.id,
                min_cgpa=0.0,
                max_backlogs_allowed=2,
                allowed_grad_years=[2025, 2026, 2027],
                allowed_departments=[],
                gender_preference=GenderPreferenceEnum.ANY
            )
            db.add(job_elig)

        # Audit notification for Placement Officers if pending approval
        if initial_status == JobStatusEnum.PENDING_APPROVAL:
            tpos = db.query(User).filter(User.role.in_([UserRole.TPO, UserRole.ADMIN])).all()
            for tpo in tpos:
                db.add(Notification(
                    user_id=tpo.id,
                    title="New Job Requires Approval",
                    message=f"Recruiter posted '{job.title}'. Review and approve to publish on campus portal.",
                    notification_type=NotificationType.ACTION_REQUIRED,
                    action_url=f"/admin/jobs"
                ))

        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def get_jobs(
        db: Session,
        current_user: Optional[User] = None,
        search: Optional[str] = None,
        job_type: Optional[str] = None,
        workplace_type: Optional[str] = None,
        location: Optional[str] = None,
        min_salary: Optional[float] = None,
        department: Optional[str] = None,
        skill: Optional[str] = None,
        status_filter: Optional[str] = None,
        saved_only: bool = False,
        sort_by: str = "newest",  # newest, match_score, salary, deadline
        page: int = 1,
        page_size: int = 12
    ) -> Dict[str, Any]:
        """Lists and filters jobs with personalized match intelligence for students."""
        query = db.query(Job).options(
            joinedload(Job.company),
            joinedload(Job.skills).joinedload(JobSkill.skill),
            joinedload(Job.eligibility),
            joinedload(Job.applications)
        )

        # Context-aware role visibility
        is_student = current_user and current_user.role == UserRole.STUDENT
        student_profile = None
        saved_job_ids: Set[str] = set()
        applied_map: Dict[str, str] = {}  # job_id -> app_status

        if is_student:
            student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
            if student_profile:
                # Get saved jobs
                saved_jobs = db.query(SavedJob.job_id).filter(SavedJob.student_id == student_profile.id).all()
                saved_job_ids = {s[0] for s in saved_jobs}

                # Get applied jobs
                apps = db.query(Application.job_id, Application.current_status).filter(
                    Application.student_id == student_profile.id
                ).all()
                applied_map = {a[0]: (a[1].value if hasattr(a[1], "value") else str(a[1])) for a in apps}

            # Students only see ACTIVE jobs
            query = query.filter(Job.status == JobStatusEnum.ACTIVE)
        elif current_user and current_user.role == UserRole.RECRUITER:
            recruiter = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == current_user.id).first()
            if recruiter:
                query = query.filter(Job.company_id == recruiter.company_id)
            if status_filter:
                query = query.filter(Job.status == status_filter)
        elif current_user and current_user.role in [UserRole.TPO, UserRole.ADMIN]:
            if status_filter:
                query = query.filter(Job.status == status_filter)
        else:
            # Public / Guest
            query = query.filter(Job.status == JobStatusEnum.ACTIVE)

        # Search filter
        if search and search.strip():
            sterm = f"%{search.strip()}%"
            query = query.join(Job.company).filter(
                or_(
                    Job.title.ilike(sterm),
                    Company.name.ilike(sterm),
                    Job.description.ilike(sterm),
                    Job.location.ilike(sterm)
                )
            )

        # Facet filters
        if job_type:
            query = query.filter(Job.job_type == job_type)
        if workplace_type:
            query = query.filter(Job.workplace_type == workplace_type)
        if location and location.strip():
            query = query.filter(Job.location.ilike(f"%{location.strip()}%"))
        if min_salary is not None and min_salary > 0:
            query = query.filter(or_(Job.salary_min >= min_salary, Job.salary_max >= min_salary))

        # Saved jobs only filter
        if saved_only and is_student:
            if not saved_job_ids:
                return {
                    "items": [],
                    "total": 0,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": 0
                }
            query = query.filter(Job.id.in_(list(saved_job_ids)))

        all_matching_jobs = query.all()

        # In-memory candidate match scoring & department/skill filtering
        evaluated_jobs = []
        for job in all_matching_jobs:
            # Department filter
            if department and job.eligibility and job.eligibility.allowed_departments:
                from app.ai.matching import check_department_match
                if not check_department_match(department, job.eligibility.allowed_departments):
                    continue

            # Skill filter
            if skill:
                skill_names = [js.skill.name.lower() for js in (job.skills or []) if js.skill]
                if skill.lower() not in skill_names:
                    continue

            match_res = None
            if student_profile:
                match_res = evaluate_candidate_for_job(student_profile, job)

            item = JobService._format_job_item(
                job=job,
                match_result=match_res,
                is_saved=(job.id in saved_job_ids),
                has_applied=(job.id in applied_map),
                app_status=applied_map.get(job.id)
            )
            evaluated_jobs.append(item)

        # Sorting
        if sort_by == "match_score" and is_student:
            evaluated_jobs.sort(key=lambda x: (x.get("match_score") or 0.0), reverse=True)
        elif sort_by == "salary":
            evaluated_jobs.sort(key=lambda x: (x.get("salary_max") or x.get("salary_min") or 0.0), reverse=True)
        elif sort_by == "deadline":
            evaluated_jobs.sort(key=lambda x: x["application_deadline"])
        else:  # newest
            evaluated_jobs.sort(key=lambda x: x["created_at"], reverse=True)

        total = len(evaluated_jobs)
        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        start_idx = (page - 1) * page_size
        paginated_items = evaluated_jobs[start_idx:start_idx + page_size]

        return {
            "items": paginated_items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }

    @staticmethod
    def get_job_detail(db: Session, job_id: str, current_user: Optional[User] = None) -> Dict[str, Any]:
        """Gets full job specification with personalized match intelligence breakdown."""
        job = db.query(Job).options(
            joinedload(Job.company),
            joinedload(Job.skills).joinedload(JobSkill.skill),
            joinedload(Job.eligibility),
            joinedload(Job.applications)
        ).filter(Job.id == job_id).first()

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job opening not found")

        is_student = current_user and current_user.role == UserRole.STUDENT
        student_profile = None
        is_saved = False
        has_applied = False
        app_status = None
        match_res = None

        if is_student:
            student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
            if student_profile:
                is_saved = db.query(SavedJob).filter(
                    SavedJob.student_id == student_profile.id,
                    SavedJob.job_id == job.id
                ).first() is not None

                existing_app = db.query(Application).filter(
                    Application.student_id == student_profile.id,
                    Application.job_id == job.id
                ).first()
                if existing_app:
                    has_applied = True
                    app_status = existing_app.current_status.value if hasattr(existing_app.current_status, "value") else str(existing_app.current_status)

                match_res = evaluate_candidate_for_job(student_profile, job)

        base_item = JobService._format_job_item(
            job=job,
            match_result=match_res,
            is_saved=is_saved,
            has_applied=has_applied,
            app_status=app_status
        )

        base_item["description"] = job.description
        base_item["requirements"] = job.requirements
        base_item["posted_by_name"] = job.poster.user.email if (job.poster and job.poster.user) else "CareerBridge Team"
        base_item["recruitment_process"] = [
            "Resume Screening & Eligibility Audit",
            "Technical Skill Evaluation",
            "Technical Domain Interview",
            "HR & Leadership Fitment",
            "Final Placement Offer"
        ]
        base_item["match_breakdown"] = match_res

        return base_item

    @staticmethod
    def toggle_save_job(db: Session, student_user: User, job_id: str) -> bool:
        """Toggles bookmarking of a job for a student. Returns True if saved, False if removed."""
        if student_user.role != UserRole.STUDENT:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can save jobs")

        student = db.query(StudentProfile).filter(StudentProfile.user_id == student_user.id).first()
        if not student:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Student profile not found")

        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        saved = db.query(SavedJob).filter(
            SavedJob.student_id == student.id,
            SavedJob.job_id == job_id
        ).first()

        if saved:
            db.delete(saved)
            db.commit()
            return False
        else:
            new_saved = SavedJob(student_id=student.id, job_id=job_id)
            db.add(new_saved)
            db.commit()
            return True

    @staticmethod
    def approve_job(db: Session, admin_user: User, job_id: str, approved: bool) -> Job:
        """Placement Officer / Administrator approves or rejects a pending job requisition."""
        if admin_user.role not in [UserRole.TPO, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Placement Officers and Administrators can approve job postings"
            )

        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        new_status = JobStatusEnum.ACTIVE if approved else JobStatusEnum.CLOSED
        job.status = new_status

        # Notify the recruiter who posted it
        if job.poster and job.poster.user_id:
            verdict = "Approved and published to campus students" if approved else "Declined by university placement officer"
            db.add(Notification(
                user_id=job.poster.user_id,
                title=f"Job Posting {job.status.value.upper()}",
                message=f"Requisition for '{job.title}' was {verdict}.",
                notification_type=NotificationType.SUCCESS if approved else NotificationType.WARNING,
                action_url=f"/recruiter/jobs"
            ))

        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def update_job_status(db: Session, current_user: User, job_id: str, new_status: str) -> Job:
        """Allows recruiter or placement officer to change a job's status."""
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        # Authorization check
        if current_user.role == UserRole.RECRUITER:
            recruiter = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == current_user.id).first()
            if not recruiter or recruiter.company_id != job.company_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized for this company's jobs")
        elif current_user.role not in [UserRole.TPO, UserRole.ADMIN]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

        if new_status not in JobStatusEnum._value2member_map_:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status: {new_status}")

        target_status_enum = JobStatusEnum(new_status)
        if target_status_enum == JobStatusEnum.ACTIVE and current_user.role == UserRole.RECRUITER:
            if not job.company or not (job.company.is_verified or getattr(job.company, "verification_status", "") == "verified"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Your organization verification is pending review by the Placement Cell. Requisitions cannot be published as ACTIVE until verified."
                )

        job.status = target_status_enum
        db.commit()
        db.refresh(job)
        return job

