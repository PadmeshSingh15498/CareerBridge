import pytest
from datetime import datetime, date, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.security import create_access_token, get_password_hash
from app.models.user import User, UserRole, AuditLog
from app.models.student import (
    StudentProfile, PlacementStatusEnum, AcademicRecord, StudentSkill, Skill
)
from app.models.recruiter import Company, RecruiterProfile, CompanySizeEnum
from app.models.job import Job, JobStatusEnum, JobTypeEnum, WorkplaceTypeEnum
from app.models.application import Application, ApplicationStatusEnum, Interview, InterviewStatusEnum
from app.models.drive import PlacementDrive, DriveRegistration, DriveStatusEnum
from app.schemas.admin import (
    StudentStatusUpdateRequest, PlacementDriveCreateRequest,
    RecruiterActionRequest, JobApprovalActionRequest
)
from app.services.admin_service import AdminService


@pytest.fixture
def admin_workspace_fixture(db_session: Session):
    """Provisions admin, TPO, recruiter, and student data for administrative tests."""
    # 1. Admin & TPO users
    admin_user = db_session.query(User).filter(User.email == "tpo_admin@careerbridge.com").first()
    if not admin_user:
        admin_user = User(
            email="tpo_admin@careerbridge.com",
            password_hash=get_password_hash("Admin@123456"),
            role=UserRole.TPO,
            is_active=True,
            is_verified=True
        )
        db_session.add(admin_user)

    student_user = db_session.query(User).filter(User.email == "student_test_user@careerbridge.com").first()
    if not student_user:
        student_user = User(
            email="student_test_user@careerbridge.com",
            password_hash=get_password_hash("Student@123456"),
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=True
        )
        db_session.add(student_user)

    db_session.commit()
    db_session.refresh(admin_user)
    db_session.refresh(student_user)

    # 2. Company & Recruiter
    comp = db_session.query(Company).filter(Company.name == "Apex Infotech AdminTest").first()
    if not comp:
        comp = Company(
            name="Apex Infotech AdminTest",
            website_url="https://apexinfotech.example.com",
            industry="Software & AI",
            company_size=CompanySizeEnum.TIER_51_200,
            verification_status="pending_verification",
            is_verified=False
        )
        db_session.add(comp)
        db_session.flush()

    rec_user = db_session.query(User).filter(User.email == "recruiter_apex@example.com").first()
    if not rec_user:
        rec_user = User(
            email="recruiter_apex@example.com",
            password_hash=get_password_hash("Recruiter@123"),
            role=UserRole.RECRUITER,
            is_active=True,
            is_verified=False
        )
        db_session.add(rec_user)
        db_session.flush()

    rec_profile = db_session.query(RecruiterProfile).filter(RecruiterProfile.user_id == rec_user.id).first()
    if not rec_profile:
        rec_profile = RecruiterProfile(
            user_id=rec_user.id,
            company_id=comp.id,
            designation="University Talent Director"
        )
        db_session.add(rec_profile)
        db_session.flush()

    # 3. Student Profile & Academic Record
    stud_prof = db_session.query(StudentProfile).filter(StudentProfile.user_id == student_user.id).first()
    if not stud_prof:
        stud_prof = StudentProfile(
            user_id=student_user.id,
            full_name="Rajesh Verma",
            roll_number="CS2026-999",
            placement_status=PlacementStatusEnum.UNPLACED
        )
        db_session.add(stud_prof)
        db_session.flush()

    acad_rec = db_session.query(AcademicRecord).filter(AcademicRecord.student_id == stud_prof.id).first()
    if not acad_rec:
        acad_rec = AcademicRecord(
            student_id=stud_prof.id,
            institution_name="National Institute of Technology",
            degree="B.Tech",
            department="Computer Science",
            start_year=2022,
            end_year=2026,
            cgpa_or_percentage=Decimal("8.80"),
            backlogs_count=0
        )
        db_session.add(acad_rec)
        db_session.flush()

    # 4. Job Requisition in PENDING_APPROVAL
    test_job = db_session.query(Job).filter(Job.title == "Junior Cloud Architect (AdminTest)").first()
    if not test_job:
        test_job = Job(
            company_id=comp.id,
            posted_by=rec_profile.id,
            title="Junior Cloud Architect (AdminTest)",
            job_type=JobTypeEnum.FULL_TIME,
            workplace_type=WorkplaceTypeEnum.HYBRID,
            location="Bengaluru, Karnataka",
            description="Manage scalable cloud deployments and Kubernetes clusters.",
            requirements="Solid grasp of Linux, Docker, and AWS.",
            salary_min=Decimal("900000.00"),
            salary_max=Decimal("1400000.00"),
            status=JobStatusEnum.PENDING_APPROVAL,
            application_deadline=datetime.utcnow() + timedelta(days=20)
        )
        db_session.add(test_job)
        db_session.flush()

    db_session.commit()
    return {
        "admin_user": admin_user,
        "student_user": student_user,
        "student_profile": stud_prof,
        "company": comp,
        "recruiter_user": rec_user,
        "recruiter_profile": rec_profile,
        "job": test_job
    }


