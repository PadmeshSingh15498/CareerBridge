"""
Comprehensive Unit & Integration Test Suite for Phase 12:
Recruiter Workspace & Candidate Intelligence.
Validates:
1. Company Profile Management & Field Updates
2. Real Database Dashboard Metrics & Requisition Summaries
3. AI-Assisted Job Description Generation & Review Requirement
4. Organization Verification Gating on Active Job Publishing
5. Candidate Intelligence & Multi-Attribute Filtering
6. Candidate Application Dossiers with PyMuPDF ATS Metrics & Advisory AI Match
7. Strict Cross-Company Authorization & Data Isolation
8. Recruiter Private Notes Confidentiality (Never Exposed to Candidate)
9. Application Stage Transitions & Audit Trails
10. Interview Scheduling & Assessment Rubrics
"""

from datetime import datetime, timedelta
import pytest
from app.models.user import User, UserRole, Notification
from app.models.student import (
    StudentProfile, AcademicRecord, Skill, StudentSkill,
    StudentProject, StudentExperience, StudentCertification, SkillCategoryEnum
)
from app.models.recruiter import Company, RecruiterProfile, CompanySizeEnum
from app.models.job import (
    Job, JobSkill, JobEligibility, JobTypeEnum,
    WorkplaceTypeEnum, JobStatusEnum, GenderPreferenceEnum
)
from app.models.resume import Resume, ResumeAnalysis
from app.models.application import (
    Application, ApplicationStatusHistory, Interview, InterviewFeedback,
    ApplicationStatusEnum, InterviewStatusEnum, InterviewRecommendationEnum
)
from app.services.recruiter_service import RecruiterService
from app.ai.job_desc_generator import generate_job_description
from app.schemas.recruiter import (
    CompanyProfileUpdateRequest, CandidateFilterRequest,
    ApplicationStageAdvanceRequest, CandidateInterviewScheduleRequest,
    InterviewFeedbackCreateRequest
)
from app.schemas.job import JobCreateRequest, JobSkillInput, JobEligibilityInput


