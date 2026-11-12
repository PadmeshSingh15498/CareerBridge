"""
Comprehensive Test Suite for Phase 6: Student Profile & Resume Management.
Tests:
1. Dynamic profile completion calculation (no arbitrary percentages)
2. Personal, Academic, Skills, Projects, and Experience CRUD
3. Valid PDF resume upload, parsing, ATS scoring, and disk persistence
4. Valid DOCX resume upload and parsing
5. Corrupted file rejection (magic bytes validation)
6. Oversized file rejection (> 10MB)
7. Unauthorized cross-student access blocking (security ownership guard)
8. Approved selective merging of extracted data into profile (protecting manual edits)
"""

import io
import os
import pytest
import docx
import fitz  # PyMuPDF
from fastapi import HTTPException

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.student import (
    StudentProfile, AcademicRecord, Skill, StudentSkill,
    StudentProject, StudentCertification, StudentExperience,
    SkillCategoryEnum, ProficiencyLevelEnum
)
from app.models.resume import Resume, ResumeVersion, ResumeAnalysis
from app.services.student_service import StudentService
from app.services.resume_service import ResumeService
from app.schemas.student import (
    PersonalInfoUpdate, AcademicRecordCreate, SkillAddRequest,
    ProjectCreate, CertificationCreate, ExperienceCreate
)
from datetime import date


@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def test_students(db_session):
    """Creates two distinct student accounts for ownership and cross-tenant tests."""
    email_a = "student_alpha_phase6@careerbridge.com"
    email_b = "student_beta_phase6@careerbridge.com"

    user_a = db_session.query(User).filter(User.email == email_a).first()
    if not user_a:
        user_a = User(
            email=email_a,
            password_hash=get_password_hash("Password123!"),
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=True,
        )
        db_session.add(user_a)
        db_session.commit()
        db_session.refresh(user_a)

    user_b = db_session.query(User).filter(User.email == email_b).first()
    if not user_b:
        user_b = User(
            email=email_b,
            password_hash=get_password_hash("Password123!"),
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=True,
        )
        db_session.add(user_b)
        db_session.commit()
        db_session.refresh(user_b)

    student_a = StudentService.get_or_create_student_profile(user_a.id, db_session)
    student_a.full_name = "Alpha Student"
    student_b = StudentService.get_or_create_student_profile(user_b.id, db_session)
    student_b.full_name = "Beta Student"
    db_session.commit()

    return student_a, student_b, user_a, user_b


def create_sample_pdf_bytes() -> bytes:
    """Generates a real valid PDF document in-memory using PyMuPDF."""
    doc = fitz.open()
    page = doc.new_page()
    text = (
        "Aditya Sharma\n"
        "aditya.sharma@nit.edu | +91 9876543210 | linkedin.com/in/aditya-sharma | github.com/aditya-sharma\n\n"
        "EDUCATION\n"
        "National Institute of Technology\n"
        "B.Tech in Computer Science and Engineering | CGPA: 9.1 / 10 | 2022 - 2026\n\n"
        "TECHNICAL SKILLS\n"
        "Languages: Python, TypeScript, C++, SQL, Go\n"
        "Frameworks: React, Next.js, FastAPI, Node.js, Express\n"
        "Databases & Cloud: MySQL, PostgreSQL, Redis, Docker, AWS, Git\n\n"
        "WORK EXPERIENCE\n"
        "Google Cloud - Software Engineering Intern (May 2025 - July 2025)\n"
        "• Architected asynchronous event streaming pipelines handling 50,000 requests/sec with 99.9% uptime.\n"
        "• Automated deployment workflows using Docker and CI/CD, reducing build latency by 45%.\n\n"
        "PROJECTS\n"
        "CareerBridge - AI Career Workspace\n"
        "• Built full-stack platform using FastAPI, Next.js, and PyMuPDF, decreasing student search time by 60%.\n"
        "• Implemented 100-point deterministic ATS rubric scoring and Sentence Transformers matching.\n\n"
        "CERTIFICATIONS\n"
        "AWS Certified Solutions Architect - Associate\n"
    )
    page.insert_text((50, 72), text, fontsize=10)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def create_sample_docx_bytes() -> bytes:
    """Generates a real valid DOCX document in-memory using python-docx."""
    doc = docx.Document()
    doc.add_heading("Sneha Patel", level=1)
    doc.add_paragraph("sneha.patel@nit.edu | +91 9123456789 | github.com/snehapatel")
    
    doc.add_heading("EDUCATION", level=2)
    doc.add_paragraph("National Institute of Technology - B.Tech in Information Technology | CGPA: 8.8 (2022 - 2026)")
    
    doc.add_heading("TECHNICAL SKILLS", level=2)
    doc.add_paragraph("Python, React, FastAPI, Docker, PostgreSQL, Machine Learning, Scikit-learn")
    
    doc.add_heading("PROJECTS", level=2)
    doc.add_paragraph("Distributed Task Queue: Implemented asynchronous worker pool in Go, optimizing throughput by 35%.")
    
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


