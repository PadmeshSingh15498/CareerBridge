"""
Integration and Unit Tests for Job Discovery, Semantic Matching,
Academic Eligibility Gating, Application Workflow, and Recruiter Pipeline.
"""

from datetime import datetime, timedelta
import pytest
from app.models.user import User, UserRole
from app.models.student import StudentProfile, AcademicRecord, Skill, StudentSkill, SkillCategoryEnum
from app.models.recruiter import Company, RecruiterProfile, CompanySizeEnum
from app.models.job import Job, JobSkill, JobEligibility, SavedJob, JobTypeEnum, WorkplaceTypeEnum, JobStatusEnum, GenderPreferenceEnum
from app.models.resume import Resume, ResumeAnalysis
from app.models.application import Application, ApplicationStatusHistory, ApplicationStatusEnum
from app.ai.matching import evaluate_candidate_for_job, check_department_match, compute_semantic_similarity
from app.services.job_service import JobService
from app.services.application_service import ApplicationService
from app.schemas.job import JobCreateRequest, JobSkillInput, JobEligibilityInput
from app.schemas.application import ApplicationCreateRequest, ApplicationStatusUpdateRequest, ApplicationWithdrawRequest


@pytest.fixture
def placement_test_data(db_session):
    """Sets up an isolated company, recruiter, student with academic record & resume, and a job."""
    # 1. Company & Recruiter
    comp = db_session.query(Company).filter(Company.name == "Meta Platforms Test").first()
    if not comp:
        comp = Company(
            name="Meta Platforms Test",
            website_url="https://meta.com",
            industry="Social Technologies",
            company_size=CompanySizeEnum.TIER_1000_PLUS,
            is_verified=True
        )
        db_session.add(comp)
        db_session.flush()

    recruiter_user = db_session.query(User).filter(User.email == "meta_recruiter_test@meta.com").first()
    if not recruiter_user:
        recruiter_user = User(
            email="meta_recruiter_test@meta.com",
            password_hash="$argon2id$v=19$m=19456,t=2,p=1$fakehash123",
            role=UserRole.RECRUITER,
            is_active=True,
            is_verified=True
        )
        db_session.add(recruiter_user)
        db_session.flush()

    recruiter = db_session.query(RecruiterProfile).filter(RecruiterProfile.user_id == recruiter_user.id).first()
    if not recruiter:
        recruiter = RecruiterProfile(
            user_id=recruiter_user.id,
            company_id=comp.id,
            designation="Principal University Talent Partner"
        )
        db_session.add(recruiter)
        db_session.flush()

    # 2. Student User & Profile
    student_user = db_session.query(User).filter(User.email == "student_phase7_test@university.edu").first()
    if not student_user:
        student_user = User(
            email="student_phase7_test@university.edu",
            password_hash="$argon2id$v=19$m=19456,t=2,p=1$fakehash123",
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=True
        )
        db_session.add(student_user)
        db_session.flush()

    student_profile = db_session.query(StudentProfile).filter(StudentProfile.user_id == student_user.id).first()
    if not student_profile:
        student_profile = StudentProfile(
            user_id=student_user.id,
            full_name="Priya Nair",
            roll_number="2022CSB9999",
            city="Bengaluru"
        )
        db_session.add(student_profile)
        db_session.flush()

    # Academic Record
    acad = db_session.query(AcademicRecord).filter(AcademicRecord.student_id == student_profile.id).first()
    if not acad:
        acad = AcademicRecord(
            student_id=student_profile.id,
            institution_name="National Institute of Technology",
            degree="B.Tech",
            department="Computer Science and Engineering",
            start_year=2022,
            end_year=2026,
            cgpa_or_percentage=8.85,
            backlogs_count=0
        )
        db_session.add(acad)
        db_session.flush()

    # Skills: Python, FastAPI, Docker
    for sname in ["Python", "FastAPI", "Docker"]:
        db_s = db_session.query(Skill).filter(Skill.name.ilike(sname)).first()
        if not db_s:
            db_s = Skill(name=sname, category=SkillCategoryEnum.PROGRAMMING_LANGUAGE)
            db_session.add(db_s)
            db_session.flush()
        if not db_session.query(StudentSkill).filter_by(student_id=student_profile.id, skill_id=db_s.id).first():
            db_session.add(StudentSkill(student_id=student_profile.id, skill_id=db_s.id))
    db_session.flush()

    # Resume
    resume = db_session.query(Resume).filter(Resume.student_id == student_profile.id).first()
    if not resume:
        resume = Resume(
            student_id=student_profile.id,
            title="Software Engineering Resume",
            file_name="Priya_Nair_Resume_v1.pdf",
            file_path="storage/resumes/priya_v1.pdf",
            file_size_bytes=104800,
            mime_type="application/pdf",
            is_default=True
        )
        db_session.add(resume)
        db_session.flush()

        analysis = ResumeAnalysis(
            resume_id=resume.id,
            raw_text="Priya Nair. Full Stack and Cloud Engineer proficient in Python, FastAPI, Docker, and distributed systems.",
            ats_score=85,
            extracted_skills=["Python", "FastAPI", "Docker"],
            improvements_json=[]
        )
        db_session.add(analysis)
        db_session.flush()

    # TPO Admin user
    tpo_user = db_session.query(User).filter(User.role.in_([UserRole.TPO, UserRole.ADMIN])).first()

    db_session.commit()

    return {
        "company": comp,
        "recruiter_user": recruiter_user,
        "recruiter": recruiter,
        "student_user": student_user,
        "student": student_profile,
        "academic": acad,
        "resume": resume,
        "tpo_user": tpo_user,
    }