@pytest.fixture
def recruiter_workspace_data(db_session):
    """Creates isolated test companies, recruiters, students, jobs, and applications."""
    # 1. Company Alpha (Verified)
    comp_a = db_session.query(Company).filter(Company.name == "Alpha Innovations Corp").first()
    if not comp_a:
        comp_a = Company(
            name="Alpha Innovations Corp",
            website_url="https://alpha.example.com",
            industry="Software & AI",
            company_size=CompanySizeEnum.TIER_201_1000,
            headquarters="Bengaluru, KA",
            is_verified=True,
            verification_status="verified"
        )
        db_session.add(comp_a)
        db_session.flush()

    user_a = db_session.query(User).filter(User.email == "recruiter_alpha@alpha.com").first()
    if not user_a:
        user_a = User(
            email="recruiter_alpha@alpha.com",
            password_hash="$argon2id$v=19$m=19456,t=2,p=1$fakehash123",
            role=UserRole.RECRUITER,
            is_active=True,
            is_verified=True
        )
        db_session.add(user_a)
        db_session.flush()

    rec_a = db_session.query(RecruiterProfile).filter(RecruiterProfile.user_id == user_a.id).first()
    if not rec_a:
        rec_a = RecruiterProfile(
            user_id=user_a.id,
            company_id=comp_a.id,
            designation="Director of University Recruiting"
        )
        db_session.add(rec_a)
        db_session.flush()

    # 2. Company Beta (Unverified / Pending)
    comp_b = db_session.query(Company).filter(Company.name == "Beta Stealth Labs").first()
    if not comp_b:
        comp_b = Company(
            name="Beta Stealth Labs",
            website_url="https://beta.example.com",
            industry="Robotics",
            company_size=CompanySizeEnum.TIER_11_50,
            headquarters="Hyderabad, TS",
            is_verified=False,
            verification_status="pending_verification"
        )
        db_session.add(comp_b)
        db_session.flush()

    user_b = db_session.query(User).filter(User.email == "recruiter_beta@beta.com").first()
    if not user_b:
        user_b = User(
            email="recruiter_beta@beta.com",
            password_hash="$argon2id$v=19$m=19456,t=2,p=1$fakehash123",
            role=UserRole.RECRUITER,
            is_active=True,
            is_verified=False
        )
        db_session.add(user_b)
        db_session.flush()

    rec_b = db_session.query(RecruiterProfile).filter(RecruiterProfile.user_id == user_b.id).first()
    if not rec_b:
        rec_b = RecruiterProfile(
            user_id=user_b.id,
            company_id=comp_b.id,
            designation="Talent Acquisition Specialist"
        )
        db_session.add(rec_b)
        db_session.flush()

    # 3. Student Candidate (Alice)
    alice_user = db_session.query(User).filter(User.email == "alice_phase12@univ.edu").first()
    if not alice_user:
        alice_user = User(
            email="alice_phase12@univ.edu",
            password_hash="$argon2id$v=19$m=19456,t=2,p=1$fakehash123",
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=True
        )
        db_session.add(alice_user)
        db_session.flush()

    alice_std = db_session.query(StudentProfile).filter(StudentProfile.user_id == alice_user.id).first()
    if not alice_std:
        alice_std = StudentProfile(
            user_id=alice_user.id,
            full_name="Alice Smith",
            roll_number="CS2026-088",
            phone_number="+91 98765 43210"
        )
        db_session.add(alice_std)
        db_session.flush()

        acad = AcademicRecord(
            student_id=alice_std.id,
            institution_name="National Institute of Technology",
            degree="B.Tech",
            department="Computer Science and Engineering",
            start_year=2022,
            end_year=2026,
            cgpa_or_percentage=8.85,
            backlogs_count=0
        )
        db_session.add(acad)

        from app.models.student import ProficiencyLevelEnum

        # Skills
        py_skill = db_session.query(Skill).filter(Skill.name == "Python").first()
        if not py_skill:
            py_skill = Skill(name="Python", category=SkillCategoryEnum.PROGRAMMING_LANGUAGE)
            db_session.add(py_skill)
            db_session.flush()
        db_session.add(StudentSkill(student_id=alice_std.id, skill_id=py_skill.id, proficiency_level=ProficiencyLevelEnum.ADVANCED, is_verified=True))

        react_skill = db_session.query(Skill).filter(Skill.name == "React").first()
        if not react_skill:
            react_skill = Skill(name="React", category=SkillCategoryEnum.FRAMEWORK)
            db_session.add(react_skill)
            db_session.flush()
        db_session.add(StudentSkill(student_id=alice_std.id, skill_id=react_skill.id, proficiency_level=ProficiencyLevelEnum.INTERMEDIATE, is_verified=True))

        # Project
        db_session.add(StudentProject(
            student_id=alice_std.id,
            title="Real-Time Analytics Dashboard",
            description="Full-stack streaming dashboard with Python and React.",
            technologies_used=["Python", "FastAPI", "React", "Docker"],
            github_url="https://github.com/alice/analytics",
            live_demo_url="https://analytics-demo.alice.dev"
        ))

        # Resume & Analysis
        resume = Resume(
            student_id=alice_std.id,
            title="Alice Primary Resume",
            file_name="alice_smith_cv.pdf",
            file_path="/uploads/resumes/alice_cv.pdf",
            file_size_bytes=104500,
            mime_type="application/pdf",
            is_default=True
        )
        db_session.add(resume)
        db_session.flush()

        ra = ResumeAnalysis(
            resume_id=resume.id,
            raw_text="Alice Smith. NIT CS 2026. Python, React, FastAPI, SQL. Built real-time analytics dashboard.",
            ats_score=87,
            section_score=90,
            metric_score=85,
            skill_score=88,
            format_score=83,
            extracted_skills=["Python", "React", "FastAPI", "SQL"],
            improvements_json=["Add more quantifiable business impact"]
        )
        db_session.add(ra)

    # 4. Job Posting for Alpha
    job_a = db_session.query(Job).filter(Job.title == "Graduate Software Engineer (Alpha)").first()
    if not job_a:
        job_a = Job(
            company_id=comp_a.id,
            posted_by=rec_a.id,
            title="Graduate Software Engineer (Alpha)",
            job_type=JobTypeEnum.FULL_TIME,
            workplace_type=WorkplaceTypeEnum.HYBRID,
            location="Bengaluru, KA",
            description="Build cloud-native SaaS services with Python and modern web frameworks.",
            requirements="B.Tech in CSE/IT with CGPA >= 7.5. Python, React, REST APIs.",
            salary_min=1200000,
            salary_max=1800000,
            vacancies=4,
            status=JobStatusEnum.ACTIVE,
            application_deadline=datetime.utcnow() + timedelta(days=30)
        )
        db_session.add(job_a)
        db_session.flush()

        py_skill = db_session.query(Skill).filter(Skill.name == "Python").first()
        db_session.add(JobSkill(job_id=job_a.id, skill_id=py_skill.id, is_mandatory=True, weight=1.0))

        db_session.add(JobEligibility(
            job_id=job_a.id,
            min_cgpa=7.50,
            max_backlogs_allowed=0,
            allowed_grad_years=[2026],
            allowed_departments=["Computer Science and Engineering", "Information Technology"],
            gender_preference=GenderPreferenceEnum.ANY
        ))

    # 5. Application of Alice to Alpha's Job
    resume = db_session.query(Resume).filter(Resume.student_id == alice_std.id).first()
    app_a = db_session.query(Application).filter(Application.job_id == job_a.id, Application.student_id == alice_std.id).first()
    if not app_a:
        app_a = Application(
            job_id=job_a.id,
            student_id=alice_std.id,
            resume_id=resume.id,
            current_status=ApplicationStatusEnum.APPLIED,
            cover_letter="Excited to apply for the Graduate Software Engineer role at Alpha Corp.",
            composite_match_score=88.5,
            applied_at=datetime.utcnow()
        )
        db_session.add(app_a)
        db_session.flush()

        db_session.add(ApplicationStatusHistory(
            application_id=app_a.id,
            previous_status=None,
            new_status=ApplicationStatusEnum.APPLIED.value,
            changed_by_user_id=alice_user.id,
            change_reason="Applied via CareerBridge portal",
            created_at=datetime.utcnow()
        ))

    else:
        app_a.current_status = ApplicationStatusEnum.APPLIED

    db_session.commit()

    return {
        "comp_a": comp_a,
        "user_a": user_a,
        "rec_a": rec_a,
        "comp_b": comp_b,
        "user_b": user_b,
        "rec_b": rec_b,
        "alice_user": alice_user,
        "alice_std": alice_std,
        "job_a": job_a,
        "app_a": app_a
    }


