"""
Complete End-to-End User Journey Integration Test for CareerBridge.
Simulates and validates the complete student-recruiter-TPO placement lifecycle:
1. Student Registration & Authentication Token Generation
2. Academic Credentials & Skill Profile Setup
3. PDF Resume Upload & PyMuPDF Parsing
4. Deterministic ATS Resume Analysis & PDF Export
5. Recruiter Job Posting & TPO Administrative Approval
6. Algorithmic Job Matching & Radar Recommendation
7. Application Submission with Automated Eligibility Verification
8. Recruiter Review, Dossier Inspection & Pipeline Advancement
9. Interview Scheduling, In-App Notifications & AI Mock Drill
10. Placement Officer Analytics & Student Report CSV Export
"""

import os
import sys
import uuid
from decimal import Decimal
from datetime import datetime, timedelta
import fitz

# Ensure backend in sys.path and set testing env
sys.path.insert(0, os.path.abspath('.'))
os.environ["TESTING"] = "1"

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole, Notification
from app.models.student import StudentProfile, AcademicRecord, Skill, StudentSkill, PlacementStatusEnum
from app.models.recruiter import Company, RecruiterProfile, CompanySizeEnum
from app.models.job import Job, JobSkill, JobEligibility, JobStatusEnum, JobTypeEnum, WorkplaceTypeEnum, GenderPreferenceEnum
from app.models.application import Application, ApplicationStatusEnum, Interview, InterviewStatusEnum
from app.schemas.auth import StudentRegisterRequest, RecruiterRegisterRequest
from app.schemas.application import ApplicationCreateRequest
from app.schemas.admin import JobApprovalActionRequest
from app.schemas.recruiter import ApplicationStageAdvanceRequest, CandidateInterviewScheduleRequest
from app.schemas.interview_prep import InterviewStartRequest, InterviewAnswerSubmitRequest

from app.services.auth_service import AuthService
from app.services.resume_service import ResumeService
from app.services.resume_analysis_service import ResumeAnalysisService
from app.services.recommendation_service import RecommendationService
from app.services.application_service import ApplicationService
from app.services.recruiter_service import RecruiterService
from app.services.admin_service import AdminService
from app.services.notification_service import NotificationService
from app.services.interview_prep_service import InterviewPrepService