def test_admin_dashboard_metrics(db_session: Session, admin_workspace_fixture):
    """Validates that admin dashboard calculates real database metrics with mathematical definitions."""
    metrics = AdminService.get_dashboard_metrics(db_session)

    assert metrics.total_registered_students >= 1
    assert metrics.eligible_students >= 0
    assert metrics.placed_students >= 0
    assert metrics.unplaced_students >= 0
    assert metrics.active_recruiters >= 1
    assert metrics.placement_percentage >= 0.0

    # Assert definition formulas are present for every single metric
    defs = metrics.metric_definitions
    assert "total_registered_students" in defs
    assert "eligible_students" in defs
    assert "placed_students" in defs
    assert "placement_percentage" in defs
    assert "COUNT" in defs["total_registered_students"].formula


def test_student_management_list_and_filters(db_session: Session, admin_workspace_fixture):
    """Validates student searching, department filtering, and graduation year filtering."""
    # List all
    res = AdminService.list_students(db_session, page=1, page_size=10)
    assert res.total >= 1
    assert len(res.students) >= 1

    # Search by roll number
    res_search = AdminService.list_students(db_session, search="CS2026-999")
    assert res_search.total >= 1
    assert res_search.students[0].roll_number == "CS2026-999"
    assert res_search.students[0].academic_record is not None
    assert res_search.students[0].academic_record.department == "Computer Science"

    # Filter by department
    res_dept = AdminService.list_students(db_session, department="Computer Science")
    assert res_dept.total >= 1

    # Filter by graduation year
    res_year = AdminService.list_students(db_session, graduation_year=2026)
    assert res_year.total >= 1


def test_student_status_update(db_session: Session, admin_workspace_fixture):
    """Validates updating verification, active status, and placement status with audit trail."""
    admin_user = admin_workspace_fixture["admin_user"]
    stud_prof = admin_workspace_fixture["student_profile"]

    payload = StudentStatusUpdateRequest(
        is_verified=True,
        is_active=True,
        placement_status="placed"
    )

    updated = AdminService.update_student_status(
        db=db_session,
        admin_user=admin_user,
        student_id=stud_prof.id,
        payload=payload
    )

    assert updated.is_verified is True
    assert updated.placement_status == "placed"

    # Verify audit log recorded
    audit = db_session.query(AuditLog).filter(
        AuditLog.action == "update_student_status",
        AuditLog.resource_id == stud_prof.id
    ).first()
    assert audit is not None
    assert audit.details_json["placement_status"] == "placed"