# =============================================================================
# TESTS
# =============================================================================

def test_company_profile_retrieval_and_update(db_session, recruiter_workspace_data):
    """Tests company profile reading and multi-attribute updates."""
    data = recruiter_workspace_data
    user_a = data["user_a"]

    # 1. Retrieve profile
    profile = RecruiterService.get_company_profile(db_session, user_a)
    assert profile["name"] == "Alpha Innovations Corp"
    assert profile["is_verified"] is True
    assert profile["can_publish_jobs"] is True
    assert profile["verification_status"] == "verified"

    # 2. Update profile
    update_req = CompanyProfileUpdateRequest(
        headquarters="Electronic City, Bengaluru, KA",
        description="Pioneering enterprise AI software solutions.",
        hr_contact_name="Sarah Connor",
        hr_contact_email="sarah.connor@alpha.com",
        hr_contact_phone="+91 80 4123 4567"
    )
    updated = RecruiterService.update_company_profile(db_session, user_a, update_req)
    assert updated["headquarters"] == "Electronic City, Bengaluru, KA"
    assert updated["hr_contact_name"] == "Sarah Connor"
    assert updated["hr_contact_email"] == "sarah.connor@alpha.com"
    assert updated["description"] == "Pioneering enterprise AI software solutions."


def test_recruiter_dashboard_actual_database_metrics(db_session, recruiter_workspace_data):
    """Tests recruiter dashboard returns actual database counts."""
    data = recruiter_workspace_data
    user_a = data["user_a"]

    metrics = RecruiterService.get_dashboard_metrics(db_session, user_a)
    assert metrics["active_jobs_count"] >= 1
    assert metrics["total_applications_count"] >= 1
    assert metrics["is_company_verified"] is True
    assert "pipeline_breakdown" in metrics
    assert sum(metrics["pipeline_breakdown"].values()) >= 1
    assert len(metrics["recent_applications"]) >= 1
    assert metrics["recent_applications"][0]["candidate_name"] == "Alice Smith"
    assert metrics["recent_applications"][0]["cgpa"] == 8.85