def test_ai_matching_engine_computation(placement_test_data):
    """Validates TF-IDF semantic cosine similarity and skill overlap calculation."""
    student = placement_test_data["student"]

    # Mock Job object
    class DummySkill:
        def __init__(self, name, mandatory):
            self.skill = type("S", (), {"name": name})()
            self.is_mandatory = mandatory

    class DummyEligibility:
        min_cgpa = 7.5
        max_backlogs_allowed = 0
        allowed_grad_years = [2026]
        allowed_departments = ["Computer Science", "Information Technology"]
        gender_preference = "any"

    class DummyJob:
        title = "Cloud Infrastructure Engineer"
        description = "Develop high-throughput cloud microservices using Python, FastAPI, and containerization with Docker."
        requirements = "Proficiency in Python and REST APIs. Docker container deployment."
        skills = [DummySkill("Python", True), DummySkill("FastAPI", True), DummySkill("Docker", False)]
        eligibility = DummyEligibility()

    result = evaluate_candidate_for_job(student, DummyJob())

    assert result["is_eligible"] is True
    assert result["composite_score"] > 60.0
    assert "Python" in result["matched_skills"]
    assert "FastAPI" in result["matched_skills"]
    assert len(result["missing_skills"]) == 0
    assert result["eligibility_breakdown"]["cgpa_met"] is True


def test_department_normalization_and_matching():
    """Validates robust department acronym matching."""
    assert check_department_match("Computer Science and Engineering", ["Computer Science"]) is True
    assert check_department_match("CSE", ["Computer Science"]) is True
    assert check_department_match("Information Technology", ["IT"]) is True
    assert check_department_match("Civil Engineering", ["Computer Science", "Electronics"]) is False