def test_student_csv_import_with_duplicate_detection(db_session: Session, admin_workspace_fixture):
    """Validates CSV batch candidate import and duplicate detection."""
    admin_user = admin_workspace_fixture["admin_user"]

    # Ensure clean test state for test import emails/rolls
    for em in ["aman.gupta.import@example.com", "deepa.nair.import@example.com"]:
        u = db_session.query(User).filter(User.email == em).first()
        if u:
            db_session.delete(u)
    for rn in ["CS2026-101", "CS2026-102"]:
        sp = db_session.query(StudentProfile).filter(StudentProfile.roll_number == rn).first()
        if sp:
            db_session.delete(sp)
    db_session.commit()

    csv_data = """roll_number,full_name,email,department,degree,start_year,end_year,cgpa,backlogs
CS2026-999,Duplicate Rajesh,student_test_user@careerbridge.com,Computer Science,B.Tech,2022,2026,8.8,0
CS2026-101,Aman Gupta,aman.gupta.import@example.com,Information Technology,B.Tech,2022,2026,8.2,0
CS2026-102,Deepa Nair,deepa.nair.import@example.com,Electronics,B.Tech,2022,2026,7.9,1
"""
    result = AdminService.import_students_csv(db_session, admin_user, csv_data)

    assert result.total_rows == 3
    # First row is duplicate of existing roll & email from fixture
    assert result.duplicates_skipped >= 1
    assert len(result.duplicate_details) >= 1
    assert "already registered" in result.duplicate_details[0]
    # Remaining two should be imported
    assert result.imported_count >= 1

    # Verify imported student exists
    imported_stud = db_session.query(StudentProfile).filter(StudentProfile.roll_number == "CS2026-101").first()
    assert imported_stud is not None
    assert imported_stud.full_name == "Aman Gupta"


def test_student_csv_export(db_session: Session, admin_workspace_fixture):
    """Validates CSV export formatting and content."""
    csv_str = AdminService.export_students_csv(db_session)
    assert "Roll Number,Full Name,Email" in csv_str
    assert "CS2026-999" in csv_str
    assert "Computer Science" in csv_str


def test_recruiter_management_workflow(db_session: Session, admin_workspace_fixture):
    """Validates corporate partner verification, rejection, suspension, and reactivation."""
    admin_user = admin_workspace_fixture["admin_user"]
    company = admin_workspace_fixture["company"]
    recruiter_user = admin_workspace_fixture["recruiter_user"]

    # 1. Approve
    res_approve = AdminService.manage_recruiter_company(
        db=db_session,
        admin_user=admin_user,
        company_id=company.id,
        action="approve"
    )
    assert res_approve.is_verified is True
    assert res_approve.verification_status == "verified"

    db_session.refresh(recruiter_user)
    assert recruiter_user.is_verified is True

    # 2. Suspend
    res_suspend = AdminService.manage_recruiter_company(
        db=db_session,
        admin_user=admin_user,
        company_id=company.id,
        action="suspend",
        reason="Compliance violation"
    )
    assert res_suspend.verification_status == "suspended"
    db_session.refresh(recruiter_user)
    assert recruiter_user.is_active is False

    # 3. Reactivate
    res_reactivate = AdminService.manage_recruiter_company(
        db=db_session,
        admin_user=admin_user,
        company_id=company.id,
        action="reactivate"
    )
    assert res_reactivate.verification_status == "verified"
    db_session.refresh(recruiter_user)
    assert recruiter_user.is_active is True


def test_job_approval_workflow(db_session: Session, admin_workspace_fixture):
    """Validates job requisition approval, correction request, and closure."""
    admin_user = admin_workspace_fixture["admin_user"]
    job = admin_workspace_fixture["job"]

    # 1. Request correction
    res_corr = AdminService.review_job_posting(
        db=db_session,
        admin_user=admin_user,
        job_id=job.id,
        action="request_correction",
        comments="Please specify the primary cloud vendor in the requirements."
    )
    assert res_corr.status == "draft"

    # 2. Approve
    res_app = AdminService.review_job_posting(
        db=db_session,
        admin_user=admin_user,
        job_id=job.id,
        action="approve"
    )
    assert res_app.status == "active"

    # 3. Close
    res_close = AdminService.review_job_posting(
        db=db_session,
        admin_user=admin_user,
        job_id=job.id,
        action="close",
        comments="Positions fulfilled."
    )
    assert res_close.status == "closed"