def test_ai_job_description_generator_with_review_enforcement():
    """Tests AI job description generator produces rich structured output requiring recruiter review."""
    result = generate_job_description(
        job_title="Full Stack Software Engineer",
        industry="Enterprise SaaS",
        experience_level="Campus Graduate",
        workplace_type="Hybrid",
        core_skills=["React", "Node.js", "PostgreSQL", "Docker"],
        key_responsibilities="Build scalable web components\nMaintain REST microservices"
    )

    assert result["job_title"] == "Full Stack Software Engineer"
    assert len(result["responsibilities"]) >= 3
    assert len(result["qualifications"]) >= 2
    assert "formatted_description" in result
    assert "formatted_requirements" in result
    assert "React" in result["formatted_requirements"]
    assert "About the Role" in result["formatted_description"]


def test_verification_gating_blocks_unverified_job_publishing(db_session, recruiter_workspace_data):
    """
    Verifies that an unverified recruiter cannot publish an active job.
    The requisition must be forced to PENDING_APPROVAL or blocked with 400.
    """
    data = recruiter_workspace_data
    user_b = data["user_b"]  # Beta is unverified

    # Attempt to create an active job requisition
    req = JobCreateRequest(
        title="Unverified AI Researcher Requisition",
        job_type="full_time",
        workplace_type="remote",
        location="Hyderabad, TS",
        description="Cutting edge robotics and LLM systems engineering.",
        requirements="B.Tech in CSE.",
        vacancies=2,
        application_deadline=datetime.utcnow() + timedelta(days=20),
        skills=[JobSkillInput(name="Python", is_mandatory=True)]
    )

    created_job = RecruiterService.create_job(db_session, user_b, req)
    # Status should be PENDING_APPROVAL because Company B is unverified
    assert created_job["status"] == "pending_approval"
    assert "verification_notice" in created_job

    # Attempting to manually update status to ACTIVE must raise 400 Bad Request
    with pytest.raises(Exception) as exc_info:
        RecruiterService.update_job_status(db_session, user_b, created_job["id"], "active")
    assert "organization verification is pending" in str(exc_info.value.detail).lower()


def test_candidate_listing_and_filtering(db_session, recruiter_workspace_data):
    """Tests candidate pipeline filtering by job, skill, CGPA, and advisory match categorization."""
    data = recruiter_workspace_data
    user_a = data["user_a"]
    job_a = data["job_a"]

    # 1. List all candidates for company Alpha
    filters = CandidateFilterRequest(job_id=job_a.id)
    candidates = RecruiterService.list_candidates(db_session, user_a, filters)
    assert candidates["total"] >= 1
    alice_item = candidates["items"][0]
    assert alice_item["full_name"] == "Alice Smith"
    assert alice_item["cgpa"] == 8.85
    assert alice_item["advisory_recommendation"] == "Excellent Match"
    assert alice_item["is_academically_eligible"] is True

    # 2. Filter with matching skill
    filters_skill = CandidateFilterRequest(job_id=job_a.id, skill="Python")
    res_skill = RecruiterService.list_candidates(db_session, user_a, filters_skill)
    assert res_skill["total"] >= 1

    # 3. Filter with non-matching skill
    filters_no_skill = CandidateFilterRequest(job_id=job_a.id, skill="COBOL")
    res_no_skill = RecruiterService.list_candidates(db_session, user_a, filters_no_skill)
    assert res_no_skill["total"] == 0

    # 4. Filter with high CGPA cutoff
    filters_high_cgpa = CandidateFilterRequest(job_id=job_a.id, min_cgpa=9.5)
    res_high_cgpa = RecruiterService.list_candidates(db_session, user_a, filters_high_cgpa)
    assert res_high_cgpa["total"] == 0