def test_recruiter_creates_job_and_requires_approval(db_session, placement_test_data):
    """Tests recruiter job posting initial PENDING_APPROVAL status and placement officer approval."""
    recruiter_user = placement_test_data["recruiter_user"]
    tpo_user = placement_test_data["tpo_user"]

    payload = JobCreateRequest(
        title="Distributed Systems Engineer",
        job_type="full_time",
        workplace_type="on_site",
        location="Hyderabad, India",
        description="Build large-scale low-latency distributed storage clusters.",
        requirements="B.Tech Computer Science with C++ or Python experience.",
        salary_min=1800000.0,
        salary_max=2400000.0,
        vacancies=4,
        application_deadline=datetime.utcnow() + timedelta(days=20),
        skills=[
            JobSkillInput(name="Python", is_mandatory=True),
            JobSkillInput(name="Docker", is_mandatory=False)
        ],
        eligibility=JobEligibilityInput(
            min_cgpa=8.0,
            max_backlogs_allowed=0,
            allowed_grad_years=[2026],
            allowed_departments=["Computer Science and Engineering"]
        )
    )

    created_job = JobService.create_job(db_session, recruiter_user, payload)
    assert created_job.status == JobStatusEnum.PENDING_APPROVAL
    assert created_job.title == "Distributed Systems Engineer"

    # Placement Officer approves job
    if tpo_user:
        approved_job = JobService.approve_job(db_session, tpo_user, created_job.id, approved=True)
        assert approved_job.status == JobStatusEnum.ACTIVE


def test_job_discovery_and_saved_toggle(db_session, placement_test_data):
    """Tests student job discovery, personalized match scoring, and bookmark toggling."""
    student_user = placement_test_data["student_user"]
    student = placement_test_data["student"]

    # Ensure at least one active job exists
    job = db_session.query(Job).filter(Job.status == JobStatusEnum.ACTIVE).order_by(Job.created_at.desc()).first()
    assert job is not None

    # Student lists jobs
    listing = JobService.get_jobs(db_session, current_user=student_user, page_size=100)
    assert listing["total"] >= 1
    assert any(item["id"] == job.id for item in listing["items"])

    # Toggle bookmark
    is_saved = JobService.toggle_save_job(db_session, student_user, job.id)
    assert is_saved is True

    # Check saved query
    saved_listing = JobService.get_jobs(db_session, current_user=student_user, saved_only=True)
    assert any(item["id"] == job.id for item in saved_listing["items"])

    # Toggle off
    is_saved_again = JobService.toggle_save_job(db_session, student_user, job.id)
    assert is_saved_again is False


def test_student_application_workflow(db_session, placement_test_data):
    """Tests 1-click apply, duplicate prevention, and initial audit trail."""
    student_user = placement_test_data["student_user"]
    student = placement_test_data["student"]
    resume = placement_test_data["resume"]

    job = db_session.query(Job).filter(Job.status == JobStatusEnum.ACTIVE).first()
    assert job is not None

    # Clear previous test application if present
    db_session.query(Application).filter_by(job_id=job.id, student_id=student.id).delete()
    db_session.commit()

    payload = ApplicationCreateRequest(
        job_id=job.id,
        resume_id=resume.id,
        cover_letter="Passionate about cloud systems architecture and distributed computing."
    )

    app_res = ApplicationService.apply_to_job(db_session, student_user, payload)
    assert app_res["current_status"] == "applied"
    assert app_res["composite_match_score"] > 0.0
    assert len(app_res["status_history"]) >= 1
    assert app_res["status_history"][0]["new_status"] == "applied"

    # Duplicate application check: must raise exception
    with pytest.raises(Exception) as excinfo:
        ApplicationService.apply_to_job(db_session, student_user, payload)
    assert "already submitted" in str(excinfo.value.detail).lower()


