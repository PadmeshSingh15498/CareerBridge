"""
Application Lifecycle & Candidate Tracking Engine for CareerBridge.
Enforces eligibility gating, 1-click apply, immutable audit trail,
stage advancement, interview scheduling, and notifications.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.application import (
    Application, ApplicationStatusHistory, Interview, InterviewFeedback,
    ApplicationStatusEnum, InterviewStatusEnum
)
from app.models.job import Job, JobStatusEnum
from app.models.resume import Resume
from app.models.student import StudentProfile
from app.models.recruiter import RecruiterProfile
from app.models.user import User, UserRole, Notification, NotificationType
from app.schemas.application import (
    ApplicationCreateRequest, ApplicationStatusUpdateRequest,
    InterviewScheduleRequest, ApplicationWithdrawRequest
)
from app.ai.matching import evaluate_candidate_for_job


class ApplicationService:

    @staticmethod
    def _format_application(app: Application) -> Dict[str, Any]:
        """Formats an Application ORM object into a comprehensive DTO dictionary."""
        student = app.student
        job = app.job
        company = job.company if job else None

        # Academic info
        academic = student.academic_records[0] if (student and student.academic_records) else None
        cgpa = float(academic.cgpa_or_percentage) if academic and academic.cgpa_or_percentage is not None else None
        dept = academic.department if academic else None

        # Skills list
        skills = []
        if student and student.skills:
            for s in student.skills:
                if s.skill:
                    skills.append(s.skill.name)

        # Status history
        history_items = []
        for h in sorted(app.status_history or [], key=lambda x: x.created_at):
            history_items.append({
                "id": h.id,
                "previous_status": h.previous_status,
                "new_status": h.new_status,
                "change_reason": h.change_reason,
                "created_at": h.created_at,
            })

        # Interviews
        interview_items = []
        for iv in sorted(app.interviews or [], key=lambda x: x.scheduled_start):
            interview_items.append({
                "id": iv.id,
                "round_name": iv.round_name,
                "scheduled_start": iv.scheduled_start,
                "scheduled_end": iv.scheduled_end,
                "meeting_link": iv.meeting_link,
                "venue": iv.venue,
                "interviewer_name": iv.interviewer_name,
                "status": iv.status.value if hasattr(iv.status, "value") else str(iv.status),
                "created_at": iv.created_at,
            })

        # Salary string
        sal_range = None
        if job and job.salary_min and job.salary_max:
            sal_range = f"₹{float(job.salary_min):,.0f} - ₹{float(job.salary_max):,.0f}"

        return {
            "id": app.id,
            "job_id": app.job_id,
            "student_id": app.student_id,
            "resume_id": app.resume_id,
            "current_status": app.current_status.value if hasattr(app.current_status, "value") else str(app.current_status),
            "composite_match_score": float(app.composite_match_score) if app.composite_match_score is not None else 0.0,
            "cover_letter": app.cover_letter,
            "applied_at": app.applied_at,
            "job_title": job.title if job else "Software Engineer",
            "company_name": company.name if company else "Campus Partner",
            "company_logo": company.logo_url if company else None,
            "job_location": job.location if job else "Bengaluru",
            "job_type": job.job_type.value if job and hasattr(job.job_type, "value") else "full_time",
            "salary_range": sal_range,
            "candidate_name": student.full_name if student else "Candidate",
            "candidate_email": student.user.email if (student and student.user) else None,
            "candidate_roll_number": student.roll_number if student else None,
            "candidate_cgpa": cgpa,
            "candidate_department": dept,
            "candidate_skills": skills,
            "status_history": history_items,
            "interviews": interview_items,
        }

    @staticmethod
    def apply_to_job(db: Session, student_user: User, payload: ApplicationCreateRequest) -> Dict[str, Any]:
        """
        Processes student job application with complete verification:
        1. Authentication & student profile check
        2. Job existence & ACTIVE status check
        3. Application deadline verification
        4. Duplicate application prevention
        5. Hard eligibility criteria gating (CGPA, backlogs, department, grad year)
        6. Resume ownership verification
        7. AI composite match score calculation
        8. Audit logging & notifications
        """
        if student_user.role != UserRole.STUDENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only students can apply to job openings"
            )

        student = db.query(StudentProfile).filter(StudentProfile.user_id == student_user.id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student profile must be created before applying to jobs"
            )

        # 2. Check Job status
        job = db.query(Job).options(
            joinedload(Job.company),
            joinedload(Job.skills),
            joinedload(Job.eligibility)
        ).filter(Job.id == payload.job_id).first()

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job opening not found")

        if job.status != JobStatusEnum.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Job opening is currently {job.status.value}. Only active openings accept applications."
            )

        # 3. Check Deadline
        deadline = job.application_deadline
        if deadline.tzinfo is not None:
            deadline = deadline.replace(tzinfo=None)
        if deadline < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The application deadline for this position has passed"
            )

        # 4. Check Duplicate Application
        existing = db.query(Application).filter(
            Application.job_id == job.id,
            Application.student_id == student.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted an application for this position"
            )

        # 5. Check Resume Ownership
        resume = db.query(Resume).filter(
            Resume.id == payload.resume_id,
            Resume.student_id == student.id
        ).first()
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Specified resume does not exist or does not belong to your account"
            )

        # 6. Hard Eligibility Criteria Check
        resume_raw = resume.analysis.raw_text if (hasattr(resume, "analysis") and resume.analysis) else getattr(resume, "raw_text", "")
        match_eval = evaluate_candidate_for_job(student, job, resume_text=resume_raw)
        if not match_eval["is_eligible"]:
            reasons = "; ".join(match_eval["eligibility_breakdown"]["reasons_if_ineligible"])
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Academic eligibility requirement not met: {reasons}"
            )

        # 7. AI Match Score (Score recorded for recruiter ranking, NOT for rejection)
        composite_score = match_eval.get("composite_score", 50.0)

        # 8. Create Application
        application = Application(
            job_id=job.id,
            student_id=student.id,
            resume_id=resume.id,
            current_status=ApplicationStatusEnum.APPLIED,
            cover_letter=payload.cover_letter,
            composite_match_score=composite_score,
            applied_at=datetime.utcnow()
        )
        db.add(application)
        db.flush()

        # 9. Initial Audit Trail
        history_entry = ApplicationStatusHistory(
            application_id=application.id,
            previous_status=None,
            new_status=ApplicationStatusEnum.APPLIED.value,
            changed_by_user_id=student_user.id,
            change_reason="Initial application submitted by student",
            created_at=datetime.utcnow()
        )
        db.add(history_entry)

        # 10. Confirmation Notifications
        # Student confirmation
        comp_name = job.company.name if job.company else "Campus Partner"
        db.add(Notification(
            user_id=student_user.id,
            title="Application Submitted",
            message=f"Your application for '{job.title}' at {comp_name} was successfully submitted.",
            category="application_status",
            notification_type=NotificationType.SUCCESS,
            action_url=f"/student/applications"
        ))

        # Recruiter notification
        if job.poster and job.poster.user_id:
            db.add(Notification(
                user_id=job.poster.user_id,
                title="New Applicant Received",
                message=f"{student.full_name} applied for '{job.title}' with compatibility score of {composite_score}%.",
                category="new_applications",
                notification_type=NotificationType.INFO,
                action_url=f"/recruiter/applicants"
            ))

        db.commit()
        db.refresh(application)
        return ApplicationService._format_application(application)

    @staticmethod
    def get_student_applications(db: Session, student_user: User) -> List[Dict[str, Any]]:
        """Returns all applications submitted by the logged-in student."""
        if student_user.role != UserRole.STUDENT:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can access student applications")

        student = db.query(StudentProfile).filter(StudentProfile.user_id == student_user.id).first()
        if not student:
            return []

        apps = db.query(Application).options(
            joinedload(Application.job).joinedload(Job.company),
            joinedload(Application.student).joinedload(StudentProfile.academic_records),
            joinedload(Application.student).joinedload(StudentProfile.skills).joinedload(StudentSkill.skill),
            joinedload(Application.status_history),
            joinedload(Application.interviews)
        ).filter(
            Application.student_id == student.id
        ).order_by(desc(Application.applied_at)).all()

        return [ApplicationService._format_application(a) for a in apps]

    @staticmethod
    def get_recruiter_applications(
        db: Session,
        recruiter_user: User,
        job_id: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Returns candidate applications for a recruiter's company, sorted by AI Match Score."""
        if recruiter_user.role not in [UserRole.RECRUITER, UserRole.TPO, UserRole.ADMIN]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access")

        query = db.query(Application).options(
            joinedload(Application.job).joinedload(Job.company),
            joinedload(Application.student).joinedload(StudentProfile.user),
            joinedload(Application.student).joinedload(StudentProfile.academic_records),
            joinedload(Application.student).joinedload(StudentProfile.skills).joinedload(StudentSkill.skill),
            joinedload(Application.status_history),
            joinedload(Application.interviews)
        ).join(Application.job)

        # Company scope
        if recruiter_user.role == UserRole.RECRUITER:
            recruiter = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == recruiter_user.id).first()
            if not recruiter:
                return []
            query = query.filter(Job.company_id == recruiter.company_id)

        # Job scope
        if job_id:
            query = query.filter(Application.job_id == job_id)

        # Status filter
        if status_filter:
            query = query.filter(Application.current_status == status_filter)

        # Order by composite match score descending
        apps = query.order_by(desc(Application.composite_match_score), desc(Application.applied_at)).all()
        return [ApplicationService._format_application(a) for a in apps]

    @staticmethod
    def update_application_status(
        db: Session,
        current_user: User,
        application_id: str,
        payload: ApplicationStatusUpdateRequest
    ) -> Dict[str, Any]:
        """
        Official status advancement by recruiter or administrator.
        Validates authority, updates state, and appends to immutable history.
        """
        if current_user.role not in [UserRole.RECRUITER, UserRole.TPO, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only recruiters and placement officers can change application status"
            )

        app = db.query(Application).options(
            joinedload(Application.job),
            joinedload(Application.student).joinedload(StudentProfile.user)
        ).filter(Application.id == application_id).first()

        if not app:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

        # Security check: Recruiter can only modify applications for their company's jobs
        if current_user.role == UserRole.RECRUITER:
            recruiter = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == current_user.id).first()
            if not recruiter or recruiter.company_id != app.job.company_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot modify applications belonging to other companies"
                )

        # Validate status enum
        target_status = payload.new_status.lower()
        if target_status not in ApplicationStatusEnum._value2member_map_:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid application status: {payload.new_status}. Allowed: {list(ApplicationStatusEnum._value2member_map_.keys())}"
            )

        old_status_val = app.current_status.value if hasattr(app.current_status, "value") else str(app.current_status)
        new_status_enum = ApplicationStatusEnum(target_status)

        # Update application
        app.current_status = new_status_enum

        # Record history
        history = ApplicationStatusHistory(
            application_id=app.id,
            previous_status=old_status_val,
            new_status=new_status_enum.value,
            changed_by_user_id=current_user.id,
            change_reason=payload.change_reason or f"Status advanced to {new_status_enum.value.replace('_', ' ').title()}",
            created_at=datetime.utcnow()
        )
        db.add(history)

        # Notify student
        if app.student and app.student.user:
            readable_status = new_status_enum.value.replace("_", " ").title()
            db.add(Notification(
                user_id=app.student.user_id,
                title="Application Status Updated",
                message=f"Your application for '{app.job.title}' moved to '{readable_status}'.",
                notification_type=NotificationType.SUCCESS if target_status in ["shortlisted", "offered"] else NotificationType.INFO,
                action_url=f"/student/applications"
            ))

        db.commit()
        db.refresh(app)
        return ApplicationService._format_application(app)

    @staticmethod
    def withdraw_application(
        db: Session,
        student_user: User,
        application_id: str,
        payload: ApplicationWithdrawRequest
    ) -> Dict[str, Any]:
        """Allows a student to voluntarily withdraw an active application."""
        if student_user.role != UserRole.STUDENT:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can withdraw their application")

        student = db.query(StudentProfile).filter(StudentProfile.user_id == student_user.id).first()
        if not student:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Student profile not found")

        app = db.query(Application).filter(
            Application.id == application_id,
            Application.student_id == student.id
        ).first()

        if not app:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found or unauthorized")

        if app.current_status == ApplicationStatusEnum.WITHDRAWN:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Application is already withdrawn")

        old_status = app.current_status.value if hasattr(app.current_status, "value") else str(app.current_status)
        app.current_status = ApplicationStatusEnum.WITHDRAWN

        history = ApplicationStatusHistory(
            application_id=app.id,
            previous_status=old_status,
            new_status=ApplicationStatusEnum.WITHDRAWN.value,
            changed_by_user_id=student_user.id,
            change_reason=payload.reason or "Voluntarily withdrawn by student",
            created_at=datetime.utcnow()
        )
        db.add(history)
        db.commit()
        db.refresh(app)
        return ApplicationService._format_application(app)

    @staticmethod
    def schedule_interview(
        db: Session,
        current_user: User,
        application_id: str,
        payload: InterviewScheduleRequest
    ) -> Dict[str, Any]:
        """Schedules a formal interview round for a shortlisted application."""
        if current_user.role not in [UserRole.RECRUITER, UserRole.TPO, UserRole.ADMIN]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

        app = db.query(Application).options(
            joinedload(Application.job),
            joinedload(Application.student).joinedload(StudentProfile.user)
        ).filter(Application.id == application_id).first()

        if not app:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

        # Create Interview record
        interview = Interview(
            application_id=app.id,
            round_name=payload.round_name,
            scheduled_start=payload.scheduled_start,
            scheduled_end=payload.scheduled_end,
            meeting_link=payload.meeting_link,
            venue=payload.venue,
            interviewer_name=payload.interviewer_name,
            status=InterviewStatusEnum.SCHEDULED,
            created_at=datetime.utcnow()
        )
        db.add(interview)

        # Move status to TECHNICAL_ROUND if currently APPLIED or SCREENING
        if app.current_status in [ApplicationStatusEnum.APPLIED, ApplicationStatusEnum.SCREENING, ApplicationStatusEnum.SHORTLISTED]:
            app.current_status = ApplicationStatusEnum.TECHNICAL_ROUND
            db.add(ApplicationStatusHistory(
                application_id=app.id,
                previous_status=app.current_status.value,
                new_status=ApplicationStatusEnum.TECHNICAL_ROUND.value,
                changed_by_user_id=current_user.id,
                change_reason=f"Interview scheduled: {payload.round_name}",
                created_at=datetime.utcnow()
            ))

        # Notify student
        if app.student and app.student.user:
            start_str = payload.scheduled_start.strftime("%b %d, %Y at %I:%M %p")
            db.add(Notification(
                user_id=app.student.user_id,
                title="Interview Scheduled!",
                message=f"An interview for '{app.job.title}' ({payload.round_name}) has been scheduled for {start_str}.",
                notification_type=NotificationType.ACTION_REQUIRED,
                action_url=f"/student/applications"
            ))

        db.commit()
        db.refresh(app)
        return ApplicationService._format_application(app)