def test_placement_drive_and_automated_eligibility(db_session: Session, admin_workspace_fixture):
    """Validates creating placement drive and identifying eligible students based on criteria."""
    admin_user = admin_workspace_fixture["admin_user"]
    company = admin_workspace_fixture["company"]
    stud_prof = admin_workspace_fixture["student_profile"]

    drive_payload = PlacementDriveCreateRequest(
        title="Apex Cloud Hiring Drive 2026",
        company_id=company.id,
        academic_year=2026,
        drive_date=date.today() + timedelta(days=15),
        registration_deadline=datetime.utcnow() + timedelta(days=10),
        min_cgpa=7.50,
        max_backlogs_allowed=0,
        number_of_openings=5,
        job_roles=["Cloud Engineer", "DevOps Specialist"],
        allowed_departments=["Computer Science", "Information Technology"],
        selection_rounds=["Online Assessment", "Technical Interview", "HR Round"],
        venue="Campus Auditorium & Lab 4"
    )

    created_drive = AdminService.create_drive(db_session, admin_user, drive_payload)
    assert created_drive.id is not None
    assert created_drive.title == "Apex Cloud Hiring Drive 2026"

    # Check automated eligibility identification
    drive_obj, eligible_students = AdminService.get_drive_details_and_eligibility(db_session, created_drive.id)
    assert len(eligible_students) >= 1
    # Rajesh Verma has CGPA 8.80, CS dept, 2026 grad year -> Must be in eligible list!
    matched = next((s for s in eligible_students if s.roll_number == "CS2026-999"), None)
    assert matched is not None
    assert matched.cgpa == 8.80
    assert matched.is_registered is False

    # Register student for the drive
    reg_result = AdminService.register_student_for_drive(db_session, admin_user, created_drive.id, stud_prof.id)
    assert reg_result["status"] == "registered"

    # Check that is_registered is now True
    _, eligible_after_reg = AdminService.get_drive_details_and_eligibility(db_session, created_drive.id)
    matched_after = next((s for s in eligible_after_reg if s.roll_number == "CS2026-999"), None)
    assert matched_after.is_registered is True


def test_placement_analytics_calculation(db_session: Session, admin_workspace_fixture):
    """Validates placement analytics calculations across departments, trends, and salary brackets."""
    analytics = AdminService.get_placement_analytics(db_session, academic_year=2026)

    assert analytics.academic_year == 2026
    assert len(analytics.department_placements) >= 1
    assert len(analytics.salary_distribution) >= 1
    assert analytics.funnel_conversion.total_applications >= 0
    assert len(analytics.readiness_distribution) == 3


def test_reports_generation(db_session: Session, admin_workspace_fixture):
    """Validates PyMuPDF PDF report generation and CSV reports."""
    # PDF summary
    pdf_bytes = AdminService.generate_placement_summary_pdf(db_session)
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF")
    assert len(pdf_bytes) > 1000

    # CSV reports
    dept_csv = AdminService.generate_department_csv(db_session)
    assert "Department,Total Enrolled" in dept_csv

    comp_csv = AdminService.generate_company_csv(db_session)
    assert "Company Name,Industry" in comp_csv

    drive_csv = AdminService.generate_drive_report_csv(db_session)
    assert "Drive Title,Company" in drive_csv


def test_admin_api_endpoints_permissions(db_session: Session, admin_workspace_fixture):
    """Validates RBAC security: student token rejected with 403, TPO/admin token accepted."""
    from app.core.permissions import require_roles
    from app.api.v1.admin import get_admin_dashboard
    from fastapi import HTTPException

    admin_user = admin_workspace_fixture["admin_user"]
    student_user = admin_workspace_fixture["student_user"]

    admin_role_checker = require_roles(["tpo", "admin"])

    # 1. Student accessing admin role checker should raise 403
    with pytest.raises(HTTPException) as exc_info:
        admin_role_checker(current_user=student_user)
    assert exc_info.value.status_code == 403
    assert "Access denied" in exc_info.value.detail

    # 2. TPO accessing admin role checker is authorized
    authorized_user = admin_role_checker(current_user=admin_user)
    assert authorized_user.id == admin_user.id

    # 3. Call endpoint directly with authorized user
    res = get_admin_dashboard(current_user=admin_user, db=db_session)
    assert res.success is True
    assert res.data.total_registered_students >= 1