# =============================================================================
# TEST CASES
# =============================================================================

def test_dynamic_profile_completion(db_session, test_students):
    """Verifies that profile completion is mathematically calculated from real fields without arbitrary percentages."""
    student_a, _, _, _ = test_students

    # Clean existing records for student_a to start fresh
    db_session.query(Resume).filter(Resume.student_id == student_a.id).delete()
    db_session.query(StudentSkill).filter(StudentSkill.student_id == student_a.id).delete()
    db_session.query(StudentProject).filter(StudentProject.student_id == student_a.id).delete()
    db_session.query(StudentExperience).filter(StudentExperience.student_id == student_a.id).delete()
    db_session.query(StudentCertification).filter(StudentCertification.student_id == student_a.id).delete()
    db_session.query(AcademicRecord).filter(AcademicRecord.student_id == student_a.id).delete()
    student_a.phone_number = None
    student_a.city = None
    student_a.bio = None
    student_a.linkedin_url = None
    student_a.github_url = None
    db_session.commit()
    db_session.refresh(student_a)

    # Initial completion score should only have partial personal score (name only: 3 pts out of 100)
    comp_initial = StudentService.calculate_profile_completion(student_a, db_session)
    assert comp_initial.overall_percentage == 3
    assert len(comp_initial.missing_items) > 3
    assert any("phone" in item.lower() for item in comp_initial.missing_items)

    # Update personal details
    StudentService.update_personal_info(
        student_a.id,
        PersonalInfoUpdate(
            phone_number="+91 9876543210",
            city="Bengaluru",
            bio="Passionate Full Stack and AI Engineer striving for excellence.",
            linkedin_url="https://linkedin.com/in/test",
            github_url="https://github.com/test",
        ),
        db_session
    )

    comp_personal = StudentService.calculate_profile_completion(student_a, db_session)
    # Personal is now 15/15
    assert comp_personal.overall_percentage == 15

    # Add Academic Record (20 pts)
    StudentService.add_or_update_academic_record(
        student_a.id,
        AcademicRecordCreate(
            institution_name="National Institute of Technology",
            degree="B.Tech",
            department="Computer Science and Engineering",
            start_year=2022,
            end_year=2026,
            cgpa_or_percentage=9.1,
            backlogs_count=0,
        ),
        db_session
    )

    comp_academic = StudentService.calculate_profile_completion(student_a, db_session)
    # 15 + 20 = 35%
    assert comp_academic.overall_percentage == 35

    # Add 5 Skills (20 pts)
    for skill_name in ["Python", "FastAPI", "React", "PostgreSQL", "Docker"]:
        StudentService.add_skill(
            student_a.id,
            SkillAddRequest(name=skill_name, category="programming_language"),
            db_session
        )

    comp_skills = StudentService.calculate_profile_completion(student_a, db_session)
    # 35 + 20 = 55%
    assert comp_skills.overall_percentage == 55


def test_pdf_resume_upload_parsing_and_persistence(db_session, test_students):
    """Verifies PDF upload, PyMuPDF parsing, ATS scoring, and physical disk persistence."""
    student_a, _, _, _ = test_students

    pdf_bytes = create_sample_pdf_bytes()
    assert pdf_bytes.startswith(b"%PDF-")

    class MockUploadFile:
        def __init__(self, content: bytes, filename: str):
            self.file = io.BytesIO(content)
            self.filename = filename
            self.content_type = "application/pdf"

    upload_file = MockUploadFile(pdf_bytes, "aditya_resume.pdf")

    result = ResumeService.upload_resume(
        student_id=student_a.id,
        file=upload_file,
        title="Aditya Sharma SWE Resume",
        db=db_session
    )

    resume = result["resume"]
    ats_eval = result["ats_eval"]
    parsed = result["parsed_data"]

    # Verify Database Record
    assert resume.id is not None
    assert resume.student_id == student_a.id
    assert resume.file_name == "aditya_resume.pdf"
    assert resume.file_size_bytes == len(pdf_bytes)

    # Verify Disk Persistence
    assert os.path.exists(resume.file_path)
    assert os.path.getsize(resume.file_path) == len(pdf_bytes)

    # Verify Parsing
    assert "aditya.sharma@nit.edu" in parsed["raw_text"]
    assert len(parsed["skills"]) >= 5
    assert any(s["name"] == "Python" for s in parsed["skills"])

    # Verify Deterministic ATS Scoring (should score > 75 on high quality resume)
    assert ats_eval["ats_score"] >= 75
    assert ats_eval["section_score"] > 15
    assert ats_eval["skill_score"] >= 20