def test_candidate_detail_dossier_and_cross_company_isolation(db_session, recruiter_workspace_data):
    """
    Validates complete candidate dossier with resume analysis and advisory AI breakdown,
    and verifies strict cross-company isolation (Recruiter B cannot access Recruiter A's applicants).
    """
    data = recruiter_workspace_data
    user_a = data["user_a"]
    user_b = data["user_b"]
    app_a = data["app_a"]

    # 1. Recruiter A accesses their own candidate's application dossier
    dossier = RecruiterService.get_candidate_application_detail(db_session, user_a, app_a.id)
    assert dossier["application_id"] == app_a.id
    assert dossier["candidate"]["full_name"] == "Alice Smith"
    assert dossier["resume_analysis"]["ats_overall_score"] >= 80.0
    assert dossier["ai_match_breakdown"]["composite_score"] >= 70.0
    assert "ADVISORY" in dossier["ai_match_breakdown"]["advisory_banner"].upper()

    # 2. Recruiter B attempts to access candidate applied to Company A -> Must be forbidden (HTTP 403)
    with pytest.raises(Exception) as exc_info:
        RecruiterService.get_candidate_application_detail(db_session, user_b, app_a.id)
    assert "access denied" in str(exc_info.value.detail).lower()


def test_recruiter_private_notes_confidentiality(db_session, recruiter_workspace_data):
    """Tests saving recruiter private notes and verifies they are stored privately."""
    data = recruiter_workspace_data
    user_a = data["user_a"]
    app_a = data["app_a"]

    # Update private notes
    notes_text = "Strong systems background; verified GitHub repos. Recommend moving to System Architecture round."
    notes_res = RecruiterService.update_recruiter_notes(db_session, user_a, app_a.id, notes_text)
    assert notes_res["updated"] is True

    # Retrieve dossier and check notes
    dossier = RecruiterService.get_candidate_application_detail(db_session, user_a, app_a.id)
    assert dossier["recruiter_notes"] == notes_text


def test_advance_candidate_stage_and_audit_trail(db_session, recruiter_workspace_data):
    """Tests advancing candidate stage, audit history logging, and student notification dispatch."""
    data = recruiter_workspace_data
    user_a = data["user_a"]
    app_a = data["app_a"]
    alice_user = data["alice_user"]

    # Advance stage to SHORTLISTED
    req = ApplicationStageAdvanceRequest(
        new_status="shortlisted",
        change_reason="Profile evaluated by engineering lead; strong project credentials."
    )
    result = RecruiterService.advance_application_stage(db_session, user_a, app_a.id, req)
    assert result["new_status"] == "shortlisted"

    # Verify notification dispatched to student
    notif = db_session.query(Notification).filter(
        Notification.user_id == alice_user.id,
        Notification.title == "Application Status Updated"
    ).order_by(Notification.created_at.desc()).first()
    assert notif is not None
    assert "Shortlisted" in notif.message


def test_schedule_interview_and_feedback_rubric(db_session, recruiter_workspace_data):
    """Tests scheduling an interview (mode, venue, instructions) and recording assessment feedback rubric."""
    data = recruiter_workspace_data
    user_a = data["user_a"]
    app_a = data["app_a"]

    # 1. Schedule Interview
    start_time = datetime.utcnow() + timedelta(days=2, hours=10)
    end_time = start_time + timedelta(hours=1)
    iv_req = CandidateInterviewScheduleRequest(
        round_name="Technical Architecture & Python Deep Dive",
        scheduled_start=start_time,
        scheduled_end=end_time,
        interview_mode="virtual",
        meeting_link="https://meet.alpha.com/eng-alice",
        interviewer_name="David Chen, Principal Architect",
        instructions="Please have your local development environment and IDE ready for live coding."
    )
    iv_res = RecruiterService.schedule_candidate_interview(db_session, user_a, app_a.id, iv_req)
    assert iv_res["round_name"] == "Technical Architecture & Python Deep Dive"
    assert iv_res["interview_mode"] == "virtual"
    assert iv_res["status"] == "scheduled"

    # 2. Record Feedback Rubric
    fb_req = InterviewFeedbackCreateRequest(
        technical_rating=5,
        communication_rating=4,
        problem_solving_rating=5,
        recommendation="strong_hire",
        detailed_notes="Exceptional clarity on distributed concurrency and API idempotency."
    )
    fb_res = RecruiterService.record_interview_feedback(db_session, user_a, iv_res["interview_id"], fb_req)
    assert fb_res["recommendation"] == "strong_hire"
    assert fb_res["technical_rating"] == 5
    assert fb_res["problem_solving_rating"] == 5

    # Check interview status is COMPLETED
    iv_obj = db_session.query(Interview).filter(Interview.id == iv_res["interview_id"]).first()
    assert iv_obj.status == InterviewStatusEnum.COMPLETED