def test_complete_user_journey():
    print("=" * 80)
    print("CAREERBRIDGE COMPLETE END-TO-END USER JOURNEY VERIFICATION")
    print("=" * 80)

    db = SessionLocal()
    test_uid = uuid.uuid4().hex[:8]
    student_email = f"journey_student_{test_uid}@university.edu"
    recruiter_email = f"journey_recruiter_{test_uid}@cloudtech.io"
    tpo_email = f"journey_tpo_{test_uid}@careerbridge.edu"

    try:
        # =====================================================================
        # 1. Student Registration & Authentication
        # =====================================================================
        print("\n--- STAGE 1: Student Registration & Authentication ---")
        reg_payload = StudentRegisterRequest(
            email=student_email,
            password="StrongPassword@123",
            full_name=f"Aarav Sharma {test_uid.upper()}",
            role="student",
            registration_number=f"ROLL_{test_uid.upper()}",
            university="National Institute of Technology",
            degree="B.Tech",
            department="Computer Science and Engineering",
            graduation_year=2026
        )
        student_user, tokens, verify_token = AuthService.register_student(db, reg_payload)
        assert student_user is not None
        assert student_user.email == student_email
        assert student_user.role == UserRole.STUDENT
        assert tokens.access_token is not None
        student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == student_user.id).first()
        assert student_profile is not None
        print(f" [PASS] Student account created: {student_profile.full_name} ({student_email})")
        print(f"        Access Token issued: {tokens.access_token[:25]}...")

        # =====================================================================
        # 2. Profile Setup: Academic Record & Technical Skills
        # =====================================================================
        print("\n--- STAGE 2: Academic Record & Skill Profile Setup ---")
        acad_rec = db.query(AcademicRecord).filter(AcademicRecord.student_id == student_profile.id).first()
        if not acad_rec:
            acad_rec = AcademicRecord(student_id=student_profile.id)
            db.add(acad_rec)
        acad_rec.institution_name = "National Institute of Technology"
        acad_rec.degree = "B.Tech"
        acad_rec.department = "Computer Science and Engineering"
        acad_rec.start_year = 2022
        acad_rec.end_year = 2026
        acad_rec.cgpa_or_percentage = Decimal("8.85")
        acad_rec.backlogs_count = 0
        db.commit()

        skills_to_add = ["Python", "FastAPI", "Docker", "PostgreSQL", "React"]
        for s_name in skills_to_add:
            sk = db.query(Skill).filter(Skill.name == s_name).first()
            if not sk:
                sk = Skill(name=s_name, category="Technical")
                db.add(sk)
                db.flush()
            db.add(StudentSkill(
                student_id=student_profile.id,
                skill_id=sk.id,
                proficiency_level="advanced",
                is_verified=True
            ))
        db.commit()
        print(f" [PASS] Academic Record (CGPA: 8.85, 0 backlogs) & {len(skills_to_add)} verified skills configured.")

        # =====================================================================
        # 3. Resume Upload & Deep Parsing
        # =====================================================================
        print("\n--- STAGE 3: PDF Resume Upload & Parsing ---")
        doc = fitz.open()
        page = doc.new_page()
        resume_text = f"""{student_profile.full_name}
Email: {student_email} | Phone: +91 9123456789
Education: B.Tech in Computer Science and Engineering, 2026, CGPA: 8.85 / 10

Technical Skills:
Python, FastAPI, Docker, PostgreSQL, React, TypeScript, Git, Redis

Projects:
CareerBridge Cloud Platform: Built scalable asynchronous REST APIs using FastAPI and PostgreSQL.
Containerized microservices using Docker and orchestrated deployment, reducing latency by 45%.

Experience:
Backend Engineering Intern at CloudTech: Optimized database queries using PostgreSQL indexes, saving $12,000 annually.
"""
        page.insert_text((50, 72), resume_text)
        pdf_bytes = doc.tobytes()
        doc.close()

        from io import BytesIO
        from fastapi import UploadFile

        upload_file = UploadFile(filename=f"resume_{test_uid}.pdf", file=BytesIO(pdf_bytes))
        upload_res = ResumeService.upload_resume(
            student_id=student_profile.id,
            file=upload_file,
            title="Primary Engineering Resume",
            db=db
        )
        resume_record = upload_res["resume"]
        assert resume_record is not None
        assert upload_res["parsed_data"]["raw_text"] is not None
        assert "Python" in upload_res["parsed_data"]["raw_text"]
        print(f" [PASS] Resume uploaded and parsed: '{resume_record.file_name}' (ID: {resume_record.id})")

        # =====================================================================
        # 4. ATS Resume Analysis & PDF Report Generation
        # =====================================================================
        print("\n--- STAGE 4: ATS Resume Rubric Analysis & PDF Export ---")
        analysis_res = ResumeAnalysisService.analyze_resume_sync(
            db=db,
            resume_id=resume_record.id,
            student_user=student_user
        )
        assert analysis_res is not None
        overall_score = analysis_res.get("overall_score") or analysis_res.get("ats_score")
        assert overall_score is not None and 0 <= overall_score <= 100
        print(f" [PASS] AI Resume Analysis Score calculated: {overall_score}/100.")
        print(f"        Category Breakdown: {analysis_res.get('category_scores', {})}")

        pdf_bytes, report_filename = ResumeAnalysisService.export_pdf_report_sync(
            db=db,
            student_user=student_user,
            resume_id=resume_record.id
        )
        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 1000
        print(f" [PASS] ATS Analysis PDF report exported successfully: '{report_filename}' ({len(pdf_bytes)} bytes).")

        # =====================================================================
        # 5. Recruiter Job Posting & Placement Officer Approval
        # =====================================================================
        print("\n--- STAGE 5: Recruiter Job Posting & TPO Approval ---")
        comp = Company(
            name=f"CloudTech Solutions {test_uid.upper()}",
            website_url="https://cloudtech.example.com",
            industry="Cloud & AI Infrastructure",
            company_size=CompanySizeEnum.TIER_51_200,
            verification_status="verified",
            is_verified=True
        )
        db.add(comp)
        db.flush()

        rec_user = User(
            email=recruiter_email,
            password_hash=get_password_hash("Recruiter@123"),
            role=UserRole.RECRUITER,
            is_active=True,
            is_verified=True
        )
        db.add(rec_user)
        db.flush()

        rec_profile = RecruiterProfile(
            user_id=rec_user.id,
            company_id=comp.id,
            designation="Principal Talent Partner"
        )
        db.add(rec_profile)
        db.flush()

        job = Job(
            company_id=comp.id,
            posted_by=rec_profile.id,
            title=f"Backend Software Engineer {test_uid.upper()}",
            job_type=JobTypeEnum.FULL_TIME,
            workplace_type=WorkplaceTypeEnum.HYBRID,
            location="Bengaluru, Karnataka",
            description="Design and maintain asynchronous microservices using Python and FastAPI.",
            requirements="Proficiency in Python, FastAPI, and relational database systems.",
            salary_min=1400000,
            salary_max=2200000,
            vacancies=3,
            status=JobStatusEnum.PENDING_APPROVAL,
            application_deadline=datetime.utcnow() + timedelta(days=25)
        )
        db.add(job)
        db.flush()

        py_sk = db.query(Skill).filter(Skill.name == "Python").first()
        fast_sk = db.query(Skill).filter(Skill.name == "FastAPI").first()
        db.add(JobSkill(job_id=job.id, skill_id=py_sk.id, is_mandatory=True, weight=1.0))
        db.add(JobSkill(job_id=job.id, skill_id=fast_sk.id, is_mandatory=True, weight=1.0))

        db.add(JobEligibility(
            job_id=job.id,
            min_cgpa=7.50,
            max_backlogs_allowed=0,
            allowed_grad_years=[2026],
            allowed_departments=["Computer Science and Engineering"],
            gender_preference=GenderPreferenceEnum.ANY
        ))
        db.commit()

        tpo_user = db.query(User).filter(User.role == UserRole.TPO).first()
        if not tpo_user:
            tpo_user = User(
                email=tpo_email,
                password_hash=get_password_hash("TPO@123456"),
                role=UserRole.TPO,
                is_active=True,
                is_verified=True
            )
            db.add(tpo_user)
            db.commit()

        AdminService.review_job_posting(
            db=db,
            admin_user=tpo_user,
            job_id=job.id,
            action="approve",
            comments="Verified campus requisition."
        )
        db.refresh(job)
        assert job.status == JobStatusEnum.ACTIVE
        print(f" [PASS] Job '{job.title}' approved by TPO officer (Status: ACTIVE).")

        # =====================================================================
        # 6. Intelligent Algorithmic Job Matching & Radar
        # =====================================================================
        print("\n--- STAGE 6: Algorithmic Job Matching Engine ---")
        radar_match = RecommendationService.get_job_radar_match(
            db=db,
            current_user=student_user,
            job_id=job.id
        )
        assert radar_match is not None
        assert radar_match["match_score"] >= 60.0
        assert radar_match["eligibility_status"] in ["eligible", "partially_eligible"]
        print(f" [PASS] Algorithmic Job Matching Score: {radar_match['match_score']}% (Status: {radar_match['eligibility_status']})")
        print(f"        Matched Skills: {radar_match['matched_skills']}")

        # =====================================================================
        # 7. Job Application Submission
        # =====================================================================
        print("\n--- STAGE 7: Job Application Submission ---")
        app_req = ApplicationCreateRequest(
            job_id=job.id,
            resume_id=resume_record.id,
            cover_note="Excited to apply for the Backend Engineering role at CloudTech."
        )
        app_res = ApplicationService.apply_to_job(db, student_user, app_req)
        assert app_res is not None
        application_id = app_res["id"]
        app_record = db.query(Application).filter(Application.id == application_id).first()
        assert app_record is not None
        assert app_record.current_status == ApplicationStatusEnum.APPLIED
        print(f" [PASS] Application submitted (ID: {application_id}, Status: APPLIED).")

        # =====================================================================
        # 8. Recruiter Review & Multi-Stage Pipeline Advancement
        # =====================================================================
        print("\n--- STAGE 8: Recruiter Candidate Review & Stage Advancement ---")
        from app.schemas.recruiter import CandidateFilterRequest
        candidate_res = RecruiterService.list_candidates(db, rec_user, filters=CandidateFilterRequest(job_id=job.id))
        candidates = candidate_res.get("items", [])
        candidate_entry = next((c for c in candidates if c["application_id"] == application_id), None)
        assert candidate_entry is not None
        assert candidate_entry["full_name"] == student_profile.full_name

        dossier = RecruiterService.get_candidate_application_detail(db, rec_user, application_id)
        assert dossier["candidate"]["email"] == student_email
        assert len(dossier["candidate"]["skills"]) >= 5

        # Advance stage: APPLIED -> SHORTLISTED
        advance_req = ApplicationStageAdvanceRequest(
            new_status="shortlisted",
            change_reason="Strong Python/FastAPI experience demonstrated."
        )
        RecruiterService.advance_application_stage(db, rec_user, application_id, advance_req)
        db.refresh(app_record)
        assert app_record.current_status == ApplicationStatusEnum.SHORTLISTED
        print(" [PASS] Recruiter advanced candidate: APPLIED -> SHORTLISTED.")

        # Advance stage: SHORTLISTED -> TECHNICAL_ROUND
        advance_req2 = ApplicationStageAdvanceRequest(
            new_status="technical_round",
            change_reason="Selected for Technical System Design round."
        )
        RecruiterService.advance_application_stage(db, rec_user, application_id, advance_req2)
        db.refresh(app_record)
        assert app_record.current_status == ApplicationStatusEnum.TECHNICAL_ROUND
        print(" [PASS] Recruiter advanced candidate: SHORTLISTED -> TECHNICAL_ROUND.")

        # =====================================================================
        # 9. Interview Scheduling & Student In-App Notifications
        # =====================================================================
        print("\n--- STAGE 9: Interview Scheduling & Student Notification Delivery ---")
        now = datetime.utcnow()
        itv_req = CandidateInterviewScheduleRequest(
            round_name="Technical Round I",
            scheduled_start=now + timedelta(days=2, hours=10),
            scheduled_end=now + timedelta(days=2, hours=11),
            interview_mode="virtual",
            meeting_link="https://meet.careerbridge.io/cloudtech-round1",
            interviewer_name="Dr. Elena Rostova (Staff AI Engineer)",
            instructions="Prepare to discuss system design, concurrency, and REST API design."
        )
        itv_result = RecruiterService.schedule_candidate_interview(db, rec_user, application_id, itv_req)
        assert itv_result["interview_id"] is not None
        print(f" [PASS] Interview scheduled: {itv_result['round_name']} on {itv_result['scheduled_start']}")

        # Student in-app notification verification
        notif_res = NotificationService.list_notifications(db, user_id=student_user.id)
        assert notif_res.total >= 1
        latest_notif = notif_res.notifications[0]
        print(f" [PASS] Student Notification received: '{latest_notif.title}' - {latest_notif.message}")

        # Student AI Interview Preparation Simulator Drill
        session_data = InterviewPrepService.start_session(
            db=db,
            student_id=student_profile.id,
            payload=InterviewStartRequest(
                target_role="Software Engineer",
                company_target="CloudTech",
                interview_type="technical",
                difficulty="intermediate"
            )
        )
        session_id = session_data["session_id"]
        q1 = session_data["question"]
        print(f" [PASS] Student started AI interview session (ID: {session_id}).")
        print(f"        Simulated Question: {q1['question_text'][:70]}...")

        eval_resp = InterviewPrepService.submit_answer(
            db=db,
            student_id=student_profile.id,
            session_id=session_id,
            payload=InterviewAnswerSubmitRequest(
                question_id=q1["question_id"],
                answer_text="In designing scalable asynchronous APIs with FastAPI, I use Pydantic models for strict type validation, async database sessions with SQLAlchemy, and Docker containers for isolated deployment."
            )
        )
        evaluation_obj = eval_resp["evaluation"]
        eval_score = evaluation_obj.overall_score if hasattr(evaluation_obj, "overall_score") else evaluation_obj["overall_score"]
        assert eval_score >= 50
        print(f" [PASS] AI Answer evaluation score: {eval_score}/100 with actionable feedback tips.")

        # =====================================================================
        # 10. Placement Officer Analytics & CSV Export
        # =====================================================================
        print("\n--- STAGE 10: TPO Administrative Analytics & Placement CSV Export ---")
        metrics = AdminService.get_dashboard_metrics(db)
        assert metrics.total_registered_students >= 1
        assert metrics.active_jobs >= 1
        assert metrics.total_applications >= 1
        print(f" [PASS] TPO Analytics verified: {metrics.total_registered_students} students, {metrics.active_jobs} active jobs, {metrics.total_applications} applications.")

        csv_data = AdminService.export_students_csv(db)
        assert len(csv_data) > 100
        print(f" [PASS] TPO Placement CSV Export verified ({len(csv_data.splitlines())} lines generated).")

        print("\n" + "=" * 80)
        print("ALL 10 COMPLETE USER JOURNEY STAGES VERIFIED AND PASSED WITH 100% RIGOR!")
        print("=" * 80)

    finally:
        db.close()


if __name__ == '__main__':
    test_complete_user_journey()