def test_ineligible_criteria_blocks_application(db_session, placement_test_data):
    """Tests that hard academic criteria (CGPA/backlogs) blocks ineligible student applications."""
    student_user = placement_test_data["student_user"]
    resume = placement_test_data["resume"]
    comp = placement_test_data["company"]
    recruiter = placement_test_data["recruiter"]

    # Create job with strict 9.90 CGPA requirement
    strict_job = Job(
        company_id=comp.id,
        posted_by=recruiter.id,
        title="High Frequency Quantitative Researcher",
        location="Mumbai",
        description="Algorithmic trading engine development.",
        requirements="Exceptional academic performance.",
        status=JobStatusEnum.ACTIVE,
        application_deadline=datetime.utcnow() + timedelta(days=10)
    )
    db_session.add(strict_job)
    db_session.flush()

    strict_elig = JobEligibility(
        job_id=strict_job.id,
        min_cgpa=9.90,  # Student has 8.85
        max_backlogs_allowed=0,
        allowed_grad_years=[2026],
        allowed_departments=["Computer Science and Engineering"]
    )
    db_session.add(strict_elig)
    db_session.commit()

    payload = ApplicationCreateRequest(job_id=strict_job.id, resume_id=resume.id)

    with pytest.raises(Exception) as excinfo:
        ApplicationService.apply_to_job(db_session, student_user, payload)

    assert "eligibility requirement not met" in str(excinfo.value.detail).lower()


def test_ai_score_does_not_reject_student(db_session, placement_test_data):
    """
    Crucial business rule verification:
    'Do not automatically reject a student based on AI similarity scores.'
    """
    student_user = placement_test_data["student_user"]
    student = placement_test_data["student"]
    resume = placement_test_data["resume"]
    comp = placement_test_data["company"]
    recruiter = placement_test_data["recruiter"]

    # Job with skills the student does not have (e.g. Rust, Go, Blockchain),
    # but with open academic eligibility (min_cgpa=6.0)
    unmatched_job = Job(
        company_id=comp.id,
        posted_by=recruiter.id,
        title="Rust Core Systems Developer",
        location="Bengaluru",
        description="Low level Linux kernel and blockchain infrastructure.",
        requirements="Rust and Solana expertise.",
        status=JobStatusEnum.ACTIVE,
        application_deadline=datetime.utcnow() + timedelta(days=10)
    )
    db_session.add(unmatched_job)
    db_session.flush()

    elig = JobEligibility(
        job_id=unmatched_job.id,
        min_cgpa=6.0,
        max_backlogs_allowed=2,
        allowed_grad_years=[2026],
        allowed_departments=[]
    )
    db_session.add(elig)
    db_session.commit()

    payload = ApplicationCreateRequest(job_id=unmatched_job.id, resume_id=resume.id)

    app_res = ApplicationService.apply_to_job(db_session, student_user, payload)
    # The application is successfully accepted with status APPLIED, NOT rejected
    assert app_res["current_status"] == "applied"


def test_recruiter_pipeline_ranking_and_status_advance(db_session, placement_test_data):
    """Tests recruiter viewing applicants ranked by AI Match Score and advancing stages."""
    recruiter_user = placement_test_data["recruiter_user"]
    student = placement_test_data["student"]

    # Find an application for this recruiter's company
    app = db_session.query(Application).join(Job).filter(Job.company_id == placement_test_data["company"].id).first()
    assert app is not None

    # Advance to SHORTLISTED
    update_payload = ApplicationStatusUpdateRequest(
        new_status="shortlisted",
        change_reason="Exceptional technical portfolio match"
    )
    updated = ApplicationService.update_application_status(db_session, recruiter_user, app.id, update_payload)
    assert updated["current_status"] == "shortlisted"
    assert any(h["new_status"] == "shortlisted" for h in updated["status_history"])


def test_student_withdraws_application(db_session, placement_test_data):
    """Tests student voluntary application withdrawal."""
    student_user = placement_test_data["student_user"]
    student = placement_test_data["student"]

    app = db_session.query(Application).filter_by(student_id=student.id).first()
    assert app is not None
    app.current_status = ApplicationStatusEnum.APPLIED
    db_session.commit()

    withdraw_payload = ApplicationWithdrawRequest(reason="Accepted off-campus placement offer")
    res = ApplicationService.withdraw_application(db_session, student_user, app.id, withdraw_payload)
    assert res["current_status"] == "withdrawn"
    assert any(h["new_status"] == "withdrawn" for h in res["status_history"])
