from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User, UserRole, Notification
from app.models.student import (
    StudentProfile, PlacementStatusEnum, AcademicRecord, StudentSkill, Skill, StudentProject
)
from app.models.recruiter import Company, RecruiterProfile
from app.models.job import Job, JobStatusEnum, JobSkill
from app.models.application import (
    Application, ApplicationStatusEnum, Interview, InterviewStatusEnum
)
from app.models.resume import Resume, ResumeAnalysis
from app.models.ai import SkillGapAnalysis, CareerRoadmap, RoadmapItem
from app.models.drive import PlacementDrive
from app.schemas.dashboard import (
    StudentDashboardResponse, StudentReadinessBreakdown, StudentProfileCompletion,
    ResumeHealthInfo, RecommendedJobItem, ActiveApplicationItem, UpcomingInterviewItem,
    SkillGapSummary, StudentRoadmapPreview, RoadmapMilestoneItem, ActivityItem, StudentQuickStats,
    RecruiterDashboardResponse, RecruiterStats, RecruiterPipelineStages, RecruiterJobItem,
    RecruiterApplicantItem, JobPerformanceMetrics, CandidateMatchInsight,
    AdminDashboardResponse, AdminOverviewStats, DepartmentPlacementStat, CompanyRecruitmentStat,
    PlacementDriveItem, PendingActionsOverview
)


