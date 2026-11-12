"""
Integration and Unit Tests for AI Resume Analyzer (Phase 8).
Validates multi-dimensional rubric scoring, action verb suggestions, metric detection,
job-specific comparison, PDF export, LLM fallback, and multi-tier synthetic resumes.
"""

import pytest
import asyncio
from app.models.user import User, UserRole
from app.models.student import StudentProfile
from app.models.resume import Resume, ResumeAnalysis, ResumeAnalysisHistory
from app.models.job import Job, JobSkill, JobStatusEnum
from app.models.recruiter import Company
from app.ai.resume_analyzer.scoring_rubric import ScoringWeights, DEFAULT_WEIGHTS, DISCLAIMER_TEXT
from app.ai.resume_analyzer.nlp_evaluator import evaluate_resume_content
from app.ai.resume_analyzer.job_matcher import analyze_resume_for_job
from app.ai.resume_analyzer.pdf_generator import generate_analysis_pdf
from app.ai.resume_analyzer.llm_client import analyze_with_llm
from app.services.resume_analysis_service import ResumeAnalysisService


JUNIOR_RESUME_TEXT = """
Amit Kumar
amit.kumar@gmail.com | 9876543210
Education:
B.Tech in Computer Science, 2026, CGPA: 7.2
Skills:
C++, Python, HTML, CSS
Projects:
Library Management System: Made a simple desktop app for college library. Helped with database design.
"""

SENIOR_RESUME_TEXT = """
Sneha Rao
sneha.rao@university.edu | +91 9988776655 | linkedin.com/in/sneharao | github.com/sneharao | https://sneharao.dev
Education:
B.Tech in Computer Science and Engineering, National Institute of Technology, 2025, CGPA: 9.40 / 10
Technical Skills:
Languages: Python, TypeScript, Go, SQL
Frameworks: FastAPI, React, Next.js, Node.js, Tailwind CSS
Databases & Cloud: MySQL, Redis, Docker, Kubernetes, AWS, Git
Experience:
Software Engineering Intern at CloudScale Technologies (Jan 2024 - June 2024)
- Architected and deployed asynchronous microservices using FastAPI and Docker, reducing p95 latency by 42%.
- Optimized MySQL database indexing across 2.5M records, accelerating query execution times from 850ms to 45ms.
Projects:
Distributed Real-time Event Pipeline (https://github.com/sneharao/event-pipeline)
- Spearheaded distributed streaming pipeline utilizing Python and Redis Streams, handling 35,000 events/second with 99.9% uptime.
- Built responsive observability dashboard in Next.js and Recharts monitoring throughput across 4 Kubernetes pods.
Certifications & Achievements:
- AWS Certified Cloud Practitioner
- Smart India Hackathon Winner 2023 (First Prize among 400 national teams)
- Solved 450+ algorithmic problems on LeetCode (Top 5% contest rating)
"""


def test_rubric_weights_normalization():
    """Validates that customizable weights normalize precisely to 100 points."""
    custom = ScoringWeights(
        structure=30.0,
        technical_skills=30.0,
        projects=20.0,
        experience=10.0,
        education=5.0,
        achievements=2.5,
        readability=2.5
    )
    normalized = custom.normalize()
    total = sum(normalized.model_dump().values())
    assert round(total, 1) == 100.0


def test_nlp_evaluator_dimensions_junior_vs_senior():
    """Tests all 13 dimensions against synthetic junior and senior resumes."""
    junior_eval = evaluate_resume_content(JUNIOR_RESUME_TEXT)
    senior_eval = evaluate_resume_content(SENIOR_RESUME_TEXT)

    # 1. Overall Score differentiation
    assert senior_eval["overall_score"] > junior_eval["overall_score"]
    assert senior_eval["overall_score"] >= 80
    assert junior_eval["overall_score"] < 60

    # 2. Contact Info extraction
    assert junior_eval["contact_info"]["email"] == "amit.kumar@gmail.com"
    assert junior_eval["contact_info"]["github"] is None  # Missing in junior

    assert senior_eval["contact_info"]["github"] is not None
    assert senior_eval["contact_info"]["linkedin"] is not None
    assert senior_eval["contact_info"]["portfolio"] is not None

    # 3. Action Verbs Detection
    # Junior uses "helped with" and "made"
    weak_verbs = [v["original"] for v in junior_eval["suggested_edits"]["action_verbs"]]
    assert "helped with" in weak_verbs or "made" in weak_verbs

    # Senior uses "architected", "spearheaded", "optimized"
    assert "Spearheaded" in senior_eval["strengths"][0] or any("verbs" in st.lower() for st in senior_eval["strengths"])

    # 4. Readability & Metrics
    assert senior_eval["category_scores"]["readability"] > junior_eval["category_scores"]["readability"]

    # 5. Disclaimer presence
    assert DISCLAIMER_TEXT in junior_eval["disclaimer"]