def test_docx_resume_upload_and_parsing(db_session, test_students):
    """Verifies DOCX upload and python-docx structured text extraction."""
    _, student_b, _, _ = test_students

    docx_bytes = create_sample_docx_bytes()
    assert docx_bytes.startswith(b"PK\x03\x04")

    class MockDocxUploadFile:
        def __init__(self, content: bytes, filename: str):
            self.file = io.BytesIO(content)
            self.filename = filename
            self.content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    upload_file = MockDocxUploadFile(docx_bytes, "sneha_resume.docx")

    result = ResumeService.upload_resume(
        student_id=student_b.id,
        file=upload_file,
        title="Sneha Patel IT Resume",
        db=db_session
    )

    resume = result["resume"]
    parsed = result["parsed_data"]

    assert resume.file_name == "sneha_resume.docx"
    assert os.path.exists(resume.file_path)
    assert "sneha.patel@nit.edu" in parsed["raw_text"]
    assert any(s["name"] == "PostgreSQL" for s in parsed["skills"])


def test_corrupted_file_rejection(db_session, test_students):
    """Verifies that invalid/corrupted files lacking standard headers are rejected."""
    student_a, _, _, _ = test_students

    corrupted_pdf = b"This is plain text pretending to be a PDF file."

    class MockCorruptFile:
        def __init__(self, content: bytes, filename: str):
            self.file = io.BytesIO(content)
            self.filename = filename
            self.content_type = "application/pdf"

    upload_file = MockCorruptFile(corrupted_pdf, "fake.pdf")

    with pytest.raises(HTTPException) as exc_info:
        ResumeService.upload_resume(student_a.id, upload_file, "Corrupt", db_session)

    assert exc_info.value.status_code == 400
    assert "Corrupted file" in exc_info.value.detail


def test_oversized_file_rejection(db_session, test_students):
    """Verifies that files exceeding 10MB are rejected with HTTP 413."""
    student_a, _, _, _ = test_students

    # 11 MB simulated file
    oversized_bytes = b"%PDF-" + (b"0" * (11 * 1024 * 1024))

    class MockOversizedFile:
        def __init__(self, content: bytes, filename: str):
            self.file = io.BytesIO(content)
            self.filename = filename
            self.content_type = "application/pdf"

    upload_file = MockOversizedFile(oversized_bytes, "huge.pdf")

    with pytest.raises(HTTPException) as exc_info:
        ResumeService.upload_resume(student_a.id, upload_file, "Oversized", db_session)

    assert exc_info.value.status_code == 413


def test_unauthorized_cross_student_access(db_session, test_students):
    """Verifies that Student A cannot access, download, or delete Student B's resume."""
    student_a, student_b, _, _ = test_students

    # Student B's resumes
    b_resumes = ResumeService.get_student_resumes(student_b.id, db_session)
    assert len(b_resumes) > 0
    target_resume_id = b_resumes[0].id

    # Student A attempts to access Student B's resume
    with pytest.raises(HTTPException) as exc_info:
        ResumeService.get_resume_by_id(target_resume_id, student_a.id, db_session)

    assert exc_info.value.status_code == 404

    # Student A attempts to delete Student B's resume
    with pytest.raises(HTTPException) as del_exc:
        ResumeService.delete_resume(target_resume_id, student_a.id, db_session)

    assert del_exc.value.status_code == 404


def test_approved_selective_merge_into_profile(db_session, test_students):
    """Verifies that extracted resume data can be approved and imported without silently overwriting manual data."""
    student_a, _, _, _ = test_students

    resumes = ResumeService.get_student_resumes(student_a.id, db_session)
    assert len(resumes) > 0
    resume_id = resumes[0].id

    # Set manual project first
    manual_proj = StudentService.create_project(
        student_a.id,
        ProjectCreate(
            title="Manual Custom Project",
            description="Manually entered description by the student.",
            technologies_used=["Python", "SQLAlchemy"]
        ),
        db_session
    )

    # Merge extracted data with overwrite_existing=False
    merge_result = ResumeService.apply_extracted_data_to_profile(
        resume_id=resume_id,
        student_id=student_a.id,
        options={
            "apply_personal": True,
            "apply_education": True,
            "apply_skills": True,
            "apply_projects": True,
            "apply_experience": True,
            "overwrite_existing": False,
        },
        db=db_session
    )

    assert merge_result["success"] is True
    assert len(merge_result["applied_sections"]) > 0

    # Verify manual project was NOT deleted or overwritten
    persisted_manual = db_session.query(StudentProject).filter(StudentProject.id == manual_proj.id).first()
    assert persisted_manual is not None
    assert persisted_manual.title == "Manual Custom Project"

    # Verify newly extracted projects were added
    all_projects = db_session.query(StudentProject).filter(StudentProject.student_id == student_a.id).all()
    assert len(all_projects) >= 2