class DashboardService:

    @staticmethod
    def get_student_dashboard(db: Session, user: Optional[User] = None) -> StudentDashboardResponse:
        # If user is not provided, fetch default demo student
        if not user or user.role != UserRole.STUDENT:
            user = db.query(User).filter(User.email == "student@careerbridge.com").first()

        profile = None
        if user:
            profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()

        if not profile:
            profile = db.query(StudentProfile).first()

        # 1. Academic record
        academic = db.query(AcademicRecord).filter(AcademicRecord.student_id == profile.id).first()
        cgpa = float(academic.cgpa_or_percentage) if academic and academic.cgpa_or_percentage else 8.50
        dept = academic.department if academic else "Computer Science"
        inst = academic.institution_name if academic else "National Institute of Technology"

        # 2. Student Skills
        student_skills = db.query(StudentSkill).filter(StudentSkill.student_id == profile.id).all()
        verified_skill_names = []
        for ss in student_skills:
            sk = db.query(Skill).filter(Skill.id == ss.skill_id).first()
            if sk:
                verified_skill_names.append(sk.name)

        # 3. Resume & ATS Analysis
        resume = db.query(Resume).filter(Resume.student_id == profile.id).first()
        analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume.id).first() if resume else None

        ats_score = analysis.ats_score if analysis else 88
        section_score = analysis.section_score if analysis else 23
        skill_score = analysis.skill_score if analysis else 26
        metric_score = analysis.metric_score if analysis else 21
        format_score = analysis.format_score if analysis else 18
        actionable_tips = analysis.improvements_json if analysis and analysis.improvements_json else [
            "Quantify impact with metrics in project bullet points.",
            "Add distributed system design concepts to technical competencies.",
            "Demonstrate automated unit and integration testing experience."
        ]

        resume_info = ResumeHealthInfo(
            ats_score=ats_score,
            sections_score=section_score,
            skills_score=skill_score,
            metrics_score=metric_score,
            formatting_score=format_score,
            actionable_tips=actionable_tips,
            file_name=resume.file_name if resume else "aditya_sharma_swe.pdf"
        )

        # 4. Profile completion calculation
        completed_checks = 0
        total_checks = 6
        missing_items = []
        if profile.bio: completed_checks += 1
        else: missing_items.append("Add a professional career summary")
        if profile.phone_number: completed_checks += 1
        else: missing_items.append("Verify contact phone number")
        if academic: completed_checks += 1
        else: missing_items.append("Complete academic background")
        if len(student_skills) >= 5: completed_checks += 1
        else: missing_items.append("Add at least 5 verified technical skills")
        if resume: completed_checks += 1
        else: missing_items.append("Upload primary ATS resume")
        if profile.linkedin_url or profile.github_url: completed_checks += 1
        else: missing_items.append("Connect GitHub or LinkedIn portfolio")

        completion_pct = int((completed_checks / total_checks) * 100)

        # 5. Career Readiness Score (CRI 6-pillar engine)
        try:
            from app.services.career_intelligence_service import CareerIntelligenceService
            cri_data = CareerIntelligenceService.calculate_and_record_readiness(db, profile.id, save_snapshot=False)
            readiness_score = int(cri_data["overall_score"])
            cat_scores = cri_data["category_scores"]
            breakdown = StudentReadinessBreakdown(
                resume_health=int(cat_scores["resume_quality"]["percentage"]),
                skill_coverage=int(cat_scores["technical_skills"]["percentage"]),
                interview_preparedness=int(cat_scores["interview_preparation"]["percentage"]) if cat_scores["interview_preparation"]["percentage"] > 0 else 80,
                academic_eligibility=int(cat_scores["academic_eligibility"]["percentage"])
            )
        except Exception:
            readiness_score = int(ats_score * 0.35 + min(100, len(student_skills) * 12) * 0.35 + min(100, cgpa * 10) * 0.30)
            readiness_score = min(98, max(40, readiness_score))
            breakdown = StudentReadinessBreakdown(
                resume_health=ats_score,
                skill_coverage=min(95, len(student_skills) * 12),
                interview_preparedness=84,
                academic_eligibility=min(98, int(cgpa * 10))
            )

        # 6. Recommended Jobs
        jobs = db.query(Job).filter(Job.status == JobStatusEnum.ACTIVE).limit(4).all()
        recommended_jobs: List[RecommendedJobItem] = []
        for j in jobs:
            comp = db.query(Company).filter(Company.id == j.company_id).first()
            smin = int(j.salary_min / 100000) if j.salary_min else 12
            smax = int(j.salary_max / 100000) if j.salary_max else 18
            recommended_jobs.append(RecommendedJobItem(
                id=j.id,
                title=j.title,
                company_name=comp.name if comp else "Tech Corp",
                company_logo=comp.logo_url if comp else None,
                location=j.location,
                workplace_type=j.workplace_type.value if hasattr(j.workplace_type, "value") else str(j.workplace_type),
                salary_range=f"₹{smin} - ₹{smax} LPA",
                match_percentage=91.4 if "Google" in (comp.name if comp else "") else 88.0,
                deadline=j.application_deadline.strftime("%b %d, %Y") if j.application_deadline else "Rolling",
                top_matching_skills=["Python", "FastAPI", "MySQL", "Docker"]
            ))

        # 7. Active Applications
        apps = db.query(Application).filter(Application.student_id == profile.id).all()
        active_apps: List[ActiveApplicationItem] = []
        for a in apps:
            j = db.query(Job).filter(Job.id == a.job_id).first()
            comp = db.query(Company).filter(Company.id == j.company_id).first() if j else None
            active_apps.append(ActiveApplicationItem(
                id=a.id,
                job_id=a.job_id,
                job_title=j.title if j else "Software Engineer",
                company_name=comp.name if comp else "Tech Corp",
                status=a.current_status.value if hasattr(a.current_status, "value") else str(a.current_status),
                composite_match_score=float(a.composite_match_score) if a.composite_match_score else 85.0,
                applied_at=a.applied_at.strftime("%b %d, %Y") if a.applied_at else "Recently"
            ))

        # 8. Upcoming Interviews
        interviews = db.query(Interview).join(Application).filter(
            Application.student_id == profile.id,
            Interview.status == InterviewStatusEnum.SCHEDULED
        ).all()
        upcoming_interviews: List[UpcomingInterviewItem] = []
        for itv in interviews:
            app_obj = db.query(Application).filter(Application.id == itv.application_id).first()
            j = db.query(Job).filter(Job.id == app_obj.job_id).first() if app_obj else None
            comp = db.query(Company).filter(Company.id == j.company_id).first() if j else None
            upcoming_interviews.append(UpcomingInterviewItem(
                id=itv.id,
                company_name=comp.name if comp else "Google Cloud",
                round_name=itv.round_name,
                scheduled_start=itv.scheduled_start.strftime("%A, %b %d • %I:%M %p UTC") if itv.scheduled_start else "Tomorrow at 2:00 PM",
                interviewer_name=itv.interviewer_name or "Sarah Chen (Staff Architect)",
                meeting_link=itv.meeting_link or "https://meet.google.com/xyz-cbqj-cbr",
                venue=itv.venue or "Virtual Google Meet",
                status=itv.status.value if hasattr(itv.status, "value") else str(itv.status)
            ))

        # If no interview in db, provide realistic scheduled interview
        if not upcoming_interviews:
            upcoming_interviews.append(UpcomingInterviewItem(
                id="itv-demo-1",
                company_name="Google Cloud",
                round_name="Technical Round II - Systems & Cloud Architecture",
                scheduled_start="Tomorrow • 2:00 PM IST",
                interviewer_name="Sarah Chen (Staff Systems Architect)",
                meeting_link="https://meet.google.com/xyz-cbqj-cbr",
                venue="Virtual Google Meet",
                status="scheduled"
            ))

        # 9. Skill Gap & Roadmap
        gap = db.query(SkillGapAnalysis).filter(SkillGapAnalysis.student_id == profile.id).first()
        
        crit_skills: List[str] = []
        if gap and gap.critical_missing_skills:
            for item in gap.critical_missing_skills:
                crit_skills.append(item.get("skill_name", str(item)) if isinstance(item, dict) else str(item))
        if not crit_skills:
            crit_skills = ["Kubernetes", "Kafka", "System Design"]

        sec_skills: List[str] = []
        if gap and gap.secondary_missing_skills:
            for item in gap.secondary_missing_skills:
                sec_skills.append(item.get("skill_name", str(item)) if isinstance(item, dict) else str(item))
        if not sec_skills:
            sec_skills = ["Terraform", "Prometheus"]

        skill_gap_summary = SkillGapSummary(
            target_role=gap.target_role if gap else "Cloud Infrastructure Engineer",
            readiness_percentage=float(gap.readiness_percentage) if gap else 82.4,
            critical_missing_skills=crit_skills,
            secondary_missing_skills=sec_skills,
            verified_skills=verified_skill_names if verified_skill_names else ["Python", "FastAPI", "React", "Docker", "MySQL"],
            summary=gap.summary if gap else "Strong foundation in backend APIs and databases. Focus next on container orchestration (Kubernetes) and event brokers (Kafka) to unlock 95%+ readiness."
        )

        roadmap = db.query(CareerRoadmap).filter(CareerRoadmap.student_id == profile.id).first()
        milestones = []
        if roadmap:
            items = db.query(RoadmapItem).filter(RoadmapItem.roadmap_id == roadmap.id).order_by(RoadmapItem.week_number).all()
            for item in items:
                milestones.append(RoadmapMilestoneItem(
                    week_number=item.week_number,
                    milestone_title=item.milestone_title,
                    description=item.description,
                    suggested_project=item.suggested_project,
                    is_completed=item.is_completed
                ))
        if not milestones:
            milestones = [
                RoadmapMilestoneItem(week_number=1, milestone_title="Docker Networking & Multi-Stage Builds", description="Production image hardening and container networking topologies.", suggested_project=None, is_completed=True),
                RoadmapMilestoneItem(week_number=2, milestone_title="Kubernetes Core & Pod Orchestration", description="Deploy StatefulSets, ingress controllers, and config maps on minikube.", suggested_project="Microservice Ingress Controller", is_completed=False),
                RoadmapMilestoneItem(week_number=3, milestone_title="Distributed Messaging with Apache Kafka", description="Implement partition keys, consumer groups, and idempotent publishers.", suggested_project=None, is_completed=False),
                RoadmapMilestoneItem(week_number=4, milestone_title="High-Availability Relational & In-Memory Caching", description="Configure Redis cluster caching strategies and connection pooling.", suggested_project=None, is_completed=False),
            ]

        roadmap_preview = StudentRoadmapPreview(
            title=roadmap.title if roadmap else "Cloud Infrastructure & Systems Engineering Mastery",
            target_role=roadmap.target_role if roadmap else "Cloud Infrastructure Engineer",
            current_week=2,
            total_weeks=6,
            progress_percentage=25,
            milestones=milestones
        )

        # 10. Recent Activity Stream
        activities = [
            ActivityItem(id="act-1", timestamp="Today, 10:30 AM", title="Interview Scheduled", description="Google Cloud scheduled Technical Round II for tomorrow at 2:00 PM.", badge="Upcoming", badge_variant="lime"),
            ActivityItem(id="act-2", timestamp="Yesterday", title="Application Shortlisted", description="CloudScale Systems shortlisted your application for Frontend Engineer.", badge="Shortlisted", badge_variant="lime"),
            ActivityItem(id="act-3", timestamp="3 days ago", title="ATS Resume Scored", description="Analyzed aditya_sharma_swe.pdf. Composite ATS health calculated at 88/100.", badge="ATS: 88", badge_variant="orange"),
            ActivityItem(id="act-4", timestamp="5 days ago", title="Applied to Google Cloud", description="Submitted application for Associate Software Engineer (Composite Match: 91.4%).", badge="Submitted", badge_variant="neutral"),
        ]

        # 11. Quick Stats
        quick_stats = StudentQuickStats(
            applications_count=len(active_apps),
            interviews_count=len(upcoming_interviews),
            offers_count=1 if profile.placement_status == PlacementStatusEnum.PLACED else 0,
            verified_skills_count=len(verified_skill_names)
        )

        return StudentDashboardResponse(
            student_name=profile.full_name,
            email=user.email if user else "student@careerbridge.com",
            roll_number=profile.roll_number,
            department=dept,
            institution=inst,
            cgpa=cgpa,
            placement_status=profile.placement_status.value if hasattr(profile.placement_status, "value") else str(profile.placement_status),
            career_readiness_score=readiness_score,
            readiness_breakdown=breakdown,
            profile_completion=StudentProfileCompletion(percentage=completion_pct, missing_items=missing_items),
            resume_health=resume_info,
            recommended_jobs=recommended_jobs,
            active_applications=active_apps,
            upcoming_interviews=upcoming_interviews,
            skill_gap_summary=skill_gap_summary,
            career_roadmap=roadmap_preview,
            recent_activities=activities,
            quick_stats=quick_stats,
            is_demo=True
        )

    @staticmethod
    def get_recruiter_dashboard(db: Session, user: Optional[User] = None) -> RecruiterDashboardResponse:
        # Default demo recruiter
        if not user or user.role != UserRole.RECRUITER:
            user = db.query(User).filter(User.email == "recruiter@google.com").first()

        recruiter_profile = None
        if user:
            recruiter_profile = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == user.id).first()

        if not recruiter_profile:
            recruiter_profile = db.query(RecruiterProfile).first()

        company = db.query(Company).filter(Company.id == recruiter_profile.company_id).first() if recruiter_profile else None
        company_name = company.name if company else "Google Cloud"
        company_logo = company.logo_url if company else "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"

        # Active jobs for this company
        jobs = db.query(Job).filter(Job.company_id == (company.id if company else "")).all()
        active_jobs_items: List[RecruiterJobItem] = []
        job_ids = [j.id for j in jobs]

        for j in jobs:
            app_count = db.query(Application).filter(Application.job_id == j.id).count()
            smin = int(j.salary_min / 100000) if j.salary_min else 18
            smax = int(j.salary_max / 100000) if j.salary_max else 24
            active_jobs_items.append(RecruiterJobItem(
                id=j.id,
                title=j.title,
                job_type=j.job_type.value if hasattr(j.job_type, "value") else str(j.job_type),
                location=j.location,
                workplace_type=j.workplace_type.value if hasattr(j.workplace_type, "value") else str(j.workplace_type),
                salary_range=f"₹{smin} - ₹{smax} LPA",
                applicants_count=max(app_count, 18),
                vacancies=j.vacancies or 8,
                status=j.status.value if hasattr(j.status, "value") else str(j.status),
                deadline=j.application_deadline.strftime("%b %d, %Y") if j.application_deadline else "Dec 15, 2026"
            ))

        # Pipeline stages across company's jobs
        total_apps = db.query(Application).filter(Application.job_id.in_(job_ids)).count() if job_ids else 0
        total_apps = max(total_apps, 42)

        pipeline = RecruiterPipelineStages(
            applied=total_apps,
            screening=28,
            shortlisted=14,
            technical_round=8,
            hr_round=4,
            offered=2,
            rejected=6
        )

        stats = RecruiterStats(
            active_jobs_count=len(jobs) if jobs else 2,
            total_applicants_count=total_apps,
            shortlisted_count=pipeline.shortlisted,
            interviews_scheduled_count=pipeline.technical_round + pipeline.hr_round,
            offers_extended_count=pipeline.offered
        )

        # Recent applications for recruiter
        recent_apps = db.query(Application).filter(Application.job_id.in_(job_ids)).limit(6).all() if job_ids else []
        recent_items: List[RecruiterApplicantItem] = []

        for a in recent_apps:
            sp = db.query(StudentProfile).filter(StudentProfile.id == a.student_id).first()
            u = db.query(User).filter(User.id == sp.user_id).first() if sp else None
            acad = db.query(AcademicRecord).filter(AcademicRecord.student_id == sp.id).first() if sp else None
            j = db.query(Job).filter(Job.id == a.job_id).first()

            recent_items.append(RecruiterApplicantItem(
                id=a.id,
                candidate_name=sp.full_name if sp else "Candidate",
                candidate_email=u.email if u else "candidate@nit.edu",
                candidate_department=acad.department if acad else "Computer Science",
                candidate_cgpa=float(acad.cgpa_or_percentage) if acad and acad.cgpa_or_percentage else 8.50,
                job_title=j.title if j else "Associate Software Engineer",
                composite_match_score=float(a.composite_match_score) if a.composite_match_score else 88.5,
                current_status=a.current_status.value if hasattr(a.current_status, "value") else str(a.current_status),
                applied_at=a.applied_at.strftime("%b %d, %Y") if a.applied_at else "Nov 08, 2026"
            ))

        # Add realistic top candidates if list is short
        if len(recent_items) < 3:
            recent_items.extend([
                RecruiterApplicantItem(
                    id="app-cand-2",
                    candidate_name="Sneha Patel",
                    candidate_email="sneha.patel@nit.edu",
                    candidate_department="Computer Science",
                    candidate_cgpa=9.20,
                    job_title="Associate Software Engineer - Cloud Platform",
                    composite_match_score=94.5,
                    current_status="technical_round",
                    applied_at="Nov 09, 2026"
                ),
                RecruiterApplicantItem(
                    id="app-cand-3",
                    candidate_name="Rohan Mehta",
                    candidate_email="rohan.mehta@nit.edu",
                    candidate_department="Computer Science",
                    candidate_cgpa=8.90,
                    job_title="Associate Software Engineer - Cloud Platform",
                    composite_match_score=89.0,
                    current_status="screening",
                    applied_at="Nov 10, 2026"
                ),
            ])

        job_perf = JobPerformanceMetrics(
            total_views=840,
            application_rate_percent=18.4,
            shortlist_rate_percent=33.3,
            interview_conversion_percent=42.8
        )

        matching_insights = [
            CandidateMatchInsight(candidate_name="Aditya Sharma", job_title="Associate Software Engineer", department="Computer Science", cgpa=8.75, match_score=91.4, top_strengths=["Python Async", "FastAPI", "Docker", "Database Design"], status="Technical Round II"),
            CandidateMatchInsight(candidate_name="Sneha Patel", job_title="Associate Software Engineer", department="Computer Science", cgpa=9.20, match_score=94.5, top_strengths=["Distributed Algorithms", "Go", "C++", "System Architecture"], status="Technical Round I"),
            CandidateMatchInsight(candidate_name="Vikram Rao", job_title="Associate Software Engineer", department="Information Technology", cgpa=8.65, match_score=86.2, top_strengths=["Cloud Microservices", "PostgreSQL", "Docker", "CI/CD"], status="Screening Passed"),
        ]

        upcoming_itvs = [
            UpcomingInterviewItem(
                id="rec-itv-1",
                company_name=company_name,
                round_name="Technical Round II - Systems & Cloud Architecture (Aditya Sharma)",
                scheduled_start="Tomorrow • 2:00 PM IST",
                interviewer_name="Sarah Chen (Staff Architect)",
                meeting_link="https://meet.google.com/xyz-cbqj-cbr",
                venue="Virtual Google Meet",
                status="scheduled"
            ),
            UpcomingInterviewItem(
                id="rec-itv-2",
                company_name=company_name,
                round_name="Director Architecture Review (Sneha Patel)",
                scheduled_start="Nov 14 • 11:00 AM IST",
                interviewer_name="David Miller (Engineering Director)",
                meeting_link="https://meet.google.com/xyz-dvd-gmt",
                venue="Virtual Google Meet",
                status="scheduled"
            ),
        ]

        return RecruiterDashboardResponse(
            recruiter_name=recruiter_profile.user.email.split("@")[0].capitalize() if recruiter_profile and recruiter_profile.user else "Priya Sharma",
            company_name=company_name,
            company_logo=company_logo,
            designation=recruiter_profile.designation if recruiter_profile else "Senior Technical University Recruiter",
            stats=stats,
            pipeline=pipeline,
            active_jobs=active_jobs_items,
            recent_applications=recent_items,
            job_performance=job_perf,
            candidate_matching_insights=matching_insights,
            upcoming_interviews=upcoming_itvs,
            is_demo=True
        )

    @staticmethod
    def get_admin_dashboard(db: Session) -> AdminDashboardResponse:
        # Placement officer macro statistics
        total_students = db.query(StudentProfile).count()
        placed_students = db.query(StudentProfile).filter(StudentProfile.placement_status == PlacementStatusEnum.PLACED).count()
        unplaced_students = max(0, total_students - placed_students)
        placement_rate = round((placed_students / max(1, total_students)) * 100, 1)

        active_companies_count = db.query(Company).filter(Company.is_verified == True).count()
        active_jobs_count = db.query(Job).filter(Job.status == JobStatusEnum.ACTIVE).count()
        total_apps_count = db.query(Application).count()

        overview_stats = AdminOverviewStats(
            total_students=total_students if total_students >= 16 else 480,
            eligible_students=int(total_students * 0.88) if total_students >= 16 else 412,
            placed_students=placed_students if total_students >= 16 else 328,
            unplaced_students=unplaced_students if total_students >= 16 else 84,
            placement_rate_percent=placement_rate if total_students >= 16 else 79.6,
            active_companies=max(active_companies_count, 42),
            active_job_openings=max(active_jobs_count, 118),
            total_applications=max(total_apps_count * 15, 1240),
            average_package_lpa=14.2,
            highest_package_lpa=45.0
        )

        # Department placement stats
        dept_records = db.query(AcademicRecord.department, func.count(AcademicRecord.id), func.avg(AcademicRecord.cgpa_or_percentage)).group_by(AcademicRecord.department).all()

        dept_stats: List[DepartmentPlacementStat] = []
        for dname, dtotal, davg_cgpa in dept_records:
            if not dname: continue
            # Placed count in this department
            placed_in_dept = db.query(StudentProfile).join(AcademicRecord).filter(
                AcademicRecord.department == dname,
                StudentProfile.placement_status == PlacementStatusEnum.PLACED
            ).count()
            unplaced_in_dept = max(0, dtotal - placed_in_dept)
            rate = round((placed_in_dept / max(1, dtotal)) * 100, 1)

            dept_stats.append(DepartmentPlacementStat(
                department_name=dname,
                total_students=dtotal,
                placed_students=placed_in_dept,
                unplaced_students=unplaced_in_dept,
                placement_rate_percent=rate,
                average_cgpa=round(float(davg_cgpa or 8.0), 2)
            ))

        # Default rich distribution if seeded cohort is small
        if len(dept_stats) < 4:
            dept_stats = [
                DepartmentPlacementStat(department_name="Computer Science", total_students=140, placed_students=126, unplaced_students=14, placement_rate_percent=90.0, average_cgpa=8.65),
                DepartmentPlacementStat(department_name="Information Technology", total_students=110, placed_students=94, unplaced_students=16, placement_rate_percent=85.5, average_cgpa=8.35),
                DepartmentPlacementStat(department_name="Electronics & Comm.", total_students=130, placed_students=98, unplaced_students=32, placement_rate_percent=75.4, average_cgpa=8.10),
                DepartmentPlacementStat(department_name="Mechanical Eng.", total_students=100, placed_students=65, unplaced_students=35, placement_rate_percent=65.0, average_cgpa=7.75),
            ]

        # Top Recruiting Companies
        companies = db.query(Company).filter(Company.is_verified == True).limit(5).all()
        company_recruitment: List[CompanyRecruitmentStat] = []
        ctc_presets = [
            ("Google Cloud", 21.5, 24.0, 18, 6, "Drive Upcoming"),
            ("Microsoft India", 24.0, 28.0, 22, 12, "Drive Active"),
            ("Amazon Web Services", 19.0, 22.0, 16, 8, "Screening Rounds"),
            ("CloudScale Systems", 14.5, 16.0, 10, 4, "Interviews Completed"),
        ]
        for cname, avg_ctc, max_ctc, opens, hired, stat in ctc_presets:
            comp_obj = next((c for c in companies if c.name == cname), None)
            company_recruitment.append(CompanyRecruitmentStat(
                company_name=cname,
                logo_url=comp_obj.logo_url if comp_obj else None,
                industry="Cloud & Enterprise Software",
                openings_count=opens,
                hired_count=hired,
                average_ctc_lpa=avg_ctc,
                highest_ctc_lpa=max_ctc,
                status=stat
            ))

        # Placement Drives
        drives = db.query(PlacementDrive).order_by(PlacementDrive.drive_date).all()
        drive_items: List[PlacementDriveItem] = []
        for drv in drives:
            comp = db.query(Company).filter(Company.id == drv.company_id).first()
            drive_items.append(PlacementDriveItem(
                id=drv.id,
                title=drv.title,
                company_name=comp.name if comp else "Recruiting Partner",
                drive_date=drv.drive_date.strftime("%b %d, %Y") if drv.drive_date else "Nov 25, 2026",
                registration_deadline=drv.registration_deadline.strftime("%b %d, %Y") if drv.registration_deadline else "Nov 18, 2026",
                min_cgpa=float(drv.min_cgpa) if drv.min_cgpa else 7.50,
                allowed_departments=drv.allowed_departments or ["Computer Science", "Information Technology"],
                selection_rounds=drv.selection_rounds or ["Online Assessment", "Coding Round", "Technical Interview", "HR"],
                venue=drv.venue or "Campus Auditorium",
                status=drv.status.value if hasattr(drv.status, "value") else str(drv.status)
            ))

        pending_actions = PendingActionsOverview(
            pending_recruiters_count=1,
            pending_jobs_count=2
        )

        campus_activity = [
            ActivityItem(id="adm-1", timestamp="10 mins ago", title="New Drive Published", description="Microsoft Autumn Campus Hiring 2026 registration opened for CS & IT cohorts.", badge="Active Drive", badge_variant="lime"),
            ActivityItem(id="adm-2", timestamp="1 hour ago", title="Recruiter Verified", description="Verified employer credentials for Amazon Web Services Campus Talent Acquisition.", badge="Verified", badge_variant="lime"),
            ActivityItem(id="adm-3", timestamp="3 hours ago", title="Department Eligibility Check", description="Batch of 2026 academic backlogs audit completed: 412 students cleared for Tier-1 drives.", badge="Academic Audit", badge_variant="orange"),
            ActivityItem(id="adm-4", timestamp="Yesterday", title="Offer Letter Confirmed", description="Google Cloud extended 2 official Associate Software Engineer campus offers.", badge="Offer", badge_variant="lime"),
        ]

        return AdminDashboardResponse(
            institution_name="National Institute of Technology",
            academic_year=2026,
            stats=overview_stats,
            department_stats=dept_stats,
            company_recruitment=company_recruitment,
            placement_drives=drive_items,
            pending_actions=pending_actions,
            recent_activity=campus_activity,
            is_demo=True
        )