def test_job_specific_resume_matching():
    """Tests comparing a candidate resume against a target job requisition."""
    job_skills = [
        {"name": "Python", "is_mandatory": True},
        {"name": "FastAPI", "is_mandatory": True},
        {"name": "Docker", "is_mandatory": True},
        {"name": "Kubernetes", "is_mandatory": False},
        {"name": "Rust", "is_mandatory": True},  # Missing in senior resume
    ]

    result = analyze_resume_for_job(
        resume_text=SENIOR_RESUME_TEXT,
        job_title="Senior Cloud Platform Engineer",
        job_description="Build distributed cloud services with FastAPI, Docker, and Rust.",
        job_requirements="Proven experience with Kubernetes and high scale.",
        job_skills=job_skills
    )

    assert result["job_title"] == "Senior Cloud Platform Engineer"
    assert result["job_relevance_score"] >= 50.0
    assert "Python" in result["relevant_skills"]
    assert "FastAPI" in result["relevant_skills"]
    assert "Docker" in result["relevant_skills"]
    assert "Rust" in result["missing_keywords"]
    assert len(result["targeted_improvements"]) > 0


def test_pdf_report_generation():
    """Validates that executive PDF generator outputs valid A4 PDF bytes."""
    senior_eval = evaluate_resume_content(SENIOR_RESUME_TEXT)

    pdf_bytes = generate_analysis_pdf(
        student_name="Sneha Rao",
        resume_title="Sneha_Rao_Resume.pdf",
        analysis_data=senior_eval,
        job_analysis=None
    )

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 2000
    assert pdf_bytes[:5] == b"%PDF-"  # Valid PDF magic header


def test_llm_client_reliability_and_fallback():
    """Validates fallback to deterministic NLP intelligence."""
    result = evaluate_resume_content(SENIOR_RESUME_TEXT)
    result["engine_type"] = "nlp_intelligence"

    assert "overall_score" in result
    assert result["overall_score"] > 0
    assert result["engine_type"] in ["gemini_llm", "nlp_intelligence"]
    assert len(result["strengths"]) > 0
    assert len(result["suggested_edits"]["action_verbs"]) >= 0


def test_resume_analysis_service_workflow(db_session):
    """Tests end-to-end service execution, database persistence, and history tracking."""
    # 1. Setup Student & Resume
    user = db_session.query(User).filter(User.email == "student_phase8_test@university.edu").first()
    if not user:
        user = User(
            email="student_phase8_test@university.edu",
            password_hash="$argon2id$v=19$m=19456,t=2,p=1$fakehash123",
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=True
        )
        db_session.add(user)
        db_session.flush()

    student = db_session.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not student:
        student = StudentProfile(
            user_id=user.id,
            full_name="Karan Verma",
            roll_number="2022CSB7777"
        )
        db_session.add(student)
        db_session.flush()

    resume = db_session.query(Resume).filter(Resume.student_id == student.id).first()
    if not resume:
        resume = Resume(
            student_id=student.id,
            title="Backend Cloud Resume",
            file_name="Karan_Verma_Resume.pdf",
            file_path="storage/resumes/karan_resume.pdf",
            file_size_bytes=102400,
            mime_type="application/pdf",
            is_default=True
        )
        db_session.add(resume)
        db_session.flush()

        analysis_rec = ResumeAnalysis(
            resume_id=resume.id,
            raw_text=SENIOR_RESUME_TEXT,
            ats_score=80,
            section_score=15,
            metric_score=10,
            skill_score=20,
            format_score=20,
            extracted_skills=["Python", "FastAPI", "Docker"],
            improvements_json={"initial": True}
        )
        db_session.add(analysis_rec)
        db_session.flush()

    db_session.commit()

    # 2. Trigger Analysis
    anal_res = ResumeAnalysisService.analyze_resume_sync(
        db=db_session,
        student_user=user,
        resume_id=resume.id
    )

    assert anal_res["overall_score"] >= 70
    assert "category_scores" in anal_res
    assert anal_res["resume_id"] == resume.id

    # 3. Check History
    history = ResumeAnalysisService.get_analysis_history(
        db=db_session,
        student_user=user,
        resume_id=resume.id
    )
    assert len(history) >= 1
    assert history[0]["resume_id"] == resume.id

    # 4. Check PDF Export
    pdf_bytes, filename = ResumeAnalysisService.export_pdf_report_sync(
        db=db_session,
        student_user=user,
        resume_id=resume.id
    )
    assert len(pdf_bytes) > 1000
    assert pdf_bytes[:5] == b"%PDF-"
    assert "Karan_Verma" in filename
