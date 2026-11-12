import os
import sys
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, engine, Base
import app.models
from app.models.user import User, UserRole, Notification, NotificationType
from app.models.student import (
    StudentProfile, GenderEnum, PlacementStatusEnum, AcademicRecord,
    Skill, SkillCategoryEnum, StudentSkill, ProficiencyLevelEnum, StudentProject
)
from app.models.recruiter import Company, CompanySizeEnum, RecruiterProfile
from app.models.job import (
    Job, JobTypeEnum, WorkplaceTypeEnum, JobStatusEnum,
    GenderPreferenceEnum, JobSkill, JobEligibility
)
from app.models.drive import PlacementDrive, DriveStatusEnum
from app.models.resume import Resume, ResumeVersion, ResumeAnalysis
from app.models.application import (
    Application, ApplicationStatusEnum, ApplicationStatusHistory,
    Interview, InterviewStatusEnum
)
from app.models.ai import (
    JobMatchResult, SkillGapAnalysis, CareerRoadmap, RoadmapItem, RoadmapStatusEnum
)
from app.core.security import get_password_hash


def seed():
    print("🌱 Starting CareerBridge Realistic Demo Data Seeder...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Master Skills Taxonomy
        print("  -> Seeding master skills taxonomy...")
        core_skills = [
            ("Python", SkillCategoryEnum.PROGRAMMING_LANGUAGE),
            ("Java", SkillCategoryEnum.PROGRAMMING_LANGUAGE),
            ("C++", SkillCategoryEnum.PROGRAMMING_LANGUAGE),
            ("TypeScript", SkillCategoryEnum.PROGRAMMING_LANGUAGE),
            ("JavaScript", SkillCategoryEnum.PROGRAMMING_LANGUAGE),
            ("SQL", SkillCategoryEnum.PROGRAMMING_LANGUAGE),
            ("React", SkillCategoryEnum.FRAMEWORK),
            ("Next.js", SkillCategoryEnum.FRAMEWORK),
            ("FastAPI", SkillCategoryEnum.FRAMEWORK),
            ("Node.js", SkillCategoryEnum.FRAMEWORK),
            ("Tailwind CSS", SkillCategoryEnum.FRAMEWORK),
            ("Spring Boot", SkillCategoryEnum.FRAMEWORK),
            ("MySQL", SkillCategoryEnum.DATABASE),
            ("PostgreSQL", SkillCategoryEnum.DATABASE),
            ("MongoDB", SkillCategoryEnum.DATABASE),
            ("Redis", SkillCategoryEnum.DATABASE),
            ("Docker", SkillCategoryEnum.CLOUD_DEVOPS),
            ("Kubernetes", SkillCategoryEnum.CLOUD_DEVOPS),
            ("AWS", SkillCategoryEnum.CLOUD_DEVOPS),
            ("Git & GitHub", SkillCategoryEnum.TOOL),
            ("Machine Learning", SkillCategoryEnum.MACHINE_LEARNING),
            ("Sentence Transformers", SkillCategoryEnum.MACHINE_LEARNING),
            ("Communication", SkillCategoryEnum.SOFT_SKILL),
            ("Problem Solving", SkillCategoryEnum.SOFT_SKILL),
            ("Kafka", SkillCategoryEnum.CLOUD_DEVOPS),
            ("System Design", SkillCategoryEnum.TOOL),
        ]

        skill_map = {}
        for name, cat in core_skills:
            existing = db.query(Skill).filter(Skill.name == name).first()
            if not existing:
                existing = Skill(name=name, category=cat, description=f"{name} technical competency")
                db.add(existing)
                db.flush()
            skill_map[name] = existing

        # 2. Seed Companies
        print("  -> Seeding partner companies...")
        companies_data = [
            ("Google Cloud", "https://cloud.google.com", "Cloud & Enterprise Software", CompanySizeEnum.TIER_1000_PLUS, "Bengaluru, India", "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg", True),
            ("Microsoft India", "https://microsoft.com", "Cloud Infrastructure & AI", CompanySizeEnum.TIER_1000_PLUS, "Hyderabad, India", "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg", True),
            ("Amazon Web Services", "https://aws.amazon.com", "Cloud & Distributed Computing", CompanySizeEnum.TIER_1000_PLUS, "Bengaluru, India", "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg", True),
            ("CloudScale Systems", "https://cloudscale.dev", "Fintech SaaS & Microservices", CompanySizeEnum.TIER_201_1000, "Pune, India", "https://avatar.vercel.sh/cloudscale", True),
        ]

        company_map = {}
        for cname, cweb, cind, csize, chq, clogo, cver in companies_data:
            c = db.query(Company).filter(Company.name == cname).first()
            if not c:
                c = Company(
                    name=cname,
                    website_url=cweb,
                    industry=cind,
                    company_size=csize,
                    headquarters=chq,
                    logo_url=clogo,
                    is_verified=cver,
                )
                db.add(c)
                db.flush()
            company_map[cname] = c

        # 3. Demo Recruiter User & Profile
        print("  -> Seeding Demo Recruiter (recruiter@google.com)...")
        recruiter_user = db.query(User).filter(User.email == "recruiter@google.com").first()
        if not recruiter_user:
            recruiter_user = User(
                email="recruiter@google.com",
                password_hash=get_password_hash("Password123!"),
                role=UserRole.RECRUITER,
                is_active=True,
                is_verified=True,
            )
            db.add(recruiter_user)
            db.flush()

        recruiter_profile = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == recruiter_user.id).first()
        if not recruiter_profile:
            recruiter_profile = RecruiterProfile(
                user_id=recruiter_user.id,
                company_id=company_map["Google Cloud"].id,
                designation="Senior Technical University Recruiter",
                work_phone="+91-8012345678",
                is_primary_contact=True,
            )
            db.add(recruiter_profile)
            db.flush()

        # 4. Jobs across companies
        print("  -> Seeding verified jobs...")
        jobs_data = [
            ("Associate Software Engineer - Cloud Platform", "Google Cloud", JobTypeEnum.FULL_TIME, WorkplaceTypeEnum.HYBRID, "Bengaluru, Karnataka", 1800000, 2400000, 8, [("Python", True, 1.5), ("FastAPI", True, 1.2), ("MySQL", True, 1.0), ("Docker", False, 0.8)]),
            ("Systems Engineer - Distributed Storage", "Microsoft India", JobTypeEnum.FULL_TIME, WorkplaceTypeEnum.HYBRID, "Hyderabad, Telangana", 2000000, 2800000, 6, [("C++", True, 1.5), ("Python", True, 1.2), ("Kubernetes", True, 1.0), ("SQL", False, 0.8)]),
            ("Frontend Engineer - Design Systems", "CloudScale Systems", JobTypeEnum.FULL_TIME, WorkplaceTypeEnum.REMOTE, "Remote / Pune", 1200000, 1600000, 4, [("React", True, 1.5), ("TypeScript", True, 1.3), ("Next.js", True, 1.2), ("Tailwind CSS", False, 0.8)]),
            ("Cloud Data Engineer - Analytics", "Amazon Web Services", JobTypeEnum.FULL_TIME, WorkplaceTypeEnum.ON_SITE, "Bengaluru, Karnataka", 1600000, 2200000, 5, [("Python", True, 1.5), ("SQL", True, 1.3), ("AWS", True, 1.2), ("Redis", False, 0.8)]),
        ]

        job_map = {}
        for jtitle, jcomp, jtype, jwork, jloc, smin, smax, vac, skills_req in jobs_data:
            j = db.query(Job).filter(Job.title == jtitle).first()
            if not j:
                j = Job(
                    company_id=company_map[jcomp].id,
                    posted_by=recruiter_profile.id,
                    title=jtitle,
                    job_type=jtype,
                    workplace_type=jwork,
                    location=jloc,
                    description=f"Opportunity at {jcomp} working on scalable modern distributed infrastructure and resilient products.",
                    requirements="Bachelor's degree in Engineering (Computer Science, IT, or related). Strong algorithmic problem-solving and software design fundamentals.",
                    salary_min=smin,
                    salary_max=smax,
                    salary_currency="INR",
                    vacancies=vac,
                    status=JobStatusEnum.ACTIVE,
                    application_deadline=datetime.utcnow() + timedelta(days=28),
                )
                db.add(j)
                db.flush()

                db.add(JobEligibility(
                    job_id=j.id,
                    min_cgpa=7.00,
                    max_backlogs_allowed=0,
                    allowed_grad_years=[2026],
                    allowed_departments=["Computer Science", "Information Technology", "Electronics & Communication"],
                    gender_preference=GenderPreferenceEnum.ANY,
                ))

                for sk_req, is_mand, wt in skills_req:
                    if sk_req in skill_map:
                        db.add(JobSkill(
                            job_id=j.id,
                            skill_id=skill_map[sk_req].id,
                            is_mandatory=is_mand,
                            weight=wt,
                        ))
                db.flush()
            job_map[jtitle] = j

        # 5. Demo Student User & Profile (Aditya Sharma)
        print("  -> Seeding Demo Student (student@careerbridge.com)...")
        student_user = db.query(User).filter(User.email == "student@careerbridge.com").first()
        if not student_user:
            student_user = User(
                email="student@careerbridge.com",
                password_hash=get_password_hash("Password123!"),
                role=UserRole.STUDENT,
                is_active=True,
                is_verified=True,
            )
            db.add(student_user)
            db.flush()

        student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == student_user.id).first()
        if not student_profile:
            student_profile = StudentProfile(
                user_id=student_user.id,
                full_name="Aditya Sharma",
                roll_number="2022CSB1045",
                phone_number="+91-9876543210",
                gender=GenderEnum.MALE,
                bio="Passionate Full-Stack & Systems Developer specializing in Python, FastAPI, and React. Eager to solve high-scale engineering challenges.",
                city="Bengaluru, Karnataka",
                linkedin_url="https://linkedin.com/in/aditya-sharma-demo",
                github_url="https://github.com/aditya-sharma-demo",
                placement_status=PlacementStatusEnum.UNPLACED,
            )
            db.add(student_profile)
            db.flush()

            # Academic Record
            academic = AcademicRecord(
                student_id=student_profile.id,
                institution_name="National Institute of Technology",
                degree="B.Tech in Computer Science and Engineering",
                department="Computer Science",
                start_year=2022,
                end_year=2026,
                cgpa_or_percentage=8.75,
                backlogs_count=0,
            )
            db.add(academic)

            # Student Skills
            for sk_name in ["Python", "FastAPI", "React", "MySQL", "Docker", "Git & GitHub", "TypeScript", "Problem Solving"]:
                if sk_name in skill_map:
                    db.add(StudentSkill(
                        student_id=student_profile.id,
                        skill_id=skill_map[sk_name].id,
                        proficiency_level=ProficiencyLevelEnum.ADVANCED,
                        is_verified=True,
                    ))

            # Student Project
            proj = StudentProject(
                student_id=student_profile.id,
                title="Distributed Task Queue & Job Processing Engine",
                description="Built a high-throughput async processing pipeline using FastAPI, Redis, and SQLAlchemy with sub-50ms message latency.",
                technologies_used=["Python", "FastAPI", "Redis", "Docker"],
                github_url="https://github.com/aditya-sharma-demo/task-queue",
            )
            db.add(proj)

        # 6. Resume & ATS Analysis for Aditya Sharma
        resume = db.query(Resume).filter(Resume.student_id == student_profile.id).first()
        if not resume:
            resume = Resume(
                student_id=student_profile.id,
                title="Aditya_Sharma_Software_Engineer_2026.pdf",
                file_name="aditya_sharma_swe.pdf",
                file_path="/storage/resumes/aditya_sharma_swe.pdf",
                file_size_bytes=142850,
                mime_type="application/pdf",
                is_default=True,
            )
            db.add(resume)
            db.flush()

            analysis = ResumeAnalysis(
                resume_id=resume.id,
                raw_text="ADITYA SHARMA\nSoftware Engineering Student\nBengaluru, India...",
                ats_score=88,
                section_score=23,
                metric_score=21,
                skill_score=26,
                format_score=18,
                extracted_skills=["Python", "FastAPI", "React", "Docker", "MySQL", "TypeScript"],
                missing_recommended_skills=["Kubernetes", "Kafka", "System Design"],
                improvements_json=[
                    "Include quantifiable cloud metrics in your containerization bullet points.",
                    "Add testing frameworks such as Pytest or Jest to your tools list.",
                    "Highlight collaborative Git workflows and CI/CD pipeline automation.",
                ],
            )
            db.add(analysis)

        # 7. Applications for Aditya Sharma
        app1 = db.query(Application).filter(
            Application.student_id == student_profile.id,
            Application.job_id == job_map["Associate Software Engineer - Cloud Platform"].id
        ).first()
        if not app1:
            app1 = Application(
                job_id=job_map["Associate Software Engineer - Cloud Platform"].id,
                student_id=student_profile.id,
                resume_id=resume.id,
                current_status=ApplicationStatusEnum.TECHNICAL_ROUND,
                composite_match_score=91.40,
                cover_letter="I am excited to apply for the Associate Software Engineer role at Google Cloud. My experience with distributed systems and FastAPI aligns strongly with your cloud infrastructure team.",
                applied_at=datetime.utcnow() - timedelta(days=5),
            )
            db.add(app1)
            db.flush()

            # Schedule an Upcoming Interview
            interview = Interview(
                application_id=app1.id,
                round_name="Technical Round II - Systems & Cloud Architecture",
                scheduled_start=datetime.utcnow() + timedelta(days=1, hours=4),
                scheduled_end=datetime.utcnow() + timedelta(days=1, hours=5),
                meeting_link="https://meet.google.com/xyz-cbqj-cbr",
                venue="Virtual Google Meet",
                interviewer_name="Sarah Chen (Staff Systems Architect)",
                status=InterviewStatusEnum.SCHEDULED,
            )
            db.add(interview)

        # Other applications
        app2 = db.query(Application).filter(
            Application.student_id == student_profile.id,
            Application.job_id == job_map["Frontend Engineer - Design Systems"].id
        ).first()
        if not app2:
            app2 = Application(
                job_id=job_map["Frontend Engineer - Design Systems"].id,
                student_id=student_profile.id,
                resume_id=resume.id,
                current_status=ApplicationStatusEnum.SHORTLISTED,
                composite_match_score=88.20,
                applied_at=datetime.utcnow() - timedelta(days=8),
            )
            db.add(app2)

        app3 = db.query(Application).filter(
            Application.student_id == student_profile.id,
            Application.job_id == job_map["Systems Engineer - Distributed Storage"].id
        ).first()
        if not app3:
            app3 = Application(
                job_id=job_map["Systems Engineer - Distributed Storage"].id,
                student_id=student_profile.id,
                resume_id=resume.id,
                current_status=ApplicationStatusEnum.SCREENING,
                composite_match_score=84.50,
                applied_at=datetime.utcnow() - timedelta(days=12),
            )
            db.add(app3)

        # 8. Skill Gap Analysis & 6-Week Roadmap for Aditya Sharma
        gap = db.query(SkillGapAnalysis).filter(SkillGapAnalysis.student_id == student_profile.id).first()
        if not gap:
            gap = SkillGapAnalysis(
                student_id=student_profile.id,
                target_role="Cloud Infrastructure Engineer",
                target_job_id=job_map["Associate Software Engineer - Cloud Platform"].id,
                critical_missing_skills=["Kubernetes", "Kafka", "System Design"],
                secondary_missing_skills=["Terraform", "Prometheus"],
                readiness_percentage=82.40,
                summary="Candidate shows high mastery in Python backends, APIs, and relational databases. To achieve 95%+ readiness for Tier-1 Cloud Infrastructure roles, acquire container orchestration (Kubernetes) and event streaming (Kafka).",
            )
            db.add(gap)
            db.flush()

            roadmap = CareerRoadmap(
                student_id=student_profile.id,
                gap_analysis_id=gap.id,
                title="Cloud Infrastructure & Systems Engineering Mastery",
                target_role="Cloud Infrastructure Engineer",
                total_weeks=6,
                status=RoadmapStatusEnum.ACTIVE,
            )
            db.add(roadmap)
            db.flush()

            milestones = [
                (1, "Docker Networking & Multi-Stage Builds", "Master production image hardening and container networking topologies.", True),
                (2, "Kubernetes Core & Pod Orchestration", "Deploy StatefulSets, ingress controllers, and config maps on minikube.", False),
                (3, "Distributed Messaging with Apache Kafka", "Implement partition keys, consumer groups, and idempotent publishers.", False),
                (4, "High-Availability Relational & In-Memory Caching", "Configure Redis cluster caching strategies and connection pooling.", False),
                (5, "Microservices Observability & Tracing", "Set up OpenTelemetry, Prometheus metrics, and distributed spans.", False),
                (6, "Capstone: Resilient Event-Driven Microservice", "Design and benchmark a production-ready cloud order processor.", False),
            ]
            for wnum, mtitle, mdesc, comp in milestones:
                db.add(RoadmapItem(
                    roadmap_id=roadmap.id,
                    week_number=wnum,
                    milestone_title=mtitle,
                    description=mdesc,
                    learning_resources=["https://kubernetes.io/docs/concepts/", "https://kafka.apache.org/documentation/"],
                    suggested_project="Microservice Ingress Controller" if wnum == 2 else None,
                    is_completed=comp,
                    completed_at=datetime.utcnow() - timedelta(days=2) if comp else None,
                ))

        # 9. Additional Cohort of Students across Departments (for Placement Officer Analytics)
        print("  -> Seeding campus student cohort (16 students across 4 departments)...")
        cohort = [
            # CS
            ("sneha.patel@nit.edu", "Sneha Patel", "Computer Science", 9.20, PlacementStatusEnum.PLACED),
            ("rohan.mehta@nit.edu", "Rohan Mehta", "Computer Science", 8.90, PlacementStatusEnum.PLACED),
            ("pooja.nair@nit.edu", "Pooja Nair", "Computer Science", 8.10, PlacementStatusEnum.UNPLACED),
            # IT
            ("vikram.rao@nit.edu", "Vikram Rao", "Information Technology", 8.65, PlacementStatusEnum.PLACED),
            ("ananya.iyer@nit.edu", "Ananya Iyer", "Information Technology", 8.30, PlacementStatusEnum.UNPLACED),
            ("karan.singh@nit.edu", "Karan Singh", "Information Technology", 8.45, PlacementStatusEnum.PLACED),
            ("neha.joshi@nit.edu", "Neha Joshi", "Information Technology", 7.90, PlacementStatusEnum.UNPLACED),
            # ECE
            ("rahul.verma@nit.edu", "Rahul Verma", "Electronics & Communication", 8.80, PlacementStatusEnum.PLACED),
            ("priya.das@nit.edu", "Priya Das", "Electronics & Communication", 7.85, PlacementStatusEnum.UNPLACED),
            ("aman.gupta@nit.edu", "Aman Gupta", "Electronics & Communication", 8.40, PlacementStatusEnum.PLACED),
            ("ritu.sen@nit.edu", "Ritu Sen", "Electronics & Communication", 8.05, PlacementStatusEnum.UNPLACED),
            # Mech
            ("arjun.nair@nit.edu", "Arjun Nair", "Mechanical Engineering", 8.10, PlacementStatusEnum.PLACED),
            ("divya.k@nit.edu", "Divya K", "Mechanical Engineering", 7.60, PlacementStatusEnum.UNPLACED),
            ("suresh.k@nit.edu", "Suresh Kumar", "Mechanical Engineering", 7.40, PlacementStatusEnum.UNPLACED),
            ("meera.p@nit.edu", "Meera Pillai", "Mechanical Engineering", 7.50, PlacementStatusEnum.UNPLACED),
        ]

        for c_email, c_name, c_dept, c_cgpa, c_status in cohort:
            u = db.query(User).filter(User.email == c_email).first()
            if not u:
                u = User(
                    email=c_email,
                    password_hash=get_password_hash("Password123!"),
                    role=UserRole.STUDENT,
                    is_active=True,
                    is_verified=True,
                )
                db.add(u)
                db.flush()

                sp = StudentProfile(
                    user_id=u.id,
                    full_name=c_name,
                    roll_number=f"2022{c_dept[:2].upper()}{u.id[:4]}",
                    phone_number="+91-9811223344",
                    gender=GenderEnum.FEMALE if "a" in c_name.split()[0].lower() else GenderEnum.MALE,
                    bio=f"Pre-final engineering undergraduate in {c_dept} at National Institute of Technology.",
                    city="Bengaluru, India",
                    placement_status=c_status,
                )
                db.add(sp)
                db.flush()

                db.add(AcademicRecord(
                    student_id=sp.id,
                    institution_name="National Institute of Technology",
                    degree=f"B.Tech in {c_dept}",
                    department=c_dept,
                    start_year=2022,
                    end_year=2026,
                    cgpa_or_percentage=c_cgpa,
                    backlogs_count=0,
                ))

        # 10. Placement Officer User & Drives
        print("  -> Seeding Demo Placement Officer (tpo@university.edu)...")
        tpo_user = db.query(User).filter(User.email == "tpo@university.edu").first()
        if not tpo_user:
            tpo_user = User(
                email="tpo@university.edu",
                password_hash=get_password_hash("Password123!"),
                role=UserRole.TPO,
                is_active=True,
                is_verified=True,
            )
            db.add(tpo_user)
            db.flush()

        # Placement Drives
        drives_data = [
            ("Google Cloud Campus Recruitment Drive 2026", "Google Cloud", 2026, 12, 5, 7.50, ["Computer Science", "Information Technology"], ["Online Technical Assessment", "Coding Round", "System Design", "HR Interview"], "Campus Auditorium & Virtual", DriveStatusEnum.UPCOMING),
            ("Microsoft Autumn Campus Hiring 2026", "Microsoft India", 2026, 4, 1, 8.00, ["Computer Science", "Information Technology", "Electronics & Communication"], ["Online Assessment", "Technical Interview I", "Technical Interview II", "Director Round"], "Virtual MS Teams", DriveStatusEnum.IN_PROGRESS),
        ]

        for dtitle, dcomp, dyear, ddays, rdays, min_c, depts, rounds, ven, stat in drives_data:
            drv = db.query(PlacementDrive).filter(PlacementDrive.title == dtitle).first()
            if not drv:
                drv = PlacementDrive(
                    company_id=company_map[dcomp].id,
                    title=dtitle,
                    academic_year=dyear,
                    drive_date=(datetime.utcnow() + timedelta(days=ddays)).date(),
                    registration_deadline=datetime.utcnow() + timedelta(days=rdays),
                    min_cgpa=min_c,
                    allowed_departments=depts,
                    selection_rounds=rounds,
                    venue=ven,
                    status=stat,
                )
                db.add(drv)

        db.commit()
        print("✅ Demo data seeded successfully!")
        print("\nDemo Accounts Available:")
        print("  [Student]   student@careerbridge.com  / Password123!")
        print("  [Recruiter] recruiter@google.com      / Password123!")
        print("  [TPO/Admin] tpo@university.edu        / Password123!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during seeding: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed()
